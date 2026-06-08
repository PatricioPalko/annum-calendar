import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { z } from "zod";

import { createOrderCode, createStorageFolder } from "@/helpers/order-code";
import { supabaseAdmin } from "@/lib/supabase/admin";

const BUCKET = "calendar-uploads";
const MAX_FILES = 52;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const TOKEN_TTL_SECONDS = 60 * 60;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 10;

const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"] as const;
const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];

type RateLimitState = {
  windowStartMs: number;
  count: number;
};

const rateLimitByIp = new Map<string, RateLimitState>();

function hasAllowedImageExtension(fileName: string) {
  const lowerName = fileName.toLowerCase();

  return allowedExtensions.some((extension) => lowerName.endsWith(extension));
}

const bodySchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),

  type: z.enum(["basic", "premium", "business"]),
  quantity: z.number().int().min(1).max(200),

  turnstileToken: z.string().min(1),

  files: z
    .array(
      z
        .object({
          name: z.string().min(1),
          type: z.string(),
          size: z.number().max(MAX_FILE_SIZE),
        })
        .refine(
          (file) =>
            allowedMimeTypes.includes(
              file.type as (typeof allowedMimeTypes)[number],
            ) || hasAllowedImageExtension(file.name),
          {
            message: "Nepodporovaný typ súboru.",
          },
        ),
    )
    .min(1)
    .max(MAX_FILES),
});

function getIp(request: Request) {
  const xff = request.headers.get("x-forwarded-for");

  if (xff) {
    const first = xff.split(",")[0]?.trim();

    if (first) {
      return first;
    }
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

function consumeRateLimit(ip: string) {
  const now = Date.now();
  const state = rateLimitByIp.get(ip);

  if (!state || now - state.windowStartMs > RATE_LIMIT_WINDOW_MS) {
    rateLimitByIp.set(ip, {
      windowStartMs: now,
      count: 1,
    });

    return {
      ok: true as const,
      remaining: RATE_LIMIT_MAX - 1,
      retryAfterMs: 0,
    };
  }

  if (state.count >= RATE_LIMIT_MAX) {
    const retryAfterMs = RATE_LIMIT_WINDOW_MS - (now - state.windowStartMs);

    return {
      ok: false as const,
      remaining: 0,
      retryAfterMs,
    };
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
    {
      method: "POST",
      body: form,
    },
  );

  if (!response.ok) {
    return false;
  }

  const data = (await response.json()) as {
    success?: boolean;
  };

  return data.success === true;
}

function normalizeFileName(fileName: string) {
  return fileName
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function createUploadPathToken(values: {
  path: string;
  size: number;
  type: string;
  expiresAt: number;
}) {
  const secret = process.env.UPLOAD_SIGNING_SECRET;

  if (!secret) {
    throw new Error("Missing UPLOAD_SIGNING_SECRET");
  }

  const payload = `${values.path}|${values.size}|${values.type}|${values.expiresAt}`;

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
      {
        message: "Príliš veľa pokusov. Skúste to prosím neskôr.",
      },
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
      {
        message: "Invalid upload request",
        errors: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const {
    firstName,
    lastName,
    type,
    quantity,
    files: inputFiles,
    turnstileToken,
  } = parsed.data;

  const isHuman = await verifyTurnstileToken({
    token: turnstileToken,
    ip,
  });

  if (!isHuman) {
    return NextResponse.json(
      {
        message: "Prosím potvrďte, že nie ste robot.",
      },
      { status: 400 },
    );
  }

  const { data: orderNumberData, error: orderNumberError } =
    await supabaseAdmin.rpc("next_order_number");

  if (orderNumberError || orderNumberData === null) {
    console.error("ORDER_NUMBER_ERROR:", orderNumberError);

    return NextResponse.json(
      {
        message: "Nepodarilo sa vytvoriť číslo objednávky.",
      },
      { status: 500 },
    );
  }

  const orderNumber = Number(orderNumberData);
  const year = new Date().getFullYear();

  const orderCode = createOrderCode({
    firstName,
    lastName,
    year,
    type,
    quantity,
  });

  const storageFolder = createStorageFolder({
    year,
    orderNumber,
  });

  const expiresAt = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;

  const files = await Promise.all(
    inputFiles.map(async (file, index) => {
      const safeName = normalizeFileName(file.name);

      const path = `${storageFolder}/${index + 1}-${crypto.randomUUID()}-${safeName}`;

      const { data, error } = await supabaseAdmin.storage
        .from(BUCKET)
        .createSignedUploadUrl(path);

      if (error) {
        throw error;
      }

      const uploadPathToken = createUploadPathToken({
        path,
        size: file.size,
        type: file.type,
        expiresAt,
      });

      return {
        name: file.name,
        type: file.type,
        size: file.size,
        path,
        token: data.token,
        uploadPathToken,
      };
    }),
  );

  return NextResponse.json({
    orderNumber,
    orderCode,
    storageFolder,
    expiresAt,
    files,
  });
}
