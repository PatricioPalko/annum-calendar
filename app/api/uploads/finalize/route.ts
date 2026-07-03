import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { z } from "zod";

import { MAX_PHOTOS, MIN_PHOTOS } from "@/lib/order/config";
import {
  consumeRateLimit,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase/admin";

const BUCKET = "calendar-uploads";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const FINALIZE_TTL_SECONDS = 10 * 60;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 20;

const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"] as const;
const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];

type CanonicalPhoto = {
  name: string;
  type: string;
  size: number;
  path: string;
};

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
  photos: z.array(uploadedPhotoSchema).min(MIN_PHOTOS).max(MAX_PHOTOS),
});

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
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected),
    );
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
  const ip = getClientIp(request);
  const rate = consumeRateLimit("upload-finalize", ip, {
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: RATE_LIMIT_MAX,
  });

  if (!rate.ok) {
    const limited = rateLimitResponse(rate.retryAfterMs);

    return NextResponse.json(
      { message: limited.message },
      { status: limited.status, headers: limited.headers },
    );
  }

  const json = await request.json();
  const parsed = bodySchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Invalid finalize request",
        errors: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const { storageFolder, photos } = parsed.data;

  for (const photo of photos) {
    if (!photo.path.startsWith(`${storageFolder}/`)) {
      return NextResponse.json(
        {
          message: "Invalid finalize request: invalid path",
        },
        { status: 400 },
      );
    }

    const isMimeOk =
      allowedMimeTypes.includes(
        photo.type as (typeof allowedMimeTypes)[number],
      ) || hasAllowedImageExtension(photo.name);

    if (!isMimeOk) {
      return NextResponse.json(
        {
          message: "Invalid finalize request: unsupported file type",
        },
        { status: 400 },
      );
    }

    if (photo.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          message: "Invalid finalize request: file too large",
        },
        { status: 400 },
      );
    }

    const isUploadVerified = verifyUploadPathToken({
      path: photo.path,
      size: photo.size,
      type: photo.type,
      token: photo.uploadPathToken,
    });

    if (!isUploadVerified) {
      return NextResponse.json(
        {
          message: "Invalid finalize request: unverified upload",
        },
        { status: 400 },
      );
    }
  }

  const { data: objects, error: listError } = await supabaseAdmin.storage
    .from(BUCKET)
    .list(storageFolder, {
      limit: 100,
      offset: 0,
    });

  if (listError) {
    console.error("FINALIZE_LIST_ERROR:", listError);

    return NextResponse.json(
      {
        message: "Nepodarilo sa overiť fotky. Skúste to prosím znova.",
      },
      { status: 500 },
    );
  }

  const objectNames = new Set((objects ?? []).map((object) => object.name));

  const missing = photos.filter((photo) => {
    const name = photo.path.split("/").pop();

    return !name || !objectNames.has(name);
  });

  if (missing.length > 0) {
    return NextResponse.json(
      {
        message: "Niektoré fotky sa nepodarilo nájsť po nahratí.",
      },
      { status: 400 },
    );
  }

  const objectByName = new Map(
    (objects ?? []).map((object) => [object.name, object]),
  );

  let canonicalPhotos: CanonicalPhoto[];

  try {
    canonicalPhotos = photos.map((photo) => {
      const fileName = photo.path.split("/").pop() ?? "";
      const object = objectByName.get(fileName);

      const metadata = object?.metadata as
        | {
            size?: number;
            mimetype?: string;
          }
        | undefined;

      const size =
        typeof metadata?.size === "number" ? metadata.size : photo.size;

      const type =
        typeof metadata?.mimetype === "string" ? metadata.mimetype : photo.type;

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
  } catch (error) {
    console.error("FINALIZE_METADATA_ERROR:", error);

    return NextResponse.json(
      {
        message: "Niektoré fotky presahujú maximálnu veľkosť.",
      },
      { status: 400 },
    );
  }

  const expiresAt = Math.floor(Date.now() / 1000) + FINALIZE_TTL_SECONDS;

  const finalizeToken = createFinalizeToken({
    storageFolder,
    photoPaths: canonicalPhotos.map((photo) => photo.path),
    expiresAt,
  });

  return NextResponse.json({
    storageFolder,
    photos: canonicalPhotos,
    finalizeToken,
    expiresAt,
  });
}
