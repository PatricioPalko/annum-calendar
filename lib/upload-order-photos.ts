import { supabaseBrowser } from "@/lib/supabase/browser";

const BUCKET = "calendar-uploads";

type SignedUploadFile = {
  name: string;
  type: string;
  size: number;
  path: string;
  token: string;
};

type SignUploadsResponse = {
  orderNumber: number;
  orderCode: string;
  storageFolder: string;
  files: SignedUploadFile[];
};

export type UploadedPhoto = {
  name: string;
  type: string;
  size: number;
  path: string;
};

type UploadOrderPhotosParams = {
  firstName: string;
  lastName: string;
  files: File[];
};

export async function uploadOrderPhotos({
  firstName,
  lastName,
  files,
}: UploadOrderPhotosParams) {
  const signResponse = await fetch("/api/uploads/sign", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      firstName,
      lastName,
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
