import { NextResponse } from "next/server";

import { isAdminEmail } from "@/lib/auth/admin";
import { sendOrderFulfillmentEmail } from "@/lib/order-emails";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RouteParams = {
  params: Promise<{
    orderId: string;
  }>;
};

export async function POST(request: Request, { params }: RouteParams) {
  const { orderId } = await params;

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user || !isAdminEmail(user.email)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    trackingNumber?: string;
  };

  const trackingNumber = body.trackingNumber?.trim() || null;

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .select(
      `
        id,
        order_code,
        first_name,
        email,
        payment_status,
        delivery_method,
        delivery_price,
        packeta_point_id,
        packeta_point_name,
        packeta_point_address,
        tracking_number
      `,
    )
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    return NextResponse.json(
      { message: "Objednávka neexistuje." },
      { status: 404 },
    );
  }

  if (order.payment_status !== "paid") {
    return NextResponse.json(
      { message: "Objednávka ešte nie je zaplatená." },
      { status: 403 },
    );
  }

  const isPacketa = order.delivery_method === "packeta";
  const resolvedTrackingNumber = isPacketa
    ? trackingNumber ?? order.tracking_number
    : null;
  const now = new Date().toISOString();

  const { error: updateError } = await supabaseAdmin
    .from("orders")
    .update({
      status: isPacketa ? "shipped" : "ready",
      ready_at: isPacketa ? null : now,
      shipped_at: isPacketa ? now : null,
      tracking_number: isPacketa ? resolvedTrackingNumber : null,
    })
    .eq("id", order.id);

  if (updateError) {
    console.error("ORDER_FULFILLMENT_UPDATE_ERROR:", updateError);

    return NextResponse.json(
      { message: "Nepodarilo sa aktualizovať stav objednávky." },
      { status: 500 },
    );
  }

  await sendOrderFulfillmentEmail({
    orderCode: order.order_code,
    firstName: order.first_name,
    email: order.email,
    trackingNumber: resolvedTrackingNumber,
    delivery: {
      method: isPacketa ? "packeta" : "pickup",
      price: Number(order.delivery_price ?? 0),
      packetaPoint:
        isPacketa && order.packeta_point_id
          ? {
              id: order.packeta_point_id,
              name: order.packeta_point_name ?? "",
              address: order.packeta_point_address ?? "",
            }
          : null,
    },
  });

  return NextResponse.json({ ok: true });
}
