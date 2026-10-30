import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { isAdminEmail, isAdminMutationOriginAllowed } from "@/lib/auth/admin";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const BUCKET = "calendar-uploads";

const PAID_ORDER_MESSAGE =
  "Zaplatenú objednávku nie je možné zmazať. Pri zrušení ju najprv refundujte v Stripe.";

const PAYMENT_IN_PROGRESS_MESSAGE =
  "K objednávke už prebehla platba alebo sa práve spracúva. Objednávku nie je možné zmazať.";

type RouteParams = {
  params: Promise<{
    orderId: string;
  }>;
};

type UploadedPhoto = {
  name: string;
  type: string;
  size: number;
  path: string;
};

type CheckoutSessionCloseResult = "closed" | "payment_started" | "error";

function isStripeResourceMissing(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "resource_missing"
  );
}

function hasPaymentStarted(session: Stripe.Checkout.Session) {
  return session.status === "complete" || session.payment_status === "paid";
}

/**
 * Makes sure the order's Checkout session can no longer be paid before the
 * order is deleted. A session that is already complete (paid or async payment
 * pending) blocks deletion so the webhook can still find the order.
 */
async function closeCheckoutSession(
  sessionId: string,
): Promise<CheckoutSessionCloseResult> {
  let session: Stripe.Checkout.Session;

  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (error) {
    // Unknown to this Stripe account, so nothing can be paid through it.
    if (isStripeResourceMissing(error)) {
      return "closed";
    }

    console.error("ADMIN_DELETE_SESSION_RETRIEVE_ERROR:", { sessionId, error });
    return "error";
  }

  if (hasPaymentStarted(session)) {
    return "payment_started";
  }

  if (session.status !== "open") {
    return "closed";
  }

  try {
    await stripe.checkout.sessions.expire(sessionId);
    return "closed";
  } catch (error) {
    // The customer may have completed the session in the meantime.
    try {
      const latest = await stripe.checkout.sessions.retrieve(sessionId);

      if (hasPaymentStarted(latest)) {
        return "payment_started";
      }

      if (latest.status === "expired") {
        return "closed";
      }
    } catch {
      // Fall through to the generic error below.
    }

    console.error("ADMIN_DELETE_SESSION_EXPIRE_ERROR:", { sessionId, error });
    return "error";
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
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
    .select("id, photos, payment_status, stripe_checkout_session_id")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    return NextResponse.json(
      { message: "Objednávka neexistuje." },
      { status: 404 },
    );
  }

  if (order.payment_status === "paid") {
    return NextResponse.json({ message: PAID_ORDER_MESSAGE }, { status: 409 });
  }

  if (order.stripe_checkout_session_id) {
    const sessionResult = await closeCheckoutSession(
      order.stripe_checkout_session_id,
    );

    if (sessionResult === "payment_started") {
      return NextResponse.json(
        { message: PAYMENT_IN_PROGRESS_MESSAGE },
        { status: 409 },
      );
    }

    if (sessionResult === "error") {
      return NextResponse.json(
        {
          message:
            "Nepodarilo sa overiť platbu v Stripe. Objednávka nebola zmazaná, skúste to znova.",
        },
        { status: 502 },
      );
    }
  }

  // Conditional delete: a webhook may have marked the order paid meanwhile.
  const { data: deletedOrder, error: deleteError } = await supabaseAdmin
    .from("orders")
    .delete()
    .eq("id", orderId)
    .neq("payment_status", "paid")
    .select("id")
    .maybeSingle();

  if (deleteError) {
    console.error("ADMIN_DELETE_ORDER_ERROR:", { orderId, error: deleteError });

    return NextResponse.json(
      { message: "Objednávku sa nepodarilo zmazať." },
      { status: 500 },
    );
  }

  if (!deletedOrder) {
    const { data: currentOrder } = await supabaseAdmin
      .from("orders")
      .select("payment_status")
      .eq("id", orderId)
      .maybeSingle();

    if (currentOrder?.payment_status === "paid") {
      return NextResponse.json({ message: PAID_ORDER_MESSAGE }, { status: 409 });
    }

    return NextResponse.json(
      { message: "Objednávka neexistuje." },
      { status: 404 },
    );
  }

  const photos = (order.photos ?? []) as UploadedPhoto[];
  const photoPaths = photos.map((photo) => photo.path).filter(Boolean);

  if (photoPaths.length > 0) {
    const { error: storageError } = await supabaseAdmin.storage
      .from(BUCKET)
      .remove(photoPaths);

    if (storageError) {
      // The order row is gone; the photos are now orphaned and need cleanup.
      console.error("ADMIN_DELETE_PHOTOS_ERROR:", {
        orderId,
        photoCount: photoPaths.length,
        error: storageError,
      });

      return NextResponse.json({
        ok: true,
        message:
          "Objednávka bola zmazaná, ale fotky sa nepodarilo odstrániť z úložiska.",
      });
    }
  }

  return NextResponse.json({ ok: true });
}
