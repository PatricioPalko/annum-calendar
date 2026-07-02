"use client";

import { Loader2, Tag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

type AdminCreatePacketaPacketButtonProps = {
  orderId: string;
  deliveryMethod?: string | null;
  trackingNumber?: string | null;
  disabled?: boolean;
};

export function AdminCreatePacketaPacketButton({
  orderId,
  deliveryMethod,
  trackingNumber,
  disabled = false,
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

  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      onClick={handleClick}
      disabled={disabled || isSubmitting}
      title="Vytvoriť štítok Packety"
      aria-label="Vytvoriť štítok Packety"
      className="size-8 rounded-md"
    >
      {isSubmitting ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Tag className="size-4" />
      )}
    </Button>
  );
}
