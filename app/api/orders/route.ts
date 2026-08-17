import {
  CUSTOM_QUANTITY_VALUE,
  getCalendarPrice,
  getQuantityOptionFromQuantity,
} from "@/app/types/types";
import { isValidCalendarDayMonth } from "@/helpers/calendar-date";
import { getDeliveryPrice } from "@/helpers/delivery";
import { getDiscountAmount, discountAllowsPickup } from "@/helpers/discount-codes";
import { isStorageFolderForOrderNumber } from "@/helpers/order-code";
import {
  isValidSlovakPhone,
  normalizePhone,
} from "@/helpers/phone";
import { getOrCreateOrderCheckoutSession } from "@/lib/order-checkout";
import { sendOrderCreatedEmail } from "@/lib/order-emails";
import { buildOrderPaymentUrl } from "@/lib/order-payment-token";
import {
  consumeRateLimit,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rate-limit";
import { verifyFinalizeToken } from "@/lib/upload-finalize-token";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  MAX_BIRTHDAY_NAME_LENGTH,
  MAX_PHOTOS,
  MIN_PHOTOS,
} from "@/lib/order/config";

const uploadedPhotoSchema = z.object({
  name: z.string(),
  type: z.string(),
  size: z.number(),
  path: z.string(),
});

const packetaPointSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  address: z.string().min(1),
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
  note: z.string().optional(),

  type: z.enum(["basic", "premium", "business"]),
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

  deliveryMethod: z.enum(["pickup", "packeta"]),
  packetaPoint: packetaPointSchema.optional(),

  termsAccepted: z.literal(true),
  marketingConsent: z.boolean().optional(),
  discountCode: z.string().max(40).optional(),
});

function getCalendarTypeLabel(type: "basic" | "premium" | "business") {
  const labels = {
    basic: "Basic",
    premium: "Premium",
    business: "Business",
  } as const;

  return labels[type];
}

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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!appUrl || !process.env.ORDER_PAYMENT_SIGNING_SECRET) {
    console.error("CREATE_ORDER_CONFIG_ERROR: missing NEXT_PUBLIC_APP_URL or ORDER_PAYMENT_SIGNING_SECRET");

    return NextResponse.json(
      { message: "Server nie je správne nakonfigurovaný." },
      { status: 500 },
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

  if (values.type === "business" && values.quantity < 10) {
    return NextResponse.json(
      {
        message: "Invalid order payload",
        errors: {
          fieldErrors: {
            quantity: ["Business objednávka je dostupná od 10 kusov."],
          },
        },
      },
      { status: 400 },
    );
  }

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

  if (values.deliveryMethod === "packeta" && !values.packetaPoint) {
    return NextResponse.json(
      {
        message: "Invalid order payload",
        errors: {
          fieldErrors: {
            packetaPoint: ["Vyberte výdajné miesto alebo Z-BOX Packety."],
          },
        },
      },
      { status: 400 },
    );
  }

  if (
    values.deliveryMethod === "pickup" &&
    !discountAllowsPickup(values.discountCode)
  ) {
    return NextResponse.json(
      {
        message: "Invalid order payload",
        errors: {
          fieldErrors: {
            deliveryMethod: [
              "Osobný odber je dostupný len so zľavovým kódom RODINA15.",
            ],
          },
        },
      },
      { status: 400 },
    );
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

  const birthdays = values.type === "premium" ? values.birthdays : [];
  const namedays = values.type === "premium" ? values.namedays : [];

  const quantityOption = getQuantityOptionFromQuantity(values.quantity);

  const price = getCalendarPrice({
    type: values.type,
    quantityOption,
    customQuantity:
      quantityOption === CUSTOM_QUANTITY_VALUE ? values.quantity : undefined,
  });

  const deliveryPrice = getDeliveryPrice(values.deliveryMethod);

  const discount = getDiscountAmount(price.totalPrice, values.discountCode);

  const finalTotalPrice =
    discount.finalPrice === null ? null : discount.finalPrice + deliveryPrice;

  if (finalTotalPrice === null || finalTotalPrice <= 0) {
    return NextResponse.json(
      {
        message: "Objednávka nemá platnú cenu pre online platbu.",
      },
      { status: 400 },
    );
  }

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

      calendar_type: values.type,
      quantity: values.quantity,
      total_price: finalTotalPrice,
      discount_code: discount.isValid ? discount.code : null,
      discount_amount: discount.discountAmount,

      payment_status: "pending",

      photos: values.photos,
      birthdays,
      namedays,

      delivery_method: values.deliveryMethod,
      delivery_price: deliveryPrice,
      packeta_point_id: values.packetaPoint?.id ?? null,
      packeta_point_name: values.packetaPoint?.name ?? null,
      packeta_point_address: values.packetaPoint?.address ?? null,

      terms_accepted_at: new Date().toISOString(),
      marketing_consent_at: values.marketingConsent
        ? new Date().toISOString()
        : null,
    })
    .select("id, order_code, storage_folder")
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

  const checkoutResult = await getOrCreateOrderCheckoutSession({
    order: {
      id: data.id,
      order_code: data.order_code,
      email: values.email,
      calendar_type: values.type,
      quantity: values.quantity,
      total_price: finalTotalPrice,
      delivery_method: values.deliveryMethod,
      stripe_checkout_session_id: null,
    },
    appUrl,
    productDescription: `${getCalendarTypeLabel(values.type)} · ${
      values.quantity
    } ks · ${values.deliveryMethod === "packeta" ? "Packeta" : "Osobný odber KE"} · ${
      data.order_code
    }`,
  });

  if (checkoutResult.status !== "ok") {
    console.error("CREATE_ORDER_CHECKOUT_ERROR:", checkoutResult);

    const { error: cleanupError } = await supabaseAdmin
      .from("orders")
      .delete()
      .eq("id", data.id)
      .eq("payment_status", "pending");

    if (cleanupError) {
      console.error("CREATE_ORDER_CHECKOUT_CLEANUP_ERROR:", cleanupError);
    }

    return NextResponse.json(
      {
        message: "Platbu sa nepodarilo spustiť. Skúste to prosím znova.",
      },
      { status: 500 },
    );
  }

  try {
    const paymentUrl = buildOrderPaymentUrl(data.id, data.order_code);

    await sendOrderCreatedEmail({
      orderCode: data.order_code,
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      phone: values.phone ?? null,
      totalPrice: finalTotalPrice,
      goodsPrice: price.totalPrice,
      discountCode: discount.isValid ? discount.code : null,
      discountAmount: discount.discountAmount,
      calendarType: values.type,
      quantity: values.quantity,
      photoCount: values.photos.length,
      birthdaysCount: birthdays.length,
      namedaysCount: namedays.length,
      note: values.note?.trim() || null,
      paymentUrl,
      delivery: {
        method: values.deliveryMethod,
        price: deliveryPrice,
        packetaPoint:
          values.deliveryMethod === "packeta" && values.packetaPoint
            ? {
                id: values.packetaPoint.id,
                name: values.packetaPoint.name,
                address: values.packetaPoint.address,
              }
            : null,
      },
    });
  } catch (emailError) {
    console.error("ORDER_CREATED_EMAIL_ERROR:", emailError);
  }

  return NextResponse.json({
    orderId: data.id,
    orderCode: data.order_code,
    storageFolder: data.storage_folder,
    checkoutUrl: checkoutResult.url,
  });
}
