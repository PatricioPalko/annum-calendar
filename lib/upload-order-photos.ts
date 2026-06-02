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
  files: File[];
  turnstileToken: string;
};

export async function uploadOrderPhotos({
  firstName,
  lastName,
  files,
  turnstileToken,
}: UploadOrderPhotosParams) {
  const signResponse = await fetch("/api/uploads/sign", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      firstName,
      lastName,
      turnstileToken,
      files: files.map((file) => ({
        name: file.name,
        type: file.type,
        size: file.size,
      })),
    }),
  });

  if (!signResponse.ok) {
    throw new Error("Nepodarilo sa pripraviť upload fotiek.");
  }

  const signedUploads = (await signResponse.json()) as SignUploadsResponse;

  const uploadedPhotos = await Promise.all(
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

  return {
    orderNumber: signedUploads.orderNumber,
    orderCode: signedUploads.orderCode,
    storageFolder: signedUploads.storageFolder,
    photos: uploadedPhotos,
  };
}

type FinalizeUploadsResponse = {
  storageFolder: string;
  photos: FinalizedUploadedPhoto[];
  finalizeToken: string;
  expiresAt: number;
};

export async function finalizeUploadedPhotos(params: {
  storageFolder: string;
  photos: UploadedPhoto[];
  turnstileToken: string;
}) {
  const response = await fetch("/api/uploads/finalize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      storageFolder: params.storageFolder,
      photos: params.photos,
      turnstileToken: params.turnstileToken,
    }),
  });

  if (!response.ok) {
    throw new Error("Nepodarilo sa overiť fotky po nahratí.");
  }

  return (await response.json()) as FinalizeUploadsResponse;
}
