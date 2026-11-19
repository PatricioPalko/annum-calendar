import { NextResponse } from "next/server";

import { isFulfillablePaymentStatus } from "@/helpers/payment-method";
import { isAdminEmail, isAdminMutationOriginAllowed } from "@/lib/auth/admin";
import { sendOrderFulfillmentEmail } from "@/lib/order-emails";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RouteParams = {
  params: Promise<{
    orderId: string;
  }>;
};

export async function POST(request: Request, { params }: RouteParams) {
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
    .select(
      `
        id,
        order_code,
        first_name,
        email,
        payment_status
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

  if (!isFulfillablePaymentStatus(order.payment_status)) {
    return NextResponse.json(
      { message: "Objednávka ešte nie je zaplatená." },
      { status: 403 },
    );
  }

  // Personal pickup is the only delivery method: the order becomes "ready".
  const { error: updateError } = await supabaseAdmin
    .from("orders")
    .update({
      status: "ready",
      ready_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  if (updateError) {
    console.error("ORDER_FULFILLMENT_UPDATE_ERROR:", updateError);

    return NextResponse.json(
      { message: "Nepodarilo sa aktualizovať stav objednávky." },
      { status: 500 },
    );
  }

  try {
    await sendOrderFulfillmentEmail({
      orderCode: order.order_code,
      firstName: order.first_name,
      email: order.email,
    });
  } catch (emailError) {
    console.error("ORDER_FULFILLMENT_EMAIL_ERROR:", emailError);

    return NextResponse.json(
      { message: "Stav sa uložil, ale e-mail sa nepodarilo odoslať." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
