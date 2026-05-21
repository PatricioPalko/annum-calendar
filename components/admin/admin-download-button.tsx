"use client";

import { Download, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type AdminDownloadButtonProps = {
  orderId: string;
  fileName: string;
};

export function AdminDownloadButton({
  orderId,
  fileName,
}: AdminDownloadButtonProps) {
  const router = useRouter();
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownload() {
    try {
      setIsDownloading(true);

      const response = await fetch(`/api/admin/orders/${orderId}/download`);

      if (!response.ok) {
        throw new Error("Download failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `${fileName}.zip`;
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
      disabled={isDownloading}
      className="inline-flex items-center justify-center gap-2 hover:cursor-pointer rounded-md bg-[#3E0F28] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#521536] disabled:pointer-events-none disabled:opacity-60"
    >
      {isDownloading ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Download className="size-3.5" />
      )}
      ZIP
    </button>
  );
}
