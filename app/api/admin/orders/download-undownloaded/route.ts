import JSZip from "jszip";
import { NextResponse } from "next/server";
import sharp from "sharp";

import { isAdminEmail } from "@/lib/auth/admin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

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

export async function GET() {
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

    const exportData = {
      id: order.id,
      orderCode: order.order_code,
      storageFolder: order.storage_folder,
      createdAt: order.created_at,

      payment: {
        status: order.payment_status,
        paidAt: order.paid_at,
        stripeCheckoutSessionId: order.stripe_checkout_session_id,
        stripePaymentIntentId: order.stripe_payment_intent_id,
      },

      delivery: {
        method: order.delivery_method ?? "pickup",
        label:
          order.delivery_method === "packeta"
            ? "Packeta"
            : "Osobný odber v Košiciach",
        price: Number(order.delivery_price ?? 0),
        packetaPoint: order.packeta_point_id
          ? {
              id: order.packeta_point_id,
              name: order.packeta_point_name,
              address: order.packeta_point_address,
            }
          : null,
        trackingNumber: order.tracking_number ?? null,
        shippedAt: order.shipped_at ?? null,
      },

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
        discountCode: order.discount_code,
        discountAmount: order.discount_amount,
        note: order.note,
      },

      birthdays: order.birthdays ?? [],
      namedays: order.namedays ?? [],
      photoCount: exportPhotos.length,
      photos: exportPhotos,
    };

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
