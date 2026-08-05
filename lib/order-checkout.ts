import { createOrderPaymentToken } from "@/lib/order-payment-token";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type CheckoutOrder = {
  id: string;
  order_code: string;
  email: string;
  calendar_type: string;
  quantity: number;
  total_price: number;
  delivery_method: string | null;
  stripe_checkout_session_id: string | null;
};

type CreateCheckoutParams = {
  order: CheckoutOrder;
  appUrl: string;
  productDescription: string;
};

export type OrderCheckoutResult =
  | { status: "ok"; url: string; sessionId: string }
  | { status: "already_paid" }
  | { status: "error"; message: string };

type PersistCheckoutResult =
  | { status: "ok" }
  | { status: "already_paid" }
  | { status: "lost_race"; currentSessionId: string }
  | { status: "error" };

function buildCancelUrl(appUrl: string, orderId: string, orderCode: string) {
  const token = createOrderPaymentToken(orderId, orderCode);

  // Opaque order id in the URL — avoid putting name-based order_code in browser history.
  return `${appUrl}/objednavka/platba-zrusena?orderId=${encodeURIComponent(
    orderId,
  )}&token=${encodeURIComponent(token)}`;
}

async function expireCheckoutSession(sessionId: string) {
  try {
    await stripe.checkout.sessions.expire(sessionId);
  } catch (error) {
    console.error("STRIPE_SESSION_EXPIRE_ERROR:", { sessionId, error });
  }
}

async function loadOpenCheckoutSession(
  sessionId: string,
): Promise<OrderCheckoutResult | null> {
  try {
    const existing = await stripe.checkout.sessions.retrieve(sessionId);

    if (existing.payment_status === "paid") {
      return { status: "already_paid" };
    }

    if (existing.status === "open" && existing.url) {
      return {
        status: "ok",
        url: existing.url,
        sessionId: existing.id,
      };
    }
  } catch (error) {
    console.error("STRIPE_SESSION_RETRIEVE_ERROR:", error);
  }

  return null;
}

/**
 * Persist session id only when it still matches the expected previous value.
 * Prevents concurrent creates from overwriting each other and leaving orphans.
 */
async function persistCheckoutSessionId(
  orderId: string,
  sessionId: string,
  expectedPreviousSessionId: string | null,
): Promise<PersistCheckoutResult> {
  let query = supabaseAdmin
    .from("orders")
    .update({
      stripe_checkout_session_id: sessionId,
    })
    .eq("id", orderId)
    .neq("payment_status", "paid");

  if (expectedPreviousSessionId === null) {
    query = query.is("stripe_checkout_session_id", null);
  } else {
    query = query.eq("stripe_checkout_session_id", expectedPreviousSessionId);
  }

  const { data, error } = await query.select("id, payment_status").maybeSingle();

  if (error) {
    console.error("STRIPE_SESSION_UPDATE_ERROR:", error);
    return { status: "error" };
  }

  if (data) {
    return { status: "ok" };
  }

  const { data: current } = await supabaseAdmin
    .from("orders")
    .select("payment_status, stripe_checkout_session_id")
    .eq("id", orderId)
    .maybeSingle();

  if (current?.payment_status === "paid") {
    return { status: "already_paid" };
  }

  if (
    current?.stripe_checkout_session_id &&
    current.stripe_checkout_session_id !== sessionId
  ) {
    return {
      status: "lost_race",
      currentSessionId: current.stripe_checkout_session_id,
    };
  }

  return { status: "error" };
}

/**
 * Reuses an open Checkout session for the order when possible.
 * Creates a new session only when none is reusable.
 */
export async function getOrCreateOrderCheckoutSession(
  params: CreateCheckoutParams,
): Promise<OrderCheckoutResult> {
  const { order, appUrl, productDescription } = params;

  if (!order.order_code) {
    return { status: "error", message: "Order code missing." };
  }

  if (order.total_price <= 0) {
    return { status: "error", message: "Invalid order price." };
  }

  let expectedPreviousSessionId: string | null =
    order.stripe_checkout_session_id;

  if (order.stripe_checkout_session_id) {
    const reusable = await loadOpenCheckoutSession(
      order.stripe_checkout_session_id,
    );

    if (reusable) {
      return reusable;
    }
  }

  // Re-check DB before creating another session (payment / concurrent create).
  const { data: latestOrder } = await supabaseAdmin
    .from("orders")
    .select("payment_status, stripe_checkout_session_id")
    .eq("id", order.id)
    .maybeSingle();

  if (latestOrder?.payment_status === "paid") {
    return { status: "already_paid" };
  }

  expectedPreviousSessionId = latestOrder?.stripe_checkout_session_id ?? null;

  if (
    expectedPreviousSessionId &&
    expectedPreviousSessionId !== order.stripe_checkout_session_id
  ) {
    const reusable = await loadOpenCheckoutSession(expectedPreviousSessionId);

    if (reusable) {
      return reusable;
    }
  }

  if (expectedPreviousSessionId) {
    await expireCheckoutSession(expectedPreviousSessionId);
  }

  const cancelUrl = buildCancelUrl(appUrl, order.id, order.order_code);

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: order.email,
      client_reference_id: order.id,

      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: Math.round(order.total_price * 100),
            product_data: {
              name: "Personalizovaný A3 nástenný kalendár",
              description: productDescription,
            },
          },
        },
      ],

      metadata: {
        orderId: order.id,
        orderCode: order.order_code,
      },

      success_url: `${appUrl}/objednavka/dakujeme?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,

      after_expiration: {
        recovery: {
          enabled: true,
        },
      },
    });

    const persistResult = await persistCheckoutSessionId(
      order.id,
      checkoutSession.id,
      expectedPreviousSessionId,
    );

    if (persistResult.status === "already_paid") {
      await expireCheckoutSession(checkoutSession.id);
      return { status: "already_paid" };
    }

    if (persistResult.status === "lost_race") {
      await expireCheckoutSession(checkoutSession.id);

      const winner = await loadOpenCheckoutSession(persistResult.currentSessionId);

      if (winner) {
        return winner;
      }

      return {
        status: "error",
        message: "Nepodarilo sa uložiť platobnú session.",
      };
    }

    if (persistResult.status === "error") {
      await expireCheckoutSession(checkoutSession.id);

      return {
        status: "error",
        message: "Nepodarilo sa uložiť platobnú session.",
      };
    }

    if (!checkoutSession.url) {
      await expireCheckoutSession(checkoutSession.id);
      return { status: "error", message: "Missing checkout URL." };
    }

    return {
      status: "ok",
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    };
  } catch (error) {
    console.error("STRIPE_CHECKOUT_CREATE_ERROR:", error);

    return {
      status: "error",
      message: "Nepodarilo sa vytvoriť platobnú session.",
    };
  }
}
