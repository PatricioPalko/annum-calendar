"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

type AdminCopyTextButtonProps = {
  value: string;
  className?: string;
};

export function AdminCopyTextButton({
  value,
  className,
}: AdminCopyTextButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      window.alert("Kopírovanie sa nepodarilo.");
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Kopírovať"
      className={cn(
        "group flex w-full max-w-full cursor-pointer items-center gap-1.5 rounded-md px-0.5 py-0.5 text-left transition hover:bg-[#3E0F28]/5",
        className,
      )}
    >
      <span className="truncate">{value}</span>
      {copied ? (
        <Check
          className="size-3 shrink-0 text-emerald-600"
          strokeWidth={2.5}
          aria-hidden
        />
      ) : (
        <Copy
          className="size-3 shrink-0 text-[#3E0F28]/30 transition group-hover:text-[#3E0F28]/60"
          aria-hidden
        />
      )}
      <span className="sr-only">Kopírovať</span>
    </button>
  );
}
