import { NextResponse } from "next/server";
import Stripe from "stripe";

import { markOrderPaidFromCheckoutSession } from "@/lib/order-payments";
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
    const result = await markOrderPaidFromCheckoutSession(session);

    if (result.status === "error") {
      return NextResponse.json(
        { message: result.message },
        { status: 500 },
      );
    }

    if (result.status === "skipped" && result.reason === "Missing orderId metadata.") {
      return NextResponse.json(
        { message: result.reason },
        { status: 400 },
      );
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;

    // Only fail the order when THIS session is still the active checkout session.
    if (orderId) {
      const { error } = await supabaseAdmin
        .from("orders")
        .update({
          payment_status: "failed",
        })
        .eq("id", orderId)
        .eq("stripe_checkout_session_id", session.id)
        .neq("payment_status", "paid");

      if (error) {
        console.error("STRIPE_SESSION_EXPIRED_UPDATE_ERROR:", error);

        return NextResponse.json(
          { message: "Failed to mark expired checkout session." },
          { status: 500 },
        );
      }
    }
  }

  return NextResponse.json({ received: true });
}
