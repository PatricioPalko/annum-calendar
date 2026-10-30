"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type AdminResendPaidEmailsButtonProps = {
  orderId: string;
  customerMissing: boolean;
  adminMissing: boolean;
};

export function AdminResendPaidEmailsButton({
  orderId,
  customerMissing,
  adminMissing,
}: AdminResendPaidEmailsButtonProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const warning =
    customerMissing && adminMissing
      ? "E-maily o platbe neodoslané"
      : customerMissing
        ? "Zákazník nedostal potvrdenie platby"
        : "Notifikácia adminovi neodoslaná";

  async function handleClick() {
    if (isSubmitting) {
      return;
    }

    setErrorMessage(null);

    try {
      setIsSubmitting(true);

      const response = await fetch(
        `/api/admin/orders/${orderId}/resend-paid-emails`,
        { method: "POST" },
      );

      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;

        setErrorMessage(
          result?.message ?? "E-maily sa nepodarilo odoslať. Skúste to znova.",
        );
        return;
      }

      router.refresh();
    } catch {
      setErrorMessage("E-maily sa nepodarilo odoslať. Skúste to znova.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-0.5">
      <p className="inline-flex items-center gap-1 text-[11px] font-bold text-[#C2410C]">
        <AlertTriangle className="size-3 shrink-0" aria-hidden />
        {warning}
      </p>

      <button
        type="button"
        onClick={handleClick}
        disabled={isSubmitting}
        className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-semibold text-[#3E0F28] underline underline-offset-2 transition hover:text-[#FC5A61] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting && <Loader2 className="size-3 animate-spin" aria-hidden />}
        Odoslať znova
      </button>

      {errorMessage && (
        <p role="alert" className="text-[11px] font-semibold text-[#FC5A61]">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
