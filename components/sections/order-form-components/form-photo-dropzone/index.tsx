"use client";

import { UploadCloud, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo } from "react";
import { useDropzone } from "react-dropzone";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { MAX_PHOTOS, MIN_PHOTOS } from "@/lib/order/config";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

type PhotoDropzoneProps = {
  value: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
  hasPhotoError?: boolean;
};

export function PhotoDropzone({
  value,
  onChange,
  disabled,
  hasPhotoError = false,
}: PhotoDropzoneProps) {
  const remainingSlots = MAX_PHOTOS - value.length;
  const missingFiles = Math.max(0, MIN_PHOTOS - value.length);
  const hasMinimumFiles = value.length >= MIN_PHOTOS;

  const previewUrls = useMemo(
    () =>
      value.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      })),
    [value],
  );

  useEffect(() => {
    return () => {
      previewUrls.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [previewUrls]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      accept: {
        "image/jpeg": [".jpg", ".jpeg"],
        "image/png": [".png"],
        "image/webp": [".webp"],
      },
      maxFiles: remainingSlots,
      maxSize: MAX_FILE_SIZE,
      disabled: disabled || remainingSlots <= 0,
      onDrop: (acceptedFiles) => {
        const nextFiles = [...value, ...acceptedFiles].slice(0, MAX_PHOTOS);
        onChange(nextFiles);
      },
    });

  const removeFile = (index: number) => {
    onChange(value.filter((_, fileIndex) => fileIndex !== index));
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "cursor-pointer rounded-md border-2 border-dashed border-soft bg-surface p-8 text-center transition hover:border-secondary hover:bg-soft/20",
          isDragActive && "border-primary bg-surface-soft",
          hasPhotoError && "border-secondary bg-soft/20",
          (disabled || remainingSlots <= 0) && "cursor-not-allowed opacity-60",
        )}
      >
        <input {...getInputProps()} />

        <div className="mx-auto flex size-14 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <UploadCloud className="size-7" />
        </div>

        <p className="mt-4 font-bold text-foreground">
          Presuňte fotky sem alebo kliknite pre výber
        </p>

        {/* <p className="mt-2 text-sm text-primary">
          JPG, PNG alebo WEBP · min. {MIN_FILES} fotiek · max. {MAX_FILES}{" "}
          fotiek · max. 10 MB / fotka
        </p> */}

        <p
          className={cn(
            "mt-3 text-sm font-semibold text-primary",
            hasMinimumFiles ? "text-primary" : "text-secondary",
          )}
        >
          Nahratých: {value.length}/{MAX_PHOTOS} fotiek
          {!hasMinimumFiles &&
            ` · chýba ešte ${missingFiles} ${missingFiles === 1 ? "fotka" : missingFiles > 4 ? "fotiek" : "fotky"}`}
        </p>
      </div>

      {/* {!hasMinimumFiles && value.length > 0 && (
        <div className="rounded-2xl border border-secondary bg-secondary/10 p-4 text-sm font-semibold text-foreground">
          Nahrajte ešte {missingFiles} fotiek, aby bolo možné objednávku
          odoslať.
        </div>
      )} */}

      {fileRejections.length > 0 && (
        <div className="rounded-md bg-red-50 p-4 text-sm font-medium text-red-700">
          Niektoré súbory nebolo možné pridať. Skontrolujte typ súboru, veľkosť
          alebo maximálny počet fotiek.
        </div>
      )}

      {previewUrls.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {previewUrls.map(({ file, url }, index) => (
            <div
              key={`${file.name}-${index}`}
              className="group relative overflow-hidden rounded-md border border-border bg-surface"
            >
              <Image
                src={url}
                alt={file.name}
                width={300}
                height={300}
                className="aspect-square w-full object-cover"
              />

              <Button
                type="button"
                variant="dark"
                size="icon"
                onClick={() => removeFile(index)}
                className="absolute right-2 top-2 size-8 rounded-md opacity-100 transition hover:cursor-pointer sm:size-7 sm:opacity-0 sm:group-hover:opacity-100"
                aria-label={`Odstrániť ${file.name}`}
              >
                <X className="size-4" />
              </Button>

              <div className="absolute inset-x-0 bottom-0 bg-black/50 px-2 py-1 text-xs font-medium text-white">
                <p className="truncate">{file.name}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
