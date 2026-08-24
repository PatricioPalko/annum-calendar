import type { OrderableCalendarTypes } from "@/app/types/types";
import { supabaseBrowser } from "@/lib/supabase/browser";

const BUCKET = "calendar-uploads";

type SignedUploadFile = {
  name: string;
  type: string;
  size: number;
  path: string;
  token: string;
  uploadPathToken: string;
};

type SignUploadsResponse = {
  orderNumber: number;
  orderCode: string;
  storageFolder: string;
  expiresAt: number;
  files: SignedUploadFile[];
};

export type UploadedPhoto = {
  name: string;
  type: string;
  size: number;
  path: string;
  uploadPathToken: string;
};

export type FinalizedUploadedPhoto = {
  name: string;
  type: string;
  size: number;
  path: string;
};

type UploadOrderPhotosParams = {
  firstName: string;
  lastName: string;
  type: OrderableCalendarTypes;
  quantity: number;
  files: File[];
  turnstileToken: string;
};

type UploadOrderPhotosResult = {
  orderNumber: number;
  orderCode: string;
  storageFolder: string;
  photos: FinalizedUploadedPhoto[];
  finalizeToken: string;
};

type FinalizeUploadsResponse = {
  storageFolder: string;
  photos: FinalizedUploadedPhoto[];
  finalizeToken: string;
  expiresAt: number;
};

export async function uploadOrderPhotos({
  firstName,
  lastName,
  files,
  type,
  quantity,
  turnstileToken,
}: UploadOrderPhotosParams): Promise<UploadOrderPhotosResult> {
  const signResponse = await fetch("/api/uploads/sign", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      firstName,
      lastName,
      type,
      quantity,
      turnstileToken,
      files: files.map((file) => ({
        name: file.name,
        type: file.type,
        size: file.size,
      })),
    }),
  });

  if (!signResponse.ok) {
    const errorText = await signResponse.text().catch(() => "");
    console.error("SIGN_UPLOADS_ERROR:", signResponse.status, errorText);

    throw new Error("Nepodarilo sa pripraviť upload fotiek.");
  }

  const signedUploads = (await signResponse.json()) as SignUploadsResponse;

  const uploadedPhotos: UploadedPhoto[] = await Promise.all(
    signedUploads.files.map(async (signedFile, index) => {
      const file = files[index];

      if (!file) {
        throw new Error("Chýba súbor na upload.");
      }

      const { error } = await supabaseBrowser.storage
        .from(BUCKET)
        .uploadToSignedUrl(signedFile.path, signedFile.token, file, {
          contentType: file.type,
        });

      if (error) {
        console.error("PHOTO_UPLOAD_ERROR:", error);

        throw new Error(`Nepodarilo sa nahrať fotku: ${file.name}`);
      }

      return {
        name: file.name,
        type: file.type,
        size: file.size,
        path: signedFile.path,
        uploadPathToken: signedFile.uploadPathToken,
      };
    }),
  );

  const finalized = await finalizeUploadedPhotos({
    storageFolder: signedUploads.storageFolder,
    orderNumber: signedUploads.orderNumber,
    orderCode: signedUploads.orderCode,
    photos: uploadedPhotos,
  });

  return {
    orderNumber: signedUploads.orderNumber,
    orderCode: signedUploads.orderCode,
    storageFolder: finalized.storageFolder,
    photos: finalized.photos,
    finalizeToken: finalized.finalizeToken,
  };
}

export async function finalizeUploadedPhotos(params: {
  storageFolder: string;
  orderNumber: number;
  orderCode: string;
  photos: UploadedPhoto[];
}): Promise<FinalizeUploadsResponse> {
  const response = await fetch("/api/uploads/finalize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      storageFolder: params.storageFolder,
      orderNumber: params.orderNumber,
      orderCode: params.orderCode,
      photos: params.photos,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    console.error("FINALIZE_UPLOADS_ERROR:", response.status, errorText);

    throw new Error("Nepodarilo sa overiť fotky po nahratí.");
  }

  return (await response.json()) as FinalizeUploadsResponse;
}
