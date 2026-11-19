import {
  CUSTOM_QUANTITY_VALUE,
  getCalendarPrice,
  getQuantityOptionFromQuantity,
} from "@/app/types/types";
import { isValidCalendarDayMonth } from "@/helpers/calendar-date";
import { getDeliveryPrice } from "@/helpers/delivery";
import { getDiscountAmount } from "@/helpers/discount-codes";
import { isStorageFolderForOrderNumber } from "@/helpers/order-code";
import {
  OFFLINE_PAYMENT_STATUS,
  PAYMENT_METHODS,
} from "@/helpers/payment-method";
import {
  isValidSlovakPhone,
  normalizePhone,
} from "@/helpers/phone";
import { getDeliveryWaveForDate } from "@/lib/order/delivery-waves";
import { sendAdminAlertEmail } from "@/lib/order-emails";
import { resendMissingOrderEmails } from "@/lib/order-notifications";
import {
  consumeRateLimit,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rate-limit";
import { verifyFinalizeToken } from "@/lib/upload-finalize-token";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { after, NextResponse } from "next/server";
import { z } from "zod";

import {
  optionalDedicationSchema,
  optionalDiscountCodeSchema,
  optionalNoteSchema,
} from "@/lib/schema";
import {
  MAX_BIRTHDAY_NAME_LENGTH,
  MAX_PHOTOS,
  MEMORY_SET_LABEL,
  MIN_PHOTOS,
} from "@/lib/order/config";

const uploadedPhotoSchema = z.object({
  name: z.string(),
  type: z.string(),
  size: z.number(),
  path: z.string(),
});

const orderBodySchema = z.object({
  orderNumber: z.number().int().positive(),
  orderCode: z.string().min(1),
  storageFolder: z.string().min(1),
  finalizeToken: z.string().min(1),

  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.email(),
  phone: z
    .string()
    .trim()
    .transform((value) => normalizePhone(value))
    .refine((value) => isValidSlovakPhone(value), {
      message: "Zadajte platné slovenské telefónne číslo.",
    }),
  note: optionalNoteSchema,

  type: z.enum(["basic", "premium", "memory"]),
  quantity: z.number().int().min(1).max(200),

  photos: z.array(uploadedPhotoSchema).min(MIN_PHOTOS).max(MAX_PHOTOS),

  birthdays: z.array(
    z.object({
      day: z.number().int().min(1).max(31),
      month: z.number().int().min(1).max(12),
      name: z
        .string()
        .trim()
        .min(1)
        .max(MAX_BIRTHDAY_NAME_LENGTH),
    }),
  ),

  namedays: z.array(
    z.object({
      name: z.string().min(1),
    }),
  ),

  paymentMethod: z.enum(PAYMENT_METHODS),

  termsAccepted: z.literal(true),
  marketingConsent: z.boolean().optional(),
  discountCode: optionalDiscountCodeSchema,

  dedications: z.array(optionalDedicationSchema).optional(),
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rate = await consumeRateLimit("orders-create", ip, {
    windowMs: 10 * 60 * 1000,
    max: 5,
  });

  if (!rate.ok) {
    const limited = rateLimitResponse(rate.retryAfterMs);

    return NextResponse.json(
      { message: limited.message },
      { status: limited.status, headers: limited.headers },
    );
  }

  const body = await request.json();
  const parsed = orderBodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Invalid order payload",
        errors: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const values = parsed.data;

  for (const birthday of values.birthdays) {
    if (!isValidCalendarDayMonth(birthday.day, birthday.month)) {
      return NextResponse.json(
        {
          message: "Invalid order payload",
          errors: {
            fieldErrors: {
              birthdays: ["Neplatný dátum narodenín."],
            },
          },
        },
        { status: 400 },
      );
    }
  }

  if (
    !isStorageFolderForOrderNumber(values.storageFolder, values.orderNumber)
  ) {
    return NextResponse.json(
      {
        message: "Invalid order payload",
        errors: {
          fieldErrors: {
            orderNumber: ["Neplatné číslo objednávky pre úložisko fotiek."],
          },
        },
      },
      { status: 400 },
    );
  }

  for (const photo of values.photos) {
    if (!photo.path.startsWith(`${values.storageFolder}/`)) {
      return NextResponse.json(
        {
          message: "Invalid order payload",
          errors: {
            fieldErrors: {
              photos: ["Neplatná cesta k fotke."],
            },
          },
        },
        { status: 400 },
      );
    }
  }

  if (
    !verifyFinalizeToken({
      storageFolder: values.storageFolder,
      orderNumber: values.orderNumber,
      orderCode: values.orderCode,
      photoPaths: values.photos.map((photo) => photo.path),
      token: values.finalizeToken,
    })
  ) {
    return NextResponse.json(
      {
        message: "Invalid order payload",
        errors: {
          fieldErrors: {
            photos: ["Fotky nie je možné overiť. Skúste to prosím znova."],
          },
        },
      },
      { status: 400 },
    );
  }

  const hasPremiumFeatures =
    values.type === "premium" || values.type === "memory";
  const birthdays = hasPremiumFeatures ? values.birthdays : [];
  const namedays = hasPremiumFeatures ? values.namedays : [];

  if (
    values.dedications?.some((entry) => entry.trim().length > 0) &&
    values.type !== "memory"
  ) {
    return NextResponse.json(
      {
        message: "Invalid order payload",
        errors: {
          fieldErrors: {
            dedications: [
              `Venovanie je možné zadať len pri ${MEMORY_SET_LABEL}.`,
            ],
          },
        },
      },
      { status: 400 },
    );
  }

  const dedications =
    values.type === "memory"
      ? (values.dedications ?? []).map((entry) => entry.trim())
      : [];

  if (values.type === "memory" && dedications.length !== values.quantity) {
    return NextResponse.json(
      {
        message: "Invalid order payload",
        errors: {
          fieldErrors: {
            dedications: ["Počet venovaní musí zodpovedať počtu kalendárov."],
          },
        },
      },
      { status: 400 },
    );
  }

  const quantityOption = getQuantityOptionFromQuantity(values.quantity);

  const price = getCalendarPrice({
    type: values.type,
    quantityOption,
    customQuantity:
      quantityOption === CUSTOM_QUANTITY_VALUE ? values.quantity : undefined,
  });

  // Personal pickup is the only delivery method.
  const deliveryPrice = getDeliveryPrice();

  const discount = getDiscountAmount(price.totalPrice, values.discountCode);

  const finalTotalPrice =
    discount.finalPrice === null ? null : discount.finalPrice + deliveryPrice;

  if (finalTotalPrice === null || finalTotalPrice <= 0) {
    return NextResponse.json(
      {
        message: "Objednávka nemá platnú cenu.",
      },
      { status: 400 },
    );
  }

  const deliveryWave = getDeliveryWaveForDate(new Date());

  const { data, error } = await supabaseAdmin
    .from("orders")
    .insert({
      order_number: values.orderNumber,
      order_code: values.orderCode,
      storage_folder: values.storageFolder,

      first_name: values.firstName,
      last_name: values.lastName,
      email: values.email,
      phone: values.phone ?? null,
      note: values.note?.trim() || null,
      delivery_wave_key: deliveryWave.key,

      calendar_type: values.type,
      quantity: values.quantity,
      total_price: finalTotalPrice,
      discount_code: discount.isValid ? discount.code : null,
      discount_amount: discount.discountAmount,

      payment_status: OFFLINE_PAYMENT_STATUS,
      payment_method: values.paymentMethod,

      photos: values.photos,
      birthdays,
      namedays,

      memory_set_enabled: values.type === "memory",
      dedications,
      dedication: dedications.find((entry) => entry.length > 0) ?? null,

      delivery_method: "pickup",
      delivery_price: deliveryPrice,

      terms_accepted_at: new Date().toISOString(),
      marketing_consent_at: values.marketingConsent
        ? new Date().toISOString()
        : null,
    })
    .select("id, order_code")
    .single();

  if (error) {
    console.error("CREATE_ORDER_ERROR:", error);

    return NextResponse.json(
      {
        message: "Nepodarilo sa uložiť objednávku.",
      },
      { status: 500 },
    );
  }

  // Customer confirmation (with payment instructions) and admin notification.
  // Sent results are recorded on the order; the scheduled retry and the
  // "Odoslať znova" button in /admin cover failures.
  after(async () => {
    const result = await resendMissingOrderEmails(data.id, {
      idempotencyKeyPrefix: `order-created/${data.id}`,
    });

    const failed =
      result.status === "error" ||
      result.status === "not_found" ||
      (result.status === "sent" &&
        ((result.customerRequested && !result.customerSent) ||
          (result.adminRequested && !result.adminSent)));

    if (!failed) {
      return;
    }

    console.error("ORDER_CREATED_EMAIL_ERROR:", {
      orderId: data.id,
      status: result.status,
    });

    // Without this the operator may never learn about the order (e.g. a
    // missing email-tracking migration makes the lookup fail).
    try {
      await sendAdminAlertEmail({
        code: "ORDER_CREATED_EMAIL_FAILED",
        title: "E-mail k novej objednávke",
        summary:
          "Prišla nová objednávka, ale potvrdenie zákazníkovi alebo upozornenie adminovi sa nepodarilo odoslať.",
        orderId: data.id,
        footer:
          "Skontrolujte objednávku v admin paneli a e-mail odošlite tlačidlom „Odoslať znova“.",
      });
    } catch (alertError) {
      console.error("ADMIN_ALERT_EMAIL_ERROR:", {
        code: "ORDER_CREATED_EMAIL_FAILED",
        error: alertError,
      });
    }
  });

  return NextResponse.json({
    orderId: data.id,
    orderCode: data.order_code,
  });
}
