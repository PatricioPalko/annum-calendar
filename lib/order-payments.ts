import type Stripe from "stripe";

import { sendPaidOrderEmail } from "@/lib/order-emails";
import { syncPacketaPacketForOrder } from "@/lib/packeta";
import { supabaseAdmin } from "@/lib/supabase/admin";

type PaidOrderRow = {
  id: string;
  order_code: string | null;
  order_number: number | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  note: string | null;
  quantity: number;
  total_price: number | null;
  delivery_price: number | string | null;
  delivery_method: string | null;
  packeta_point_id: string | null;
  packeta_point_name: string | null;
  packeta_point_address: string | null;
  tracking_number: string | null;
  payment_status: string | null;
};

const paidOrderSelect = `
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
  packeta_point_name,
  packeta_point_address,
  tracking_number,
  payment_status
`;

export type MarkOrderPaidResult =
  | {
      status: "marked";
      order: PaidOrderRow;
    }
  | {
      status: "already_paid";
      order: PaidOrderRow;
    }
  | {
      status: "skipped";
      reason: string;
    }
  | {
      status: "error";
      message: string;
    };

async function runPostPaymentSideEffects(
  order: PaidOrderRow,
  options: { sendEmail: boolean; syncPacketa: boolean },
) {
  if (
    options.syncPacketa &&
    order.delivery_method === "packeta" &&
    order.packeta_point_id &&
    order.order_code
  ) {
    await syncPacketaPacketForOrder({
      orderId: order.id,
      orderCode: order.order_code,
      orderNumber: order.order_number,
      firstName: order.first_name,
      lastName: order.last_name,
      email: order.email,
      phone: order.phone,
      packetaPointId: order.packeta_point_id,
      goodsValue: Math.max(
        1,
        Number(order.total_price ?? 0) - Number(order.delivery_price ?? 0),
      ),
      quantity: order.quantity,
      note: order.note,
      existingTrackingNumber: order.tracking_number,
    });
  }

  if (options.sendEmail && order.order_code) {
    try {
      await sendPaidOrderEmail({
        orderCode: order.order_code,
        firstName: order.first_name,
        lastName: order.last_name,
        email: order.email,
        totalPrice:
          order.total_price === null || order.total_price === undefined
            ? null
            : Number(order.total_price),
        delivery: {
          method: order.delivery_method === "packeta" ? "packeta" : "pickup",
          price: Number(order.delivery_price ?? 0),
          packetaPoint:
            order.delivery_method === "packeta" && order.packeta_point_id
              ? {
                  id: order.packeta_point_id,
                  name: order.packeta_point_name ?? "",
                  address: order.packeta_point_address ?? "",
                }
              : null,
        },
      });
    } catch (emailError) {
      console.error("PAID_ORDER_EMAIL_ERROR:", emailError);
    }
  }
}

export async function markOrderPaidFromCheckoutSession(
  session: Stripe.Checkout.Session,
  options: { sendEmail?: boolean; syncPacketa?: boolean } = {},
): Promise<MarkOrderPaidResult> {
  const orderId = session.metadata?.orderId;

  if (!orderId) {
    return { status: "skipped", reason: "Missing orderId metadata." };
  }

  if (session.payment_status !== "paid") {
    return { status: "skipped", reason: "Checkout session is not paid." };
  }

  const { data: existingOrder, error: existingOrderError } = await supabaseAdmin
    .from("orders")
    .select(paidOrderSelect)
    .eq("id", orderId)
    .maybeSingle();

  if (existingOrderError || !existingOrder) {
    console.error("MARK_ORDER_PAID_LOOKUP_ERROR:", existingOrderError);

    return {
      status: "error",
      message: existingOrderError?.message ?? "Order not found.",
    };
  }

  if (existingOrder.payment_status === "paid") {
    return {
      status: "already_paid",
      order: existingOrder as PaidOrderRow,
    };
  }

  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .update({
      payment_status: "paid",
      paid_at: new Date().toISOString(),
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : null,
    })
    .eq("id", orderId)
    .neq("payment_status", "paid")
    .select(paidOrderSelect)
    .maybeSingle();

  if (error) {
    console.error("MARK_ORDER_PAID_UPDATE_ERROR:", error);

    return {
      status: "error",
      message: error.message,
    };
  }

  if (!order) {
    const { data: currentOrder } = await supabaseAdmin
      .from("orders")
      .select(paidOrderSelect)
      .eq("id", orderId)
      .maybeSingle();

    if (currentOrder?.payment_status === "paid") {
      return {
        status: "already_paid",
        order: currentOrder as PaidOrderRow,
      };
    }

    return {
      status: "error",
      message: "Failed to mark order as paid.",
    };
  }

  const paidOrder = order as PaidOrderRow;

  await runPostPaymentSideEffects(paidOrder, {
    sendEmail: options.sendEmail ?? true,
    syncPacketa: options.syncPacketa ?? true,
  });

  return {
    status: "marked",
    order: paidOrder,
  };
}
