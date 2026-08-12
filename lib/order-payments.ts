import type Stripe from "stripe";

import { sendOrderPaidEmail } from "@/lib/order-emails";
import { syncPacketaPacketForOrder } from "@/lib/packeta";
import { stripe } from "@/lib/stripe";
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
  calendar_type: string;
  quantity: number;
  total_price: number | null;
  delivery_price: number | string | null;
  delivery_method: string | null;
  packeta_point_id: string | null;
  packeta_point_name: string | null;
  packeta_point_address: string | null;
  tracking_number: string | null;
  payment_status: string | null;
  stripe_checkout_session_id: string | null;
  discount_code: string | null;
  discount_amount: number | string | null;
  photos: unknown[] | null;
  birthdays: unknown[] | null;
  namedays: unknown[] | null;
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
  calendar_type,
  quantity,
  total_price,
  delivery_price,
  delivery_method,
  packeta_point_id,
  packeta_point_name,
  packeta_point_address,
  tracking_number,
  payment_status,
  stripe_checkout_session_id,
  discount_code,
  discount_amount,
  photos,
  birthdays,
  namedays
`;

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isAlreadyRefundedError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const stripeError = error as { code?: string; message?: string };

  if (stripeError.code === "charge_already_refunded") {
    return true;
  }

  return (
    typeof stripeError.message === "string" &&
    stripeError.message.toLowerCase().includes("already been refunded")
  );
}

/**
 * Refunds a duplicate paid Checkout session.
 * Returns false when refund could not be confirmed — caller should fail the
 * webhook so Stripe retries.
 */
async function refundDuplicateCheckoutPayment(
  session: Stripe.Checkout.Session,
): Promise<boolean> {
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  if (!paymentIntentId) {
    console.error("DUPLICATE_PAYMENT_REFUND_SKIPPED:", {
      sessionId: session.id,
      reason: "missing_payment_intent",
    });

    return false;
  }

  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await stripe.refunds.create(
        {
          payment_intent: paymentIntentId,
          reason: "duplicate",
          metadata: {
            orderId: session.metadata?.orderId ?? "",
            checkoutSessionId: session.id,
          },
        },
        {
          idempotencyKey: `duplicate-refund:${session.id}`,
        },
      );

      return true;
    } catch (error) {
      if (isAlreadyRefundedError(error)) {
        return true;
      }

      if (attempt === maxAttempts) {
        console.error("DUPLICATE_PAYMENT_REFUND_FAILED:", {
          sessionId: session.id,
          paymentIntentId,
          orderId: session.metadata?.orderId ?? null,
          attempts: maxAttempts,
          action: "stripe_webhook_retry",
          error,
        });

        return false;
      }

      await sleep(250 * 2 ** (attempt - 1));
    }
  }

  return false;
}

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
      existingTrackingNumber: order.tracking_number,
    });
  }

  if (options.sendEmail && order.order_code) {
    try {
      const totalPrice =
        order.total_price === null || order.total_price === undefined
          ? null
          : Number(order.total_price);
      const deliveryPrice = Number(order.delivery_price ?? 0);
      const discountAmount =
        order.discount_amount === null || order.discount_amount === undefined
          ? null
          : Number(order.discount_amount);

      await sendOrderPaidEmail({
        orderCode: order.order_code,
        firstName: order.first_name,
        lastName: order.last_name,
        email: order.email,
        phone: order.phone,
        totalPrice,
        calendarType:
          order.calendar_type === "basic" ||
          order.calendar_type === "premium" ||
          order.calendar_type === "business"
            ? order.calendar_type
            : "basic",
        quantity: order.quantity,
        goodsPrice:
          totalPrice === null ? null : Math.max(0, totalPrice - deliveryPrice),
        discountCode: order.discount_code,
        discountAmount,
        delivery: {
          method: order.delivery_method === "packeta" ? "packeta" : "pickup",
          price: deliveryPrice,
          packetaPoint:
            order.delivery_method === "packeta" && order.packeta_point_id
              ? {
                  id: order.packeta_point_id,
                  name: order.packeta_point_name ?? "",
                  address: order.packeta_point_address ?? "",
                }
              : null,
        },
        photoCount: Array.isArray(order.photos) ? order.photos.length : undefined,
        birthdaysCount: Array.isArray(order.birthdays)
          ? order.birthdays.length
          : undefined,
        namedaysCount: Array.isArray(order.namedays)
          ? order.namedays.length
          : undefined,
        note: order.note,
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
    const paidOrder = existingOrder as PaidOrderRow;

    // A second Checkout session was paid after the order was already marked paid.
    if (
      session.payment_status === "paid" &&
      session.id !== paidOrder.stripe_checkout_session_id
    ) {
      const refunded = await refundDuplicateCheckoutPayment(session);

      if (!refunded) {
        return {
          status: "error",
          message: "Duplicate payment refund failed.",
        };
      }
    }

    return {
      status: "already_paid",
      order: paidOrder,
    };
  }

  if (session.amount_total === null) {
    return { status: "error", message: "Missing payment amount." };
  }

  if (session.currency && session.currency !== "eur") {
    return { status: "error", message: "Unexpected payment currency." };
  }

  if (existingOrder.total_price === null) {
    return { status: "error", message: "Order has no price." };
  }

  const expectedAmountCents = Math.round(Number(existingOrder.total_price) * 100);

  if (session.amount_total !== expectedAmountCents) {
    console.error("PAYMENT_AMOUNT_MISMATCH:", {
      orderId,
      expectedAmountCents,
      actualAmountCents: session.amount_total,
    });

    return { status: "error", message: "Payment amount mismatch." };
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
      const paidOrder = currentOrder as PaidOrderRow;

      // Concurrent mark-paid race: another session already won — refund this one
      // when it is a different paid Checkout session.
      if (session.id !== paidOrder.stripe_checkout_session_id) {
        const refunded = await refundDuplicateCheckoutPayment(session);

        if (!refunded) {
          return {
            status: "error",
            message: "Duplicate payment refund failed.",
          };
        }
      }

      return {
        status: "already_paid",
        order: paidOrder,
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
