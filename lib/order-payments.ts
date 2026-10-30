import { after } from "next/server";
import type Stripe from "stripe";

import {
  sendAdminAlertEmail,
  sendOrderPaidEmail,
  type OrderPaidEmailResult,
  type SendOrderPaidEmailOptions,
} from "@/lib/order-emails";
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
  delivery_wave_key: string | null;
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
  dedications: unknown[] | null;
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
  delivery_wave_key,
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
  namedays,
  dedications
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

function getPaymentIntentId(session: Stripe.Checkout.Session) {
  return typeof session.payment_intent === "string"
    ? session.payment_intent
    : session.payment_intent?.id ?? null;
}

/**
 * Runs work after the response is sent (webhook acknowledges Stripe quickly,
 * thank-you page renders without waiting for emails). Falls back to running
 * immediately when called outside a request scope.
 */
function runAfterResponse(task: () => Promise<void>) {
  try {
    after(task);
  } catch {
    void task();
  }
}

/** Best-effort operator alert; never throws. */
function alertAdmin(params: Parameters<typeof sendAdminAlertEmail>[0]) {
  runAfterResponse(async () => {
    try {
      await sendAdminAlertEmail(params);
    } catch (error) {
      console.error("ADMIN_ALERT_EMAIL_ERROR:", { code: params.code, error });
    }
  });
}

const refundKinds = {
  duplicate: {
    reason: "duplicate",
    idempotencyPrefix: "duplicate-refund",
    logCode: "DUPLICATE_PAYMENT_REFUND",
  },
  missing_order: {
    reason: "requested_by_customer",
    idempotencyPrefix: "missing-order-refund",
    logCode: "MISSING_ORDER_PAYMENT_REFUND",
  },
} as const;

/**
 * Refunds a paid Checkout session that must not be kept (a second payment for
 * an already paid order, or a payment for an order that no longer exists).
 * Returns false when refund could not be confirmed — caller should fail the
 * webhook so Stripe retries.
 */
async function refundCheckoutPayment(
  session: Stripe.Checkout.Session,
  kind: keyof typeof refundKinds,
): Promise<boolean> {
  const { reason, idempotencyPrefix, logCode } = refundKinds[kind];
  const paymentIntentId = getPaymentIntentId(session);

  if (!paymentIntentId) {
    console.error(`${logCode}_SKIPPED:`, {
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
          reason,
          metadata: {
            orderId: session.metadata?.orderId ?? "",
            checkoutSessionId: session.id,
          },
        },
        {
          idempotencyKey: `${idempotencyPrefix}:${session.id}`,
        },
      );

      return true;
    } catch (error) {
      if (isAlreadyRefundedError(error)) {
        return true;
      }

      if (attempt === maxAttempts) {
        console.error(`${logCode}_FAILED:`, {
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

async function refundDuplicateCheckoutPayment(
  session: Stripe.Checkout.Session,
): Promise<boolean> {
  const refunded = await refundCheckoutPayment(session, "duplicate");

  alertAdmin({
    code: refunded ? "DUPLICATE_PAYMENT_REFUNDED" : "DUPLICATE_PAYMENT_REFUND_FAILED",
    summary: refunded
      ? "Zákazník zaplatil už zaplatenú objednávku druhýkrát. Druhá platba bola automaticky refundovaná."
      : "Zákazník zaplatil už zaplatenú objednávku druhýkrát a automatický refund zlyhal. Refundujte platbu ručne v Stripe.",
    orderId: session.metadata?.orderId ?? null,
    checkoutSessionId: session.id,
    paymentIntentId: getPaymentIntentId(session),
  });

  return refunded;
}

export type ResendPaidOrderEmailsResult =
  | { status: "not_found" }
  | { status: "not_paid" }
  | { status: "nothing_to_send" }
  | {
      status: "sent";
      customerRequested: boolean;
      adminRequested: boolean;
      customerSent: boolean;
      adminSent: boolean;
    }
  | { status: "error"; message: string };

/**
 * Sends only the paid-order emails that have not been recorded as sent.
 * The admin button passes no idempotency key, because the resend is
 * intentional; the scheduled retry passes one per time bucket.
 */
export async function resendMissingPaidOrderEmails(
  orderId: string,
  options: { idempotencyKeyPrefix?: string } = {},
): Promise<ResendPaidOrderEmailsResult> {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select(`${paidOrderSelect}, customer_confirmed_at, admin_notified_at`)
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    console.error("RESEND_PAID_EMAILS_LOOKUP_ERROR:", { orderId, error });
    return { status: "error", message: error.message };
  }

  if (!data) {
    return { status: "not_found" };
  }

  const order = data as PaidOrderRow & {
    customer_confirmed_at: string | null;
    admin_notified_at: string | null;
  };

  if (order.payment_status !== "paid") {
    return { status: "not_paid" };
  }

  const customerRequested = order.customer_confirmed_at === null;
  const adminRequested = order.admin_notified_at === null;

  if (!customerRequested && !adminRequested) {
    return { status: "nothing_to_send" };
  }

  const result = await sendPaidOrderEmails(order, {
    customer: customerRequested,
    admin: adminRequested,
    idempotencyKeyPrefix: options.idempotencyKeyPrefix,
  });

  if (!result) {
    return { status: "error", message: "Order has no order code." };
  }

  return {
    status: "sent",
    customerRequested,
    adminRequested,
    customerSent: result.customerSent,
    adminSent: result.adminSent,
  };
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

/**
 * Sends the paid-order emails (customer confirmation and admin notification)
 * and records which ones went out in `customer_confirmed_at` /
 * `admin_notified_at`, so failures stay visible in the admin and can be resent.
 */
export async function sendPaidOrderEmails(
  order: PaidOrderRow,
  emailOptions: SendOrderPaidEmailOptions = {},
): Promise<OrderPaidEmailResult | null> {
  if (!order.order_code) {
    console.error("PAID_ORDER_EMAIL_SKIPPED:", {
      orderId: order.id,
      reason: "missing_order_code",
    });

    return null;
  }

  const totalPrice =
    order.total_price === null || order.total_price === undefined
      ? null
      : Number(order.total_price);
  const deliveryPrice = Number(order.delivery_price ?? 0);
  const discountAmount =
    order.discount_amount === null || order.discount_amount === undefined
      ? null
      : Number(order.discount_amount);

  const result = await sendOrderPaidEmail(
    {
      orderCode: order.order_code,
      firstName: order.first_name,
      lastName: order.last_name,
      email: order.email,
      phone: order.phone,
      totalPrice,
      calendarType:
        order.calendar_type === "basic" ||
        order.calendar_type === "premium" ||
        order.calendar_type === "memory" ||
        order.calendar_type === "business"
          ? order.calendar_type
          : "basic",
      quantity: order.quantity,
      // Goods price before the discount, so goods − discount + delivery = total
      // (matches the price passed to sendOrderCreatedEmail).
      goodsPrice:
        totalPrice === null
          ? null
          : Math.max(0, totalPrice - deliveryPrice + (discountAmount ?? 0)),
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
      deliveryWaveKey: order.delivery_wave_key,
      photoCount: Array.isArray(order.photos) ? order.photos.length : undefined,
      birthdaysCount: Array.isArray(order.birthdays)
        ? order.birthdays.length
        : undefined,
      namedaysCount: Array.isArray(order.namedays)
        ? order.namedays.length
        : undefined,
      dedications: Array.isArray(order.dedications)
        ? order.dedications.filter(
            (entry): entry is string =>
              typeof entry === "string" && entry.trim().length > 0,
          )
        : undefined,
      note: order.note,
    },
    emailOptions,
  );

  if (result.customerError) {
    console.error("PAID_ORDER_CUSTOMER_EMAIL_ERROR:", {
      orderId: order.id,
      error: result.customerError,
    });
  }

  if (result.adminError) {
    console.error("PAID_ORDER_ADMIN_EMAIL_ERROR:", {
      orderId: order.id,
      error: result.adminError,
    });
  }

  const sentAt = new Date().toISOString();
  const emailStatus: { customer_confirmed_at?: string; admin_notified_at?: string } =
    {};

  if (result.customerSent) {
    emailStatus.customer_confirmed_at = sentAt;
  }

  if (result.adminSent) {
    emailStatus.admin_notified_at = sentAt;
  }

  if (Object.keys(emailStatus).length > 0) {
    // Fails harmlessly (logged) until the email-tracking migration is applied.
    const { error } = await supabaseAdmin
      .from("orders")
      .update(emailStatus)
      .eq("id", order.id);

    if (error) {
      console.error("ORDER_EMAIL_STATUS_UPDATE_ERROR:", {
        orderId: order.id,
        error,
      });
    }
  }

  return result;
}

export async function markOrderPaidFromCheckoutSession(
  session: Stripe.Checkout.Session,
  options: { sendEmail?: boolean } = {},
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

  if (existingOrderError) {
    console.error("MARK_ORDER_PAID_LOOKUP_ERROR:", existingOrderError);

    return {
      status: "error",
      message: existingOrderError.message,
    };
  }

  if (!existingOrder) {
    // Paid session for an order that no longer exists (e.g. deleted in the
    // admin while its Checkout session was still open). Keeping the money
    // without an order is never correct, so refund it and tell the operator.
    const refunded = await refundCheckoutPayment(session, "missing_order");

    alertAdmin({
      code: refunded
        ? "PAYMENT_FOR_MISSING_ORDER_REFUNDED"
        : "PAYMENT_FOR_MISSING_ORDER_REFUND_FAILED",
      summary: refunded
        ? "Prišla platba k objednávke, ktorá už neexistuje. Platba bola automaticky refundovaná."
        : "Prišla platba k objednávke, ktorá už neexistuje, a automatický refund zlyhal. Refundujte platbu ručne v Stripe.",
      orderId,
      checkoutSessionId: session.id,
      paymentIntentId: getPaymentIntentId(session),
    });

    if (!refunded) {
      return {
        status: "error",
        message: "Order not found and refund failed.",
      };
    }

    console.error("PAYMENT_FOR_MISSING_ORDER_REFUNDED:", {
      orderId,
      sessionId: session.id,
    });

    return { status: "skipped", reason: "Order not found; payment refunded." };
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
    console.error("PAYMENT_CURRENCY_MISMATCH:", {
      orderId,
      sessionId: session.id,
      currency: session.currency,
    });

    alertAdmin({
      code: "PAYMENT_CURRENCY_MISMATCH",
      summary:
        "Platba prišla v inej mene ako EUR. Objednávka nebola označená ako zaplatená.",
      orderId,
      checkoutSessionId: session.id,
      paymentIntentId: getPaymentIntentId(session),
    });

    return { status: "error", message: "Unexpected payment currency." };
  }

  if (existingOrder.total_price === null) {
    alertAdmin({
      code: "PAID_ORDER_WITHOUT_PRICE",
      summary:
        "Prišla platba k objednávke bez uloženej ceny. Objednávka nebola označená ako zaplatená.",
      orderId,
      checkoutSessionId: session.id,
      paymentIntentId: getPaymentIntentId(session),
    });

    return { status: "error", message: "Order has no price." };
  }

  const expectedAmountCents = Math.round(Number(existingOrder.total_price) * 100);

  if (session.amount_total !== expectedAmountCents) {
    console.error("PAYMENT_AMOUNT_MISMATCH:", {
      orderId,
      expectedAmountCents,
      actualAmountCents: session.amount_total,
    });

    alertAdmin({
      code: "PAYMENT_AMOUNT_MISMATCH",
      summary:
        "Zaplatená suma nesedí s cenou objednávky. Objednávka nebola označená ako zaplatená; skontrolujte ju a platbu ručne.",
      orderId,
      checkoutSessionId: session.id,
      paymentIntentId: getPaymentIntentId(session),
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

  // Only the call that won the conditional update sends emails. They run after
  // the response so Stripe gets a fast 2xx; failures are recorded on the order
  // (customer_confirmed_at / admin_notified_at stay null) and can be resent.
  if (options.sendEmail ?? true) {
    runAfterResponse(async () => {
      try {
        await sendPaidOrderEmails(paidOrder, {
          idempotencyKeyPrefix: `order-paid/${paidOrder.id}`,
        });
      } catch (error) {
        console.error("PAID_ORDER_EMAIL_ERROR:", { orderId: paidOrder.id, error });
      }
    });
  }

  return {
    status: "marked",
    order: paidOrder,
  };
}
