import JSZip from "jszip";
import { NextResponse } from "next/server";

import { isAdminEmail } from "@/lib/auth/admin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const BUCKET = "calendar-uploads";

type UploadedPhoto = {
  name: string;
  type: string;
  size: number;
  path: string;
};

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
    .is("downloaded_at", null)
    .order("created_at", { ascending: true });

  if (ordersError) {
    return NextResponse.json(
      { message: "Nepodarilo sa načítať objednávky." },
      { status: 500 },
    );
  }

  if (!orders || orders.length === 0) {
    return NextResponse.json(
      { message: "Nie sú žiadne nestiahnuté objednávky." },
      { status: 404 },
    );
  }

  const zip = new JSZip();

  for (const order of orders) {
    const orderCode = order.order_code ?? order.id;
    const orderFolder = zip.folder(orderCode);

    if (!orderFolder) continue;

    const photos = (order.photos ?? []) as UploadedPhoto[];

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

    orderFolder.file("order.json", JSON.stringify(exportData, null, 2));

    const photosFolder = orderFolder.folder("photos");

    if (!photosFolder) continue;

    for (const [index, photo] of photos.entries()) {
      const { data, error } = await supabaseAdmin.storage
        .from(BUCKET)
        .download(photo.path);

      if (error || !data) {
        continue;
      }

      const arrayBuffer = await data.arrayBuffer();

      photosFolder.file(`${index + 1}-${photo.name}`, arrayBuffer);
    }
  }

  const zipBuffer = await zip.generateAsync({
    type: "arraybuffer",
    compression: "DEFLATE",
    compressionOptions: {
      level: 6,
    },
  });

  await supabaseAdmin
    .from("orders")
    .update({
      downloaded_at: new Date().toISOString(),
    })
    .in(
      "id",
      orders.map((order) => order.id),
    );

  return new Response(zipBuffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="nestiahnute-objednavky.zip"`,
    },
  });
}
