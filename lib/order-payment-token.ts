import crypto from "node:crypto";

function getSigningSecret() {
  const secret = process.env.UPLOAD_SIGNING_SECRET;

  if (!secret) {
    throw new Error("Missing UPLOAD_SIGNING_SECRET");
  }

  return secret;
}

export function createOrderPaymentToken(orderId: string, orderCode: string) {
  return crypto
    .createHmac("sha256", getSigningSecret())
    .update(`${orderId}|${orderCode}`)
    .digest("base64url");
}

export function verifyOrderPaymentToken(
  orderId: string,
  orderCode: string,
  token: string,
) {
  const expected = createOrderPaymentToken(orderId, orderCode);

  try {
    return crypto.timingSafeEqual(
      Buffer.from(token),
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
