"use client";

import { CheckCheck, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AdminCompleteOrderButtonProps = {
  orderId: string;
  disabled?: boolean;
  labeled?: boolean;
  label?: string;
};

export function AdminCompleteOrderButton({
  orderId,
  disabled = false,
  labeled = false,
  label = "Označiť vybavené",
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

  if (labeled) {
    return (
      <Button
        type="button"
        variant="default"
        size="sm"
        onClick={handleClick}
        disabled={disabled || isSubmitting}
        className="h-6 gap-1.5 px-2 text-[10px] tracking-normal normal-case"
      >
        {isSubmitting ? (
          <Loader2 className="size-2.5 animate-spin" />
        ) : (
          <CheckCheck className="size-2.5" />
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
      onClick={handleClick}
      disabled={disabled || isSubmitting}
      title="Označiť ako vybavené"
      aria-label="Označiť ako vybavené"
      className={cn("size-5 rounded-md p-0 [&_svg]:size-2.5")}
    >
      {isSubmitting ? (
        <Loader2 className="size-2.5 animate-spin" />
      ) : (
        <CheckCheck className="size-2.5" />
      )}
    </Button>
  );
}
