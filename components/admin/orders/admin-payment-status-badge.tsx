import { CheckCircle2, Clock3, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";

function getPaymentStatusLabel(status?: string | null) {
  switch (status) {
    case "paid":
      return "Zaplatené";
    case "failed":
      return "Zlyhané";
    case "refunded":
      return "Vrátené";
    case "pending":
    default:
      return "Čaká";
  }
}

function getPaymentStatusClass(status?: string | null) {
  switch (status) {
    case "paid":
      return "border-[#3E0F28]/70 bg-[#C8FF3D]/70 text-[#3E0F28]";
    case "failed":
      return "border-[#FC5A61]/40 bg-[#FFF7F4] text-[#FC5A61]";
    case "refunded":
      return "border-[#3E0F28]/20 bg-white text-[#3E0F28]/60";
    case "pending":
    default:
      return "border-[#EAD6DE] bg-white text-[#3E0F28]/60";
  }
}

function PaymentStatusIcon({ status }: { status?: string | null }) {
  switch (status) {
    case "paid":
      return <CheckCircle2 className="size-4" />;
    case "failed":
    case "refunded":
      return <XCircle className="size-4" />;
    case "pending":
    default:
      return <Clock3 className="size-4" />;
  }
}

type AdminPaymentStatusBadgeProps = {
  status?: string | null;
};

export function AdminPaymentStatusBadge({
  status,
}: AdminPaymentStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center h-8 gap-1 rounded-md border px-2.5 py-1 text-xs font-bold",
        getPaymentStatusClass(status),
      )}
    >
      <PaymentStatusIcon status={status} />
      {getPaymentStatusLabel(status)}
    </span>
  );
}
