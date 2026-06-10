"use client";

import { CheckCheck, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

type AdminCompleteOrderButtonProps = {
  orderId: string;
  disabled?: boolean;
};

export function AdminCompleteOrderButton({
  orderId,
  disabled = false,
}: AdminCompleteOrderButtonProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleClick() {
    if (disabled || isSubmitting) {
      return;
    }

    const confirmed = window.confirm("Označiť objednávku ako vybavenú?");

    if (!confirmed) {
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/admin/orders/${orderId}/complete`, {
        method: "POST",
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");

        console.error("COMPLETE_ORDER_ERROR:", {
          status: response.status,
          errorText,
        });

        throw new Error("Complete order failed");
      }

      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      onClick={handleClick}
      disabled={disabled || isSubmitting}
      title="Označiť ako vybavené"
      aria-label="Označiť ako vybavené"
      className="size-8 rounded-md"
    >
      {isSubmitting ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <CheckCheck className="size-4" />
      )}
    </Button>
  );
}
