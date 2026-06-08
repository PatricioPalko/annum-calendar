import {
  CUSTOM_QUANTITY_VALUE,
  getCalendarPrice,
  getQuantityOptionFromQuantity,
} from "@/app/types/types";
import { getDeliveryPrice } from "@/helpers/delivery";
import { getDiscountAmount } from "@/helpers/discount-codes";
import { sendPendingPaymentEmail } from "@/lib/order-emails";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { z } from "zod";

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
  phone: z.string().optional(),
  note: z.string().optional(),

  type: z.enum(["basic", "premium", "business"]),
  quantity: z.number().int().min(1).max(200),

  photos: z.array(uploadedPhotoSchema).min(14).max(52),

  birthdays: z.array(
    z.object({
      day: z.number().int().min(1).max(31),
      month: z.number().int().min(1).max(12),
      name: z.string().min(1),
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
  discountCode: z.string().max(40).optional(),
});

function verifyFinalizeToken(values: {
  storageFolder: string;
  photoPaths: string[];
  token: string;
}) {
  const secret = process.env.UPLOAD_SIGNING_SECRET;

  if (!secret) {
    throw new Error("Missing UPLOAD_SIGNING_SECRET");
  }

  const [expiresAtStr, signature] = values.token.split(".");
  const expiresAt = Number(expiresAtStr);

  if (!Number.isFinite(expiresAt) || !signature) {
    return false;
  }

  if (Math.floor(Date.now() / 1000) > expiresAt) {
    return false;
  }

  const canonicalPaths = [...values.photoPaths].sort();
  const payload = `${values.storageFolder}|${canonicalPaths.join(",")}|${expiresAt}`;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected),
    );
  } catch {
    return false;
  }
}

function isValidCalendarDayMonth(day: number, month: number) {
  const date = new Date(Date.UTC(2024, month - 1, day));

  return (
    date.getUTCFullYear() === 2024 &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function getCalendarTypeLabel(type: "basic" | "premium" | "business") {
  const labels = {
    basic: "Basic",
    premium: "Premium",
    business: "Business",
  } as const;

  return labels[type];
}

export async function POST(request: Request) {
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
    !verifyFinalizeToken({
      storageFolder: values.storageFolder,
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
      birthdays: values.birthdays,
      namedays: values.namedays,

      delivery_method: values.deliveryMethod,
      delivery_price: deliveryPrice,
      packeta_point_id: values.packetaPoint?.id ?? null,
      packeta_point_name: values.packetaPoint?.name ?? null,
      packeta_point_address: values.packetaPoint?.address ?? null,

      terms_accepted_at: new Date().toISOString(),
    })
    .select("id, order_code, storage_folder")
    .single();

  if (error) {
    console.error("CREATE_ORDER_ERROR:", error);

    return NextResponse.json(
      {
        message: "Nepodarilo sa uložiť objednávku.",
        error: error.message,
      },
      { status: 500 },
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!appUrl) {
    throw new Error("Missing NEXT_PUBLIC_APP_URL");
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: values.email,
    client_reference_id: data.id,

    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: Math.round(finalTotalPrice * 100),
          product_data: {
            name: "Personalizovaný A3 nástenný kalendár",
            description: `${getCalendarTypeLabel(values.type)} · ${
              values.quantity
            } ks · ${values.deliveryMethod === "packeta" ? "Packeta" : "Osobný odber KE"} · ${
              data.order_code
            }`,
          },
        },
      },
    ],

    metadata: {
      orderId: data.id,
      orderCode: data.order_code,
    },

    success_url: `${appUrl}/objednavka/dakujeme?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/objednavka/platba-zrusena?order=${encodeURIComponent(
      data.order_code,
    )}`,

    after_expiration: {
      recovery: {
        enabled: true,
      },
    },
  });

  const { error: paymentUpdateError } = await supabaseAdmin
    .from("orders")
    .update({
      stripe_checkout_session_id: checkoutSession.id,
    })
    .eq("id", data.id);

  if (paymentUpdateError) {
    console.error("STRIPE_SESSION_UPDATE_ERROR:", paymentUpdateError);
  }

  try {
    const paymentUrl = `${appUrl}/api/orders/${encodeURIComponent(
      data.order_code,
    )}/pay`;

    await sendPendingPaymentEmail({
      orderCode: data.order_code,
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      totalPrice: finalTotalPrice,
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
    console.error("PENDING_PAYMENT_EMAIL_ERROR:", emailError);
  }

  return NextResponse.json({
    orderId: data.id,
    orderCode: data.order_code,
    storageFolder: data.storage_folder,
    checkoutUrl: checkoutSession.url,
  });
}
