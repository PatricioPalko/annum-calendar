import { NextResponse } from "next/server";

import { isAdminEmail } from "@/lib/auth/admin";
import { createPacketaPacket, isPacketaConfigured } from "@/lib/packeta";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RouteParams = {
  params: Promise<{
    orderId: string;
  }>;
};

export async function POST(_request: Request, { params }: RouteParams) {
  const { orderId } = await params;

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user || !isAdminEmail(user.email)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!isPacketaConfigured()) {
    return NextResponse.json(
      { message: "Packeta API nie je nakonfigurované." },
      { status: 503 },
    );
  }

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .select(
      `
        id,
        order_code,
        order_number,
        first_name,
        last_name,
        email,
        phone,
        note,
        quantity,
        total_price,
        delivery_price,
        delivery_method,
        packeta_point_id,
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

  if (order.delivery_method !== "packeta") {
    return NextResponse.json(
      { message: "Objednávka nemá doručenie cez Packetu." },
      { status: 400 },
    );
  }

  if (!order.packeta_point_id) {
    return NextResponse.json(
      { message: "Objednávke chýba výdajné miesto Packety." },
      { status: 400 },
    );
  }

  if (order.tracking_number) {
    return NextResponse.json({
      ok: true,
      alreadyExists: true,
      barcode: order.tracking_number,
    });
  }

  const goodsValue = Math.max(
    1,
    Number(order.total_price ?? 0) - Number(order.delivery_price ?? 0),
  );

  try {
    const packet = await createPacketaPacket({
      orderCode: order.order_code ?? order.id,
      orderNumber: order.order_number,
      firstName: order.first_name,
      lastName: order.last_name,
      email: order.email,
      phone: order.phone,
      addressId: order.packeta_point_id,
      value: goodsValue,
      weight: Math.max(0.3, Number((0.35 * order.quantity + 0.25).toFixed(2))),
      note: order.note,
    });

    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({
        tracking_number: packet.barcode,
      })
      .eq("id", order.id);

    if (updateError) {
      console.error("PACKETA_MANUAL_TRACKING_UPDATE_ERROR:", updateError);

      return NextResponse.json(
        { message: "Štítok sa vytvoril, ale nepodarilo sa ho uložiť." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      packet,
    });
  } catch (error) {
    console.error("PACKETA_MANUAL_CREATE_ERROR:", error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Nepodarilo sa vytvoriť štítok v Packete.",
      },
      { status: 502 },
    );
  }
}
