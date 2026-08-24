import JSZip from "jszip";
import { NextResponse } from "next/server";
import sharp from "sharp";

import { isAdminEmail, isAdminMutationOriginAllowed } from "@/lib/auth/admin";
import { buildOrderExportData } from "@/lib/order-export";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const BUCKET = "calendar-uploads";

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
  const outputBuffer = await sharp(Buffer.from(input), {
    failOn: "none",
    limitInputPixels: 80_000_000,
  })
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

export async function GET(request: Request) {
  if (!isAdminMutationOriginAllowed(request)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user || !isAdminEmail(user.email)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { data: orders, error: ordersError } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("payment_status", "paid")
    .is("downloaded_at", null)
    .neq("status", "completed")
    .order("created_at", { ascending: true });

  if (ordersError) {
    console.error("BULK_DOWNLOAD_ORDERS_ERROR:", ordersError);

    return NextResponse.json(
      { message: "Nepodarilo sa načítať objednávky." },
      { status: 500 },
    );
  }

  if (!orders || orders.length === 0) {
    return NextResponse.json(
      { message: "Nie sú žiadne zaplatené nestiahnuté objednávky." },
      { status: 404 },
    );
  }

  const zip = new JSZip();
  const successfullyExportedOrderIds: string[] = [];

  for (const order of orders) {
    const orderCode = order.order_code ?? order.id;
    const orderFolder = zip.folder(orderCode);

    if (!orderFolder) {
      continue;
    }

    const photos = (order.photos ?? []) as UploadedPhoto[];
    const photosFolder = orderFolder.folder("photos");

    if (!photosFolder) {
      continue;
    }

    const exportPhotos = [];

    for (const [index, photo] of photos.entries()) {
      const fileName = getExportPhotoFileName(photo.name, index);

      const { data, error } = await supabaseAdmin.storage
        .from(BUCKET)
        .download(photo.path);

      if (error || !data) {
        console.error("BULK_DOWNLOAD_PHOTO_ERROR:", {
          orderId: order.id,
          path: photo.path,
          error,
        });

        continue;
      }

      const converted = await convertImageToJpg(await data.arrayBuffer());

      photosFolder.file(fileName, converted.buffer);

      const orientation =
        converted.width >= converted.height ? "landscape" : "portrait";

      exportPhotos.push({
        index: index + 1,
        name: photo.name,
        path: photo.path,
        originalType: photo.type,
        originalSize: photo.size,

        type: "image/jpeg",
        size: converted.buffer.length,
        fileName,
        localPath: `./photos/${fileName}`,

        width: converted.width,
        height: converted.height,
        orientation,

        processed: true,
      });
    }

    const exportData = buildOrderExportData(order, exportPhotos);

    orderFolder.file("order.json", JSON.stringify(exportData, null, 2));
    successfullyExportedOrderIds.push(order.id);
  }

  if (successfullyExportedOrderIds.length === 0) {
    return NextResponse.json(
      { message: "Nepodarilo sa pripraviť žiadnu objednávku na export." },
      { status: 500 },
    );
  }

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
    .in("id", successfullyExportedOrderIds);

  if (updateError) {
    console.error("BULK_MARK_AS_DOWNLOADED_ERROR:", updateError);
  }

  return new Response(zipBuffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="zaplatene-nestiahnute-objednavky.zip"`,
    },
  });
}
