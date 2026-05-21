"use client";

import { Download, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
    <button
      type="button"
      onClick={handleDownload}
      disabled={disabled || isDownloading}
      className="inline-flex items-center justify-center hover:cursor-pointer gap-2 rounded-md bg-[#3E0F28] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#521536] disabled:pointer-events-none disabled:opacity-50"
    >
      {isDownloading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Download className="size-4" />
      )}

      {isDownloading ? "Pripravujem ZIP..." : "Stiahnuť všetky nestiahnuté"}
    </button>
  );
}
