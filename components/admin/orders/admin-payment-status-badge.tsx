import type { LucideIcon } from "lucide-react";
import { CheckCircle2, Clock3, RotateCcw, XCircle } from "lucide-react";

type BadgeConfig = {
  label: string;
  icon: LucideIcon;
  className: string;
};

const PAYMENT_CONFIG: Record<string, BadgeConfig> = {
  paid: {
    label: "Zaplatené",
    icon: CheckCircle2,
    className: "border-[#3E0F28]/70 bg-[#C8FF3D]/40 text-[#3E0F28]",
  },
  pending: {
    label: "Čaká",
    icon: Clock3,
    className: "border-amber-300 bg-amber-50 text-amber-900",
  },
  failed: {
    label: "Zlyhané",
    icon: XCircle,
    className: "border-red-300 bg-red-50 text-red-900",
  },
  refunded: {
    label: "Vrátené",
    icon: RotateCcw,
    className: "border-gray-300 bg-gray-100 text-gray-700",
  },
};

type AdminPaymentStatusBadgeProps = {
  status?: string | null;
};

export function AdminPaymentStatusBadge({
  status,
}: AdminPaymentStatusBadgeProps) {
  const config = PAYMENT_CONFIG[status ?? ""] ?? PAYMENT_CONFIG.pending!;
  const { label, icon: Icon, className } = config;

  return (
    <span
      className={`inline-flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-xs font-bold ${className}`}
    >
      <Icon className="size-3.5 shrink-0" />
      {label}
    </span>
  );
}
