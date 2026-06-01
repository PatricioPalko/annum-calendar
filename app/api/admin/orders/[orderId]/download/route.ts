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
  const outputBuffer = await sharp(Buffer.from(input))
    .rotate()
    .flatten({ background: "#ffffff" })
    .toColorspace("srgb")
    .jpeg({
      quality: 95,
      progressive: false,
      mozjpeg: true,
    })
    .toBuffer();

  const metadata = await sharp(outputBuffer).metadata();

  return {
    buffer: outputBuffer,
    width: metadata.width ?? 0,
    height: metadata.height ?? 0,
  };
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

  const zip = new JSZip();
  const photosFolder = zip.folder("photos");

  if (!photosFolder) {
    return NextResponse.json(
      { message: "Nepodarilo sa vytvoriť ZIP." },
      { status: 500 },
    );
  }

  const exportPhotos = await Promise.all(
    photos.map(async (photo, index) => {
      const fileName = getExportPhotoFileName(photo.name, index);

      const { data, error } = await supabaseAdmin.storage
        .from(BUCKET)
        .download(photo.path);

      if (error || !data) {
        throw new Error(`Nepodarilo sa stiahnuť fotku: ${photo.path}`);
      }

      const converted = await convertImageToJpg(await data.arrayBuffer());

      photosFolder.file(fileName, converted.buffer);

      const orientation =
        converted.width >= converted.height ? "landscape" : "portrait";

      return {
        index: index + 1,
        name: photo.name,
        path: photo.path,
        originalType: photo.type,
        size: photo.size,
        type: "image/jpeg",
        fileName,
        localPath: `./photos/${fileName}`,
        width: converted.width,
        height: converted.height,
        orientation,
      };
    }),
  );

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
    photos: exportPhotos,
  };

  zip.file("order.json", JSON.stringify(exportData, null, 2));

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
