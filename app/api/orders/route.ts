import { NextResponse } from "next/server";
import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabase/admin";

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

  photos: z.array(uploadedPhotoSchema).min(1).max(50),

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
      note: values.note ?? null,

      calendar_type: values.type,
      quantity: values.quantity,

      photos: values.photos,
      birthdays: values.birthdays,
      namedays: values.namedays,
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

  return NextResponse.json({
    orderId: data.id,
    orderCode: data.order_code,
    storageFolder: data.storage_folder,
  });
}
