import { NextResponse } from "next/server";
import { z } from "zod";

import { createOrderCode, createStorageFolder } from "@/helpers/order-code";
import { supabaseAdmin } from "@/lib/supabase/admin";

const BUCKET = "calendar-uploads";
const MAX_FILES = 50;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"] as const;
const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];

function hasAllowedImageExtension(fileName: string) {
  const lowerName = fileName.toLowerCase();

  return allowedExtensions.some((extension) => lowerName.endsWith(extension));
}

const bodySchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  files: z
    .array(
      z
        .object({
          name: z.string().min(1),
          type: z.string(),
          size: z.number().max(MAX_FILE_SIZE),
        })
        .refine(
          (file) =>
            allowedMimeTypes.includes(
              file.type as (typeof allowedMimeTypes)[number],
            ) || hasAllowedImageExtension(file.name),
          {
            message: "Nepodporovaný typ súboru.",
          },
        ),
    )
    .min(1)
    .max(MAX_FILES),
});

function normalizeFileName(fileName: string) {
  return fileName
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

export async function POST(request: Request) {
  const json = await request.json();
  const parsed = bodySchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Invalid upload request",
        errors: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const { firstName, lastName, files: inputFiles } = parsed.data;

  const { data: orderNumberData, error: orderNumberError } =
    await supabaseAdmin.rpc("next_order_number");

  if (orderNumberError || orderNumberData === null) {
    console.error("ORDER_NUMBER_ERROR:", orderNumberError);

    return NextResponse.json(
      { message: "Nepodarilo sa vytvoriť číslo objednávky." },
      { status: 500 },
    );
  }

  const orderNumber = Number(orderNumberData);
  const year = new Date().getFullYear();

  const orderCode = createOrderCode({
    firstName,
    lastName,
    year,
    orderNumber,
  });

  const storageFolder = createStorageFolder({
    year,
    orderNumber,
  });

  const files = await Promise.all(
    inputFiles.map(async (file, index) => {
      const safeName = normalizeFileName(file.name);

      const path = `${storageFolder}/${index + 1}-${crypto.randomUUID()}-${safeName}`;

      const { data, error } = await supabaseAdmin.storage
        .from(BUCKET)
        .createSignedUploadUrl(path);

      if (error) {
        throw error;
      }

      return {
        name: file.name,
        type: file.type,
        size: file.size,
        path,
        token: data.token,
      };
    }),
  );

  return NextResponse.json({
    orderNumber,
    orderCode,
    storageFolder,
    files,
  });
}
