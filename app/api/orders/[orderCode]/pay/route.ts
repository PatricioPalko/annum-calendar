import { NextResponse } from "next/server";

import { getDeliveryLabel } from "@/helpers/delivery";
import { getOrCreateOrderCheckoutSession } from "@/lib/order-checkout";
import { verifyOrderPaymentToken } from "@/lib/order-payment-token";
import {
  consumeRateLimit,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rate-limit";
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
  const rate = await consumeRateLimit("orders-pay", ip, {
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
      "id, order_code, email, calendar_type, quantity, total_price, payment_status, delivery_method, stripe_checkout_session_id",
    )
    .eq("order_code", orderCode)
    .single();

  // Same redirect for missing order and bad token — avoid order_code oracle.
  if (
    error ||
    !order ||
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

  const checkoutResult = await getOrCreateOrderCheckoutSession({
    order: {
      id: order.id,
      order_code: order.order_code ?? orderCode,
      email: order.email,
      calendar_type: order.calendar_type,
      quantity: order.quantity,
      total_price: Number(order.total_price),
      delivery_method: order.delivery_method,
      stripe_checkout_session_id: order.stripe_checkout_session_id,
    },
    appUrl,
    productDescription: `${getCalendarTypeLabel(order.calendar_type)} · ${
      order.quantity
    } ks · ${
      order.delivery_method === "packeta" || order.delivery_method === "pickup"
        ? getDeliveryLabel(order.delivery_method)
        : "Doručenie"
    } · ${order.order_code}`,
  });

  if (checkoutResult.status === "already_paid") {
    return NextResponse.redirect(
      new URL(
        `/objednavka/dakujeme?order=${encodeURIComponent(order.order_code)}`,
        request.url,
      ),
    );
  }

  if (checkoutResult.status !== "ok") {
    return NextResponse.redirect(
      new URL("/objednavka?payment=session-error", request.url),
    );
  }

  return NextResponse.redirect(checkoutResult.url);
}
