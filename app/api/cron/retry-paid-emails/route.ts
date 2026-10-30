import crypto from "node:crypto";
import { NextResponse } from "next/server";

import { sendAdminAlertEmail } from "@/lib/order-emails";
import { resendMissingPaidOrderEmails } from "@/lib/order-payments";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Leaves the webhook's own after() send time to finish first. */
const MIN_AGE_MS = 5 * 60 * 1000;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const BATCH_SIZE = 20;
const HOUR_MS = 60 * 60 * 1000;

function isAuthorized(request: Request, secret: string) {
  const header = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;

  // Hash both sides so timingSafeEqual gets equal-length buffers.
  const digest = (value: string) =>
    crypto.createHash("sha256").update(value).digest();

  return crypto.timingSafeEqual(digest(header), digest(expected));
}

async function alertRetryFailed(orderId: string) {
  try {
    await sendAdminAlertEmail({
      code: "PAID_ORDER_EMAIL_RETRY_FAILED",
      title: "E-mail k zaplatenej objednávke",
      summary:
        "Automatické opätovné odoslanie e-mailu k zaplatenej objednávke zlyhalo.",
      orderId,
      footer:
        "Skontrolujte Resend a odošlite e-mail ručne tlačidlom „Odoslať znova“ v admin paneli.",
    });
  } catch (error) {
    console.error("ADMIN_ALERT_EMAIL_ERROR:", {
      code: "PAID_ORDER_EMAIL_RETRY_FAILED",
      error,
    });
  }
}

/**
 * Scheduled retry (GitHub Actions, every 15 min) for paid-order emails that
 * were not recorded as sent. Uses an hourly Resend idempotency key, so one
 * order gets at most one attempt per recipient per hour. Responds with counts
 * only: the caller's logs may be public.
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();

  if (!secret) {
    console.error("CRON_CONFIG_ERROR:", { missing: "CRON_SECRET" });

    return NextResponse.json({ message: "Not configured." }, { status: 503 });
  }

  if (!isAuthorized(request, secret)) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const now = Date.now();

  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("id")
    .eq("payment_status", "paid")
    .or("customer_confirmed_at.is.null,admin_notified_at.is.null")
    .lt("paid_at", new Date(now - MIN_AGE_MS).toISOString())
    .gt("paid_at", new Date(now - MAX_AGE_MS).toISOString())
    .order("paid_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (error) {
    console.error("RETRY_PAID_EMAILS_LOOKUP_ERROR:", error);

    return NextResponse.json({ message: "Lookup failed." }, { status: 500 });
  }

  const hourBucket = Math.floor(now / HOUR_MS);
  let sent = 0;
  let failed = 0;

  for (const { id } of (data ?? []) as Array<{ id: string }>) {
    const result = await resendMissingPaidOrderEmails(id, {
      idempotencyKeyPrefix: `order-paid-retry/${id}/${hourBucket}`,
    });

    const ok =
      result.status === "nothing_to_send" ||
      result.status === "not_paid" ||
      result.status === "not_found" ||
      (result.status === "sent" &&
        (!result.customerRequested || result.customerSent) &&
        (!result.adminRequested || result.adminSent));

    if (ok) {
      if (result.status === "sent") {
        sent += 1;
      }

      continue;
    }

    failed += 1;
    console.error("RETRY_PAID_EMAILS_FAILED:", { orderId: id });
    await alertRetryFailed(id);
  }

  return NextResponse.json(
    { checked: data?.length ?? 0, sent, failed },
    { headers: { "Cache-Control": "no-store" } },
  );
}
