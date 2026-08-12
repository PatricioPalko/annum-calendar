"use client";

import { DownloadIcon, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AdminDownloadButtonProps = {
  orderId: string;
  fileName: string;
  disabled?: boolean;
  labeled?: boolean;
  label?: string;
};

export function AdminDownloadButton({
  orderId,
  fileName,
  disabled = false,
  labeled = false,
  label = "Stiahnuť podklady",
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

  if (labeled) {
    return (
      <Button
        type="button"
        variant="default"
        size="sm"
        onClick={handleDownload}
        disabled={disabled || isDownloading}
        className="h-6 gap-1.5 px-2 text-[10px] tracking-normal normal-case"
      >
        {isDownloading ? (
          <Loader2 className="size-2.5 animate-spin" />
        ) : (
          <DownloadIcon className="size-2.5" />
        )}
        {label}
      </Button>
    );
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
      className={cn("size-5 rounded-md p-0 [&_svg]:size-2.5")}
    >
      {isDownloading ? (
        <Loader2 className="size-2.5 animate-spin" />
      ) : (
        <DownloadIcon className="size-2.5" />
      )}
    </Button>
  );
}
