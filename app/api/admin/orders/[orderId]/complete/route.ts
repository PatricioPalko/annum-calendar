import { NextResponse } from "next/server";

import { isFulfillablePaymentStatus } from "@/helpers/payment-method";
import { isAdminEmail, isAdminMutationOriginAllowed } from "@/lib/auth/admin";
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
    .select("id, payment_status, status")
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

  if (order.status === "completed") {
    const { error: revertError } = await supabaseAdmin
      .from("orders")
      .update({
        status: "ready",
        completed_at: null,
      })
      .eq("id", order.id);

    if (revertError) {
      console.error("ORDER_UNCOMPLETE_ERROR:", revertError);

      return NextResponse.json(
        { message: "Nepodarilo sa odznačiť objednávku ako vybavenú." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, uncompleted: true });
  }

  const { error: updateError } = await supabaseAdmin
    .from("orders")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  if (updateError) {
    console.error("ORDER_COMPLETE_ERROR:", updateError);

    return NextResponse.json(
      { message: "Nepodarilo sa označiť objednávku ako vybavenú." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
