import { createHash } from "node:crypto";

import { sendAdminAlertEmail } from "@/lib/order-emails";
import { SITE_URL } from "@/lib/seo";

type RequestErrorRequest = {
  method: string;
};

type RequestErrorContext = {
  routePath: string;
  routeType: string;
};

const MAX_MESSAGE_LENGTH = 300;
const THROTTLE_WINDOW_MS = 10 * 60 * 1000;
const MAX_ALERTS_PER_WINDOW = 5;

let windowStartedAt = 0;
let alertsInWindow = 0;

/** Test hook: resets the per-instance throttle. */
export function resetErrorReportingThrottle() {
  windowStartedAt = 0;
  alertsInWindow = 0;
}

/**
 * Alerts only from the live shop: preview deployments and local production
 * builds would otherwise email the operator.
 */
export function isProductionSite() {
  if (process.env.NODE_ENV !== "production") {
    return false;
  }

  const vercelEnv = process.env.VERCEL_ENV;

  if (vercelEnv && vercelEnv !== "production") {
    return false;
  }

  try {
    return (
      new URL(process.env.NEXT_PUBLIC_APP_URL ?? "").origin ===
      new URL(SITE_URL).origin
    );
  } catch {
    return false;
  }
}

function takeThrottleSlot(now: number) {
  if (now - windowStartedAt > THROTTLE_WINDOW_MS) {
    windowStartedAt = now;
    alertsInWindow = 0;
  }

  if (alertsInWindow >= MAX_ALERTS_PER_WINDOW) {
    return false;
  }

  alertsInWindow += 1;

  return true;
}

function describeError(error: unknown) {
  const name = error instanceof Error ? error.name : typeof error;
  const message = (error instanceof Error ? error.message : String(error))
    .replace(/\s+/g, " ")
    .slice(0, MAX_MESSAGE_LENGTH);
  const digest =
    typeof error === "object" && error !== null && "digest" in error
      ? String(error.digest)
      : null;

  return { name, message, digest };
}

/**
 * Emails the operator about an uncaught server error (from instrumentation.ts
 * `onRequestError`). Uses the route pattern, never the request URL, so tokens
 * and order codes stay out of the email. Resend deduplicates the same error on
 * the same route for 24 h, and each instance sends at most 5 alerts per
 * 10 minutes. Never throws.
 */
export async function reportRequestError(
  error: unknown,
  request: RequestErrorRequest,
  context: RequestErrorContext,
) {
  try {
    if (!isProductionSite() || !takeThrottleSlot(Date.now())) {
      return;
    }

    const { name, message, digest } = describeError(error);
    const dedupeId = createHash("sha256")
      .update(`${context.routePath}|${name}|${message}`)
      .digest("hex")
      .slice(0, 32);

    const details: Array<[label: string, value: string]> = [
      ["Route", `${request.method} ${context.routePath}`],
      ["Typ", context.routeType],
      ["Chyba", `${name}: ${message}`],
    ];

    if (digest) {
      details.push(["Digest", digest]);
    }

    await sendAdminAlertEmail({
      code: "SERVER_ERROR",
      title: "Chyba servera",
      summary: "Na webe nastala neošetrená chyba servera.",
      details,
      dedupeId,
      footer: "Podrobnosti nájdete v logoch hostingu (Vercel → Logs).",
    });
  } catch (reportError) {
    console.error("ERROR_REPORTING_FAILED:", {
      routePath: context.routePath,
      error: reportError,
    });
  }
}
