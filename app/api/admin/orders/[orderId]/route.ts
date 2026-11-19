import { NextResponse } from "next/server";

import { isAdminEmail, isAdminMutationOriginAllowed } from "@/lib/auth/admin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const BUCKET = "calendar-uploads";

// Older orders paid online are accounting records and stay in the database.
const PAID_ORDER_MESSAGE = "Zaplatenú objednávku nie je možné zmazať.";

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

export async function DELETE(request: Request, { params }: RouteParams) {
  if (!isAdminMutationOriginAllowed(request)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

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
    .select("id, photos, payment_status")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    return NextResponse.json(
      { message: "Objednávka neexistuje." },
      { status: 404 },
    );
  }

  if (order.payment_status === "paid") {
    return NextResponse.json({ message: PAID_ORDER_MESSAGE }, { status: 409 });
  }

  // Conditional delete: never removes an order that is marked paid.
  const { data: deletedOrder, error: deleteError } = await supabaseAdmin
    .from("orders")
    .delete()
    .eq("id", orderId)
    .neq("payment_status", "paid")
    .select("id")
    .maybeSingle();

  if (deleteError) {
    console.error("ADMIN_DELETE_ORDER_ERROR:", { orderId, error: deleteError });

    return NextResponse.json(
      { message: "Objednávku sa nepodarilo zmazať." },
      { status: 500 },
    );
  }

  if (!deletedOrder) {
    const { data: currentOrder } = await supabaseAdmin
      .from("orders")
      .select("payment_status")
      .eq("id", orderId)
      .maybeSingle();

    if (currentOrder?.payment_status === "paid") {
      return NextResponse.json({ message: PAID_ORDER_MESSAGE }, { status: 409 });
    }

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
      // The order row is gone; the photos are now orphaned and need cleanup.
      console.error("ADMIN_DELETE_PHOTOS_ERROR:", {
        orderId,
        photoCount: photoPaths.length,
        error: storageError,
      });

      return NextResponse.json({
        ok: true,
        message:
          "Objednávka bola zmazaná, ale fotky sa nepodarilo odstrániť z úložiska.",
      });
    }
  }

  return NextResponse.json({ ok: true });
}
