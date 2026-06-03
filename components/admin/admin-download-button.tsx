"use client";

import { DownloadIcon, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

type AdminDownloadButtonProps = {
  orderId: string;
  fileName: string;
  disabled?: boolean;
};

export function AdminDownloadButton({
  orderId,
  fileName,
  disabled = false,
}: AdminDownloadButtonProps) {
  const router = useRouter();
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownload() {
    if (disabled || isDownloading) {
      return;
    }

    try {
      setIsDownloading(true);

      const response = await fetch(`/api/admin/orders/${orderId}/download`);

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");

        console.error("ADMIN_DOWNLOAD_ERROR:", {
          status: response.status,
          errorText,
        });

        throw new Error("Download failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `${fileName}.zip`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      router.refresh();
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      onClick={handleDownload}
      disabled={disabled || isDownloading}
      title="Stiahnuť podklady"
      aria-label="Stiahnuť podklady"
      className="size-8 rounded-md"
    >
      {isDownloading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <DownloadIcon className="size-4" />
      )}
    </Button>
  );
}
