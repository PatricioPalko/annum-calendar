import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "node:crypto";

import { supabaseAdmin } from "@/lib/supabase/admin";

const BUCKET = "calendar-uploads";
const MIN_PHOTOS = 14;
const MAX_FILES = 52;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const FINALIZE_TTL_SECONDS = 10 * 60; // 10 minutes
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10m
const RATE_LIMIT_MAX = 20; // per IP per window

const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"] as const;
const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];

function hasAllowedImageExtension(fileName: string) {
  const lowerName = fileName.toLowerCase();
  return allowedExtensions.some((extension) => lowerName.endsWith(extension));
}

const uploadedPhotoSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  size: z.number().int().nonnegative(),
  path: z.string().min(1),
  uploadPathToken: z.string().min(1),
});

const bodySchema = z.object({
  storageFolder: z.string().min(1),
  photos: z.array(uploadedPhotoSchema).min(MIN_PHOTOS).max(MAX_FILES),
  turnstileToken: z.string().min(1),
});

type RateLimitState = {
  windowStartMs: number;
  count: number;
};

const rateLimitByIp = new Map<string, RateLimitState>();

function getIp(request: Request) {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

function consumeRateLimit(ip: string) {
  const now = Date.now();
  const state = rateLimitByIp.get(ip);

  if (!state || now - state.windowStartMs > RATE_LIMIT_WINDOW_MS) {
    rateLimitByIp.set(ip, { windowStartMs: now, count: 1 });
    return { ok: true as const, remaining: RATE_LIMIT_MAX - 1, retryAfterMs: 0 };
  }

  if (state.count >= RATE_LIMIT_MAX) {
    const retryAfterMs = RATE_LIMIT_WINDOW_MS - (now - state.windowStartMs);
    return { ok: false as const, remaining: 0, retryAfterMs };
  }

  state.count += 1;
  return {
    ok: true as const,
    remaining: Math.max(0, RATE_LIMIT_MAX - state.count),
    retryAfterMs: 0,
  };
}

async function verifyTurnstileToken(params: {
  token: string;
  ip: string;
}): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    throw new Error("Missing TURNSTILE_SECRET_KEY");
  }

  const form = new FormData();
  form.set("secret", secret);
  form.set("response", params.token);
  if (params.ip !== "unknown") {
    form.set("remoteip", params.ip);
  }

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    { method: "POST", body: form },
  );

  if (!response.ok) return false;

  const data = (await response.json()) as { success?: boolean };
  return data.success === true;
}

function verifyUploadPathToken(values: {
  path: string;
  size: number;
  type: string;
  token: string;
}) {
  const secret = process.env.UPLOAD_SIGNING_SECRET;
  if (!secret) {
    throw new Error("Missing UPLOAD_SIGNING_SECRET");
  }

  const [expiresAtStr, signature] = values.token.split(".");
  const expiresAt = Number(expiresAtStr);

  if (!Number.isFinite(expiresAt) || !signature) {
    return false;
  }

  if (Math.floor(Date.now() / 1000) > expiresAt) {
    return false;
  }

  const payload = `${values.path}|${values.size}|${values.type}|${expiresAt}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");

  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

function createFinalizeToken(values: {
  storageFolder: string;
  photoPaths: string[];
  expiresAt: number;
}) {
  const secret = process.env.UPLOAD_SIGNING_SECRET;
  if (!secret) {
    throw new Error("Missing UPLOAD_SIGNING_SECRET");
  }

  const canonicalPaths = [...values.photoPaths].sort();
  const payload = `${values.storageFolder}|${canonicalPaths.join(",")}|${values.expiresAt}`;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");

  return `${values.expiresAt}.${signature}`;
}

export async function POST(request: Request) {
  const ip = getIp(request);
  const rate = consumeRateLimit(ip);
  if (!rate.ok) {
    return NextResponse.json(
      { message: "Príliš veľa pokusov. Skúste to prosím neskôr." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(rate.retryAfterMs / 1000)),
        },
      },
    );
  }

  const json = await request.json();
  const parsed = bodySchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid finalize request", errors: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { storageFolder, photos, turnstileToken } = parsed.data;

  const isHuman = await verifyTurnstileToken({ token: turnstileToken, ip });
  if (!isHuman) {
    return NextResponse.json(
      { message: "Prosím potvrďte, že nie ste robot." },
      { status: 400 },
    );
  }

  for (const photo of photos) {
    if (!photo.path.startsWith(`${storageFolder}/`)) {
      return NextResponse.json(
        { message: "Invalid finalize request: invalid path" },
        { status: 400 },
      );
    }

    const isMimeOk =
      allowedMimeTypes.includes(photo.type as (typeof allowedMimeTypes)[number]) ||
      hasAllowedImageExtension(photo.name);
    if (!isMimeOk) {
      return NextResponse.json(
        { message: "Invalid finalize request: unsupported file type" },
        { status: 400 },
      );
    }

    if (photo.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: "Invalid finalize request: file too large" },
        { status: 400 },
      );
    }

    if (
      !verifyUploadPathToken({
        path: photo.path,
        size: photo.size,
        type: photo.type,
        token: photo.uploadPathToken,
      })
    ) {
      return NextResponse.json(
        { message: "Invalid finalize request: unverified upload" },
        { status: 400 },
      );
    }
  }

  // Verify the objects actually exist in storageFolder.
  const { data: objects, error: listError } = await supabaseAdmin.storage
    .from(BUCKET)
    .list(storageFolder, { limit: 100, offset: 0 });

  if (listError) {
    console.error("FINALIZE_LIST_ERROR:", listError);
    return NextResponse.json(
      { message: "Nepodarilo sa overiť fotky. Skúste to prosím znova." },
      { status: 500 },
    );
  }

  const objectNames = new Set((objects ?? []).map((obj) => obj.name));
  const missing = photos.filter((p) => {
    const name = p.path.split("/").pop();
    return !name || !objectNames.has(name);
  });

  if (missing.length > 0) {
    return NextResponse.json(
      { message: "Niektoré fotky sa nepodarilo nájsť po nahratí." },
      { status: 400 },
    );
  }

  // Best-effort metadata checks from storage listing (if available).
  const objectByName = new Map((objects ?? []).map((obj) => [obj.name, obj]));

  const canonicalPhotos = photos.map((photo) => {
    const fileName = photo.path.split("/").pop() ?? "";
    const obj: any = objectByName.get(fileName);
    const meta = obj?.metadata;

    const size = typeof meta?.size === "number" ? meta.size : photo.size;
    const type = typeof meta?.mimetype === "string" ? meta.mimetype : photo.type;

    if (size > MAX_FILE_SIZE) {
      throw new Error("FINALIZE_METADATA_TOO_LARGE");
    }

    return {
      name: photo.name,
      type,
      size,
      path: photo.path,
    };
  });

  const expiresAt = Math.floor(Date.now() / 1000) + FINALIZE_TTL_SECONDS;
  const finalizeToken = createFinalizeToken({
    storageFolder,
    photoPaths: canonicalPhotos.map((p) => p.path),
    expiresAt,
  });

  return NextResponse.json({
    storageFolder,
    photos: canonicalPhotos,
    finalizeToken,
    expiresAt,
  });
}

