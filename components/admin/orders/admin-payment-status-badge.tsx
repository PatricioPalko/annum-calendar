import type { LucideIcon } from "lucide-react";
import {
  Banknote,
  CheckCircle2,
  Clock3,
  Landmark,
  RotateCcw,
  XCircle,
} from "lucide-react";

import { OFFLINE_PAYMENT_STATUS } from "@/helpers/payment-method";

type BadgeConfig = {
  label: string;
  icon: LucideIcon;
  className: string;
};

const PAYMENT_CONFIG: Record<string, BadgeConfig> = {
  paid: {
    label: "Zaplatené",
    icon: CheckCircle2,
    className: "border-emerald-300 bg-emerald-50 text-emerald-900",
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

// Offline payments are not verified on the site: the badge shows the method
// the customer chose, not a confirmed payment.
const OFFLINE_METHOD_CONFIG: Record<string, BadgeConfig> = {
  bank_transfer: {
    label: "Prevodom",
    icon: Landmark,
    className: "border-sky-300 bg-sky-50 text-sky-900",
  },
  cash: {
    label: "Hotovosť",
    icon: Banknote,
    className: "border-sky-300 bg-sky-50 text-sky-900",
  },
};

type AdminPaymentStatusBadgeProps = {
  status?: string | null;
  method?: string | null;
};

export function AdminPaymentStatusBadge({
  status,
  method,
}: AdminPaymentStatusBadgeProps) {
  const config =
    status === OFFLINE_PAYMENT_STATUS
      ? (OFFLINE_METHOD_CONFIG[method ?? ""] ?? OFFLINE_METHOD_CONFIG.bank_transfer!)
      : (PAYMENT_CONFIG[status ?? ""] ?? PAYMENT_CONFIG.pending!);
  const { label, icon: Icon, className } = config;

  return (
    <span
      className={`inline-flex h-7 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border px-2.5 text-xs font-bold ${className}`}
    >
      <Icon className="size-3.5 shrink-0" />
      {label}
    </span>
  );
}
