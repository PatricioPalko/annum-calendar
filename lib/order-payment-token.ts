import crypto from "node:crypto";

/** Payment links remain valid for 90 days (emails, cancel-page recovery). */
export const ORDER_PAYMENT_TOKEN_TTL_SECONDS = 90 * 24 * 60 * 60;

function getSigningSecret() {
  const secret = process.env.ORDER_PAYMENT_SIGNING_SECRET;

  if (!secret) {
    throw new Error("Missing ORDER_PAYMENT_SIGNING_SECRET");
  }

  return secret;
}

function buildPaymentPayload(
  orderId: string,
  orderCode: string,
  expiresAt: number,
) {
  return `${orderId}|${orderCode}|${expiresAt}`;
}

export function createOrderPaymentToken(orderId: string, orderCode: string) {
  const expiresAt =
    Math.floor(Date.now() / 1000) + ORDER_PAYMENT_TOKEN_TTL_SECONDS;

  const signature = crypto
    .createHmac("sha256", getSigningSecret())
    .update(buildPaymentPayload(orderId, orderCode, expiresAt))
    .digest("base64url");

  return `${expiresAt}.${signature}`;
}

export function verifyOrderPaymentToken(
  orderId: string,
  orderCode: string,
  token: string,
) {
  const [expiresAtStr, signature] = token.split(".");
  const expiresAt = Number(expiresAtStr);

  if (!Number.isFinite(expiresAt) || !signature) {
    return false;
  }

  if (Math.floor(Date.now() / 1000) > expiresAt) {
    return false;
  }

  const expected = crypto
    .createHmac("sha256", getSigningSecret())
    .update(buildPaymentPayload(orderId, orderCode, expiresAt))
    .digest("base64url");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected),
    );
  } catch {
    return false;
  }
}

export function buildOrderPaymentPath(orderId: string, orderCode: string) {
  const token = createOrderPaymentToken(orderId, orderCode);

  return `/api/orders/${encodeURIComponent(orderCode)}/pay?token=${encodeURIComponent(token)}`;
}

export function buildOrderPaymentUrl(orderId: string, orderCode: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!appUrl) {
    throw new Error("Missing NEXT_PUBLIC_APP_URL");
  }

  return `${appUrl}${buildOrderPaymentPath(orderId, orderCode)}`;
}
