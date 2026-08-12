"use client";

import { Loader2, MailCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AdminNotifyFulfillmentButtonProps = {
  orderId: string;
  deliveryMethod?: string | null;
  trackingNumber?: string | null;
  disabled?: boolean;
  labeled?: boolean;
  label?: string;
};

export function AdminNotifyFulfillmentButton({
  orderId,
  deliveryMethod,
  trackingNumber,
  disabled = false,
  labeled = false,
  label,
}: AdminNotifyFulfillmentButtonProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleClick() {
    if (disabled || isSubmitting) {
      return;
    }

    const trackingNumberInput =
      deliveryMethod === "packeta" && !trackingNumber
        ? window
            .prompt("Zadaj tracking číslo Packety, ak ho máš:", "")
            ?.trim()
        : trackingNumber ?? undefined;

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
            trackingNumber: trackingNumberInput || undefined,
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

  const actionLabel =
    label ??
    (deliveryMethod === "packeta"
      ? "Odoslať info o odoslaní"
      : "Odoslať info o odberu");

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
          <MailCheck className="size-2.5" />
        )}
        {actionLabel}
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
      title={actionLabel}
      aria-label={actionLabel}
      className={cn("size-5 rounded-md p-0 [&_svg]:size-2.5")}
    >
      {isSubmitting ? (
        <Loader2 className="size-2.5 animate-spin" />
      ) : (
        <MailCheck className="size-2.5" />
      )}
    </Button>
  );
}
