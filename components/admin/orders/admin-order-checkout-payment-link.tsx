"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

type AdminOrderCheckoutPaymentLinkProps = {
  paymentUrl: string;
};

export function AdminOrderCheckoutPaymentLink({
  paymentUrl,
}: AdminOrderCheckoutPaymentLinkProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(paymentUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      window.alert("Kopírovanie sa nepodarilo.");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <a
        href={paymentUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="cursor-pointer text-[11px] font-semibold text-[#3E0F28]/45 transition hover:text-[#635BFF]"
        title="Otvoriť Stripe checkout pre zákazníka"
      >
        Odkaz na platbu →
      </a>

      <button
        type="button"
        onClick={handleCopy}
        title="Kopírovať odkaz na platbu"
        className="inline-flex cursor-pointer items-center rounded p-0.5 text-[#3E0F28]/30 transition hover:bg-[#3E0F28]/5 hover:text-[#3E0F28]/60"
      >
        {copied ? (
          <Check className="size-3 text-emerald-600" strokeWidth={2.5} aria-hidden />
        ) : (
          <Copy className="size-3" aria-hidden />
        )}
        <span className="sr-only">Kopírovať odkaz na platbu</span>
      </button>
    </div>
  );
}
