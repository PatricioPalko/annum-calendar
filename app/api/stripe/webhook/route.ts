import { NextResponse } from "next/server";
import Stripe from "stripe";

import { sendPaidOrderEmail } from "@/lib/order-emails";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { message: "Missing Stripe webhook config." },
      { status: 400 },
    );
  }

  const rawBody = await request.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error("STRIPE_WEBHOOK_SIGNATURE_ERROR:", error);

    return NextResponse.json(
      { message: "Invalid webhook signature." },
      { status: 400 },
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;

    if (!orderId) {
      return NextResponse.json(
        { message: "Missing orderId metadata." },
        { status: 400 },
      );
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
      .select("id, order_code, first_name, last_name, email, total_price")
      .single();

    if (error) {
      console.error("STRIPE_MARK_PAID_ERROR:", error);

      return NextResponse.json(
        { message: "Failed to mark order as paid." },
        { status: 500 },
      );
    }

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
      });
    } catch (emailError) {
      console.error("PAID_ORDER_EMAIL_ERROR:", emailError);
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;

    if (orderId) {
      const { error } = await supabaseAdmin
        .from("orders")
        .update({
          payment_status: "failed",
        })
        .eq("id", orderId)
        .neq("payment_status", "paid");

      if (error) {
        console.error("STRIPE_SESSION_EXPIRED_UPDATE_ERROR:", error);
      }
    }
  }

  return NextResponse.json({ received: true });
}
