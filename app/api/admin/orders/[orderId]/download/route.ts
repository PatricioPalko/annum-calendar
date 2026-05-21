import JSZip from "jszip";
import { NextResponse } from "next/server";

import { isAdminEmail } from "@/lib/auth/admin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
      note: order.note,
    },
    birthdays: order.birthdays ?? [],
    namedays: order.namedays ?? [],
    photos: photos.map((photo, index) => ({
      ...photo,
      localPath: `./photos/${index + 1}-${photo.name}`,
    })),
  };

  zip.file("order.json", JSON.stringify(exportData, null, 2));

  const photosFolder = zip.folder("photos");

  if (!photosFolder) {
    return NextResponse.json(
      { message: "Nepodarilo sa vytvoriť ZIP." },
      { status: 500 },
    );
  }

  await Promise.all(
    photos.map(async (photo, index) => {
      const { data, error } = await supabaseAdmin.storage
        .from(BUCKET)
        .download(photo.path);

      if (error || !data) {
        throw new Error(`Nepodarilo sa stiahnuť fotku: ${photo.path}`);
      }

      const arrayBuffer = await data.arrayBuffer();
      const safeName = `${index + 1}-${photo.name}`;

      photosFolder.file(safeName, arrayBuffer);
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
