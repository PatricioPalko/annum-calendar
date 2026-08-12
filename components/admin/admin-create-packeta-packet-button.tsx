"use client";

import { Loader2, Tag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AdminCreatePacketaPacketButtonProps = {
  orderId: string;
  deliveryMethod?: string | null;
  trackingNumber?: string | null;
  disabled?: boolean;
  labeled?: boolean;
  label?: string;
};

export function AdminCreatePacketaPacketButton({
  orderId,
  deliveryMethod,
  trackingNumber,
  disabled = false,
  labeled = false,
  label = "Vytvoriť štítok",
}: AdminCreatePacketaPacketButtonProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (deliveryMethod !== "packeta" || trackingNumber) {
    return null;
  }

  async function handleClick() {
    if (disabled || isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(
        `/api/admin/orders/${orderId}/create-packeta-packet`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;

        window.alert(
          payload?.message ?? "Nepodarilo sa vytvoriť štítok v Packete.",
        );
        return;
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
          <Tag className="size-2.5" />
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
      title="Vytvoriť štítok Packety"
      aria-label="Vytvoriť štítok Packety"
      className={cn("size-5 rounded-md p-0 [&_svg]:size-2.5")}
    >
      {isSubmitting ? (
        <Loader2 className="size-2.5 animate-spin" />
      ) : (
        <Tag className="size-2.5" />
      )}
    </Button>
  );
}
