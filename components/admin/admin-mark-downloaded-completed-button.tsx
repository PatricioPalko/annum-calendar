"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

type AdminMarkDownloadedCompletedButtonProps = {
  disabled?: boolean;
};

export function AdminMarkDownloadedCompletedButton({
  disabled,
}: AdminMarkDownloadedCompletedButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleClick() {
    try {
      setIsLoading(true);

      const response = await fetch(
        "/api/admin/orders/mark-downloaded-completed",
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("MARK_COMPLETED_ERROR:", response.status, errorText);
        throw new Error("Mark completed failed");
      }

      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="secondary"
      onClick={handleClick}
      disabled={disabled || isLoading}
      className="gap-2 tracking-normal px-3 py-0 h-9"
    >
      {isLoading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <CheckCircle2 className="size-4" />
      )}
      Označiť stiahnuté ako vybavené
    </Button>
  );
}
