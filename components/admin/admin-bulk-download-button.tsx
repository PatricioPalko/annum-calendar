"use client";

import { Download, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "../ui/button";

type AdminBulkDownloadButtonProps = {
  disabled?: boolean;
};

export function AdminBulkDownloadButton({
  disabled = false,
}: AdminBulkDownloadButtonProps) {
  const router = useRouter();
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownload() {
    try {
      setIsDownloading(true);

      const response = await fetch("/api/admin/orders/download-undownloaded");

      if (!response.ok) {
        throw new Error("Bulk download failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "nestiahnute-objednavky.zip";
      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);

      router.refresh();
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleDownload}
      disabled={disabled || isDownloading}
      className="gap-2 tracking-normal px-3"
    >
      {isDownloading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Download className="size-4" />
      )}

      {isDownloading ? "Pripravujem ZIP..." : "Stiahnuť všetky nestiahnuté"}
    </Button>
  );
}
