"use client";

import { Loader2, MailCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

type AdminNotifyFulfillmentButtonProps = {
  orderId: string;
  deliveryMethod?: string | null;
  disabled?: boolean;
};

export function AdminNotifyFulfillmentButton({
  orderId,
  deliveryMethod,
  disabled = false,
}: AdminNotifyFulfillmentButtonProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleClick() {
    if (disabled || isSubmitting) {
      return;
    }

    const trackingNumber =
      deliveryMethod === "packeta"
        ? window.prompt("Zadaj tracking číslo Packety, ak ho máš:", "")?.trim()
        : null;

    try {
      setIsSubmitting(true);

      const response = await fetch(
        `/api/admin/orders/${orderId}/notify-fulfillment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            trackingNumber: trackingNumber || undefined,
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");

        console.error("NOTIFY_FULFILLMENT_ERROR:", {
          status: response.status,
          errorText,
        });

        throw new Error("Notify fulfillment failed");
      }

      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  const label =
    deliveryMethod === "packeta"
      ? "Odoslať info o odoslaní"
      : "Odoslať info o odbere";

  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      onClick={handleClick}
      disabled={disabled || isSubmitting}
      title={label}
      aria-label={label}
      className="size-8 rounded-md"
    >
      {isSubmitting ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <MailCheck className="size-4" />
      )}
    </Button>
  );
}
