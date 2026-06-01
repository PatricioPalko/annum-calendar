import JSZip from "jszip";
import { NextResponse } from "next/server";
import sharp from "sharp";

import { isAdminEmail } from "@/lib/auth/admin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const BUCKET = "calendar-uploads";

type RouteParams = {
  params: Promise<{
    orderId: string;
  }>;
};

type UploadedPhoto = {
  name: string;
  type: string;
  size: number;
  path: string;
};

function getExportPhotoFileName(originalName: string, index: number) {
  const safeBaseName = originalName
    .replace(/\.[^/.]+$/, "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  return `${String(index + 1).padStart(3, "0")}-${safeBaseName}.jpg`;
}

async function convertImageToJpg(input: ArrayBuffer) {
  return sharp(Buffer.from(input))
    .rotate()
    .flatten({ background: "#ffffff" })
    .toColorspace("srgb")
    .jpeg({
      quality: 100,
      progressive: false,
      mozjpeg: true,
    })
    .toBuffer();
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { orderId } = await params;

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user || !isAdminEmail(user.email)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    return NextResponse.json(
      { message: "Objednávka neexistuje." },
      { status: 404 },
    );
  }

  const photos = (order.photos ?? []) as UploadedPhoto[];
  const orderCode = order.order_code ?? order.id;

  const exportPhotos = photos.map((photo, index) => {
    const fileName = getExportPhotoFileName(photo.name, index);

    return {
      ...photo,
      type: "image/jpeg",
      fileName,
      localPath: `./photos/${fileName}`,
    };
  });

  const exportData = {
    id: order.id,
    orderCode: order.order_code,
    storageFolder: order.storage_folder,
    createdAt: order.created_at,
    customer: {
      firstName: order.first_name,
      lastName: order.last_name,
      email: order.email,
      phone: order.phone,
    },
    calendar: {
      type: order.calendar_type,
      quantity: order.quantity,
      totalPrice: order.total_price,
      note: order.note,
    },
    birthdays: order.birthdays ?? [],
    namedays: order.namedays ?? [],
    photoCount: exportPhotos.length,
    photos: exportPhotos.map((photo, index) => ({
      index: index + 1,
      name: photo.name,
      path: photo.path,
      size: photo.size,
      type: "image/jpeg",
      fileName: photo.fileName,
      localPath: photo.localPath,
    })),
  };

  const zip = new JSZip();
  zip.file("order.json", JSON.stringify(exportData, null, 2));

  const photosFolder = zip.folder("photos");

  if (!photosFolder) {
    return NextResponse.json(
      { message: "Nepodarilo sa vytvoriť ZIP." },
      { status: 500 },
    );
  }

  await Promise.all(
    exportPhotos.map(async (photo) => {
      const { data, error } = await supabaseAdmin.storage
        .from(BUCKET)
        .download(photo.path);

      if (error || !data) {
        throw new Error(`Nepodarilo sa stiahnuť fotku: ${photo.path}`);
      }

      const inputArrayBuffer = await data.arrayBuffer();
      const outputBuffer = await convertImageToJpg(inputArrayBuffer);

      photosFolder.file(photo.fileName, outputBuffer);
    }),
  );

  const zipBuffer = await zip.generateAsync({
    type: "arraybuffer",
    compression: "DEFLATE",
    compressionOptions: {
      level: 6,
    },
  });

  const { error: updateError } = await supabaseAdmin
    .from("orders")
    .update({
      downloaded_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  if (updateError) {
    console.error("MARK_AS_DOWNLOADED_ERROR:", updateError);
  }

  return new Response(zipBuffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${orderCode}.zip"`,
    },
  });
}
