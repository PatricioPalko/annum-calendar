"use client";

import { Download, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "../ui/button";

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
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={handleDownload}
      disabled={isDownloading}
      className=" px-2 h-8 text-xs"
    >
      {isDownloading ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Download className="size-3.5" />
      )}
      ZIP
    </Button>
  );
}
