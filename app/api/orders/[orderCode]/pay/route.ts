import { NextResponse } from "next/server";

import { getDeliveryLabel } from "@/helpers/delivery";
import { verifyOrderPaymentToken } from "@/lib/order-payment-token";
import {
  consumeRateLimit,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rate-limit";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";

type RouteParams = {
  params: Promise<{
    orderCode: string;
  }>;
};

function getCalendarTypeLabel(type: string) {
  switch (type) {
    case "basic":
      return "Basic";
    case "premium":
      return "Premium";
    case "business":
      return "Business";
    default:
      return "Kalendár";
  }
}

export async function GET(request: Request, { params }: RouteParams) {
  const ip = getClientIp(request);
  const rate = consumeRateLimit("orders-pay", ip, {
    windowMs: 10 * 60 * 1000,
    max: 10,
  });

  if (!rate.ok) {
    const limited = rateLimitResponse(rate.retryAfterMs);

    return NextResponse.json(
      { message: limited.message },
      { status: limited.status, headers: limited.headers },
    );
  }

  const { orderCode } = await params;
  const token = new URL(request.url).searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(
      new URL("/objednavka?payment=invalid-link", request.url),
    );
  }

  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .select(
      "id, order_code, email, calendar_type, quantity, total_price, payment_status, delivery_method",
    )
    .eq("order_code", orderCode)
    .single();

  if (error || !order) {
    return NextResponse.redirect(
      new URL("/objednavka?payment=order-not-found", request.url),
    );
  }

  if (
    !verifyOrderPaymentToken(order.id, order.order_code ?? orderCode, token)
  ) {
    return NextResponse.redirect(
      new URL("/objednavka?payment=invalid-link", request.url),
    );
  }

  if (order.payment_status === "paid") {
    return NextResponse.redirect(
      new URL(
        `/objednavka/dakujeme?order=${encodeURIComponent(order.order_code)}`,
        request.url,
      ),
    );
  }

  if (order.total_price === null || Number(order.total_price) <= 0) {
    return NextResponse.redirect(
      new URL("/objednavka?payment=invalid-price", request.url),
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!appUrl) {
    return NextResponse.json(
      { message: "Server nie je správne nakonfigurovaný." },
      { status: 500 },
    );
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: order.email,
    client_reference_id: order.id,

    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: Math.round(Number(order.total_price) * 100),
          product_data: {
            name: "Personalizovaný A3 nástenný kalendár",
            description: `${getCalendarTypeLabel(order.calendar_type)} · ${
              order.quantity
            } ks · ${getDeliveryLabel(order.delivery_method)} · ${order.order_code}`,
          },
        },
      },
    ],

    metadata: {
      orderId: order.id,
      orderCode: order.order_code,
    },

    success_url: `${appUrl}/objednavka/dakujeme?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/objednavka/platba-zrusena?order=${encodeURIComponent(
      order.order_code,
    )}`,

    after_expiration: {
      recovery: {
        enabled: true,
      },
    },
  });

  const { error: updateError } = await supabaseAdmin
    .from("orders")
    .update({
      stripe_checkout_session_id: checkoutSession.id,
    })
    .eq("id", order.id);

  if (updateError) {
    console.error("STRIPE_RETRY_SESSION_UPDATE_ERROR:", updateError);
  }

  if (!checkoutSession.url) {
    return NextResponse.redirect(
      new URL("/objednavka?payment=session-error", request.url),
    );
  }

  return NextResponse.redirect(checkoutSession.url);
}
