import crypto from "node:crypto";

function getSigningSecret() {
  const secret = process.env.UPLOAD_SIGNING_SECRET;

  if (!secret) {
    throw new Error("Missing UPLOAD_SIGNING_SECRET");
  }

  return secret;
}

function buildFinalizePayload(values: {
  storageFolder: string;
  orderNumber: number;
  orderCode: string;
  photoPaths: string[];
  expiresAt: number;
}) {
  const canonicalPaths = [...values.photoPaths].sort();

  return `${values.storageFolder}|${values.orderNumber}|${values.orderCode}|${canonicalPaths.join(",")}|${values.expiresAt}`;
}

export function createFinalizeToken(values: {
  storageFolder: string;
  orderNumber: number;
  orderCode: string;
  photoPaths: string[];
  expiresAt: number;
}) {
  const signature = crypto
    .createHmac("sha256", getSigningSecret())
    .update(buildFinalizePayload(values))
    .digest("base64url");

  return `${values.expiresAt}.${signature}`;
}

export function verifyFinalizeToken(values: {
  storageFolder: string;
  orderNumber: number;
  orderCode: string;
  photoPaths: string[];
  token: string;
}) {
  const [expiresAtStr, signature] = values.token.split(".");
  const expiresAt = Number(expiresAtStr);

  if (!Number.isFinite(expiresAt) || !signature) {
    return false;
  }

  if (Math.floor(Date.now() / 1000) > expiresAt) {
    return false;
  }

  const expected = crypto
    .createHmac("sha256", getSigningSecret())
    .update(
      buildFinalizePayload({
        storageFolder: values.storageFolder,
        orderNumber: values.orderNumber,
        orderCode: values.orderCode,
        photoPaths: values.photoPaths,
        expiresAt,
      }),
    )
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
