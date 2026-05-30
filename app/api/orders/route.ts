import {
  CUSTOM_QUANTITY_VALUE,
  getCalendarPrice,
  getQuantityOptionFromQuantity,
} from "@/app/types/types";
import { sendOrderEmails } from "@/lib/order-emails";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { z } from "zod";

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

  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.email(),
  phone: z.string().optional(),
  note: z.string().optional(),

  type: z.enum(["basic", "premium", "business"]),
  quantity: z.number().int().min(1).max(200),

  photos: z.array(uploadedPhotoSchema).min(2).max(50),

  birthdays: z.array(
    z.object({
      day: z.number(),
      month: z.number(),
      name: z.string(),
    }),
  ),

  namedays: z.array(
    z.object({
      name: z.string(),
    }),
  ),

  termsAccepted: z.literal(true),
});

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

  const quantityOption = getQuantityOptionFromQuantity(values.quantity);

  const price = getCalendarPrice({
    type: values.type,
    quantityOption,
    customQuantity:
      quantityOption === CUSTOM_QUANTITY_VALUE ? values.quantity : undefined,
  });

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
      total_price: price.totalPrice,

      photos: values.photos,
      birthdays: values.birthdays,
      namedays: values.namedays,

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

  try {
    await sendOrderEmails({
      orderId: data.id,
      orderCode: data.order_code,
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      phone: values.phone,
      type: values.type,
      quantity: values.quantity,
      photos: values.photos,
      note: values.note?.trim() || null,
      totalPrice: price.totalPrice,
    });
  } catch (emailError) {
    console.error("ORDER_EMAIL_ERROR:", emailError);
  }

  return NextResponse.json({
    orderId: data.id,
    orderCode: data.order_code,
    storageFolder: data.storage_folder,
  });
}
