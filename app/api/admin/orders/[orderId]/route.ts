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

export async function DELETE(_request: Request, { params }: RouteParams) {
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
    .select("id, photos")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    return NextResponse.json(
      { message: "Objednávka neexistuje." },
      { status: 404 },
    );
  }

  const photos = (order.photos ?? []) as UploadedPhoto[];
  const photoPaths = photos.map((photo) => photo.path).filter(Boolean);

  if (photoPaths.length > 0) {
    const { error: storageError } = await supabaseAdmin.storage
      .from(BUCKET)
      .remove(photoPaths);

    if (storageError) {
      return NextResponse.json(
        { message: "Fotky sa nepodarilo zmazať." },
        { status: 500 },
      );
    }
  }

  const { error: deleteError } = await supabaseAdmin
    .from("orders")
    .delete()
    .eq("id", orderId);

  if (deleteError) {
    return NextResponse.json(
      { message: "Objednávku sa nepodarilo zmazať." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
