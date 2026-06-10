import { OrderRow } from "@/app/types/types";
import type { LucideIcon } from "lucide-react";
import {
  CheckCircle2,
  DownloadCloud,
  Inbox,
  PackageCheck,
  Truck,
} from "lucide-react";

type BadgeConfig = {
  label: string;
  icon: LucideIcon;
  className: string;
};

const STATUS_CONFIG: Partial<Record<string, BadgeConfig>> = {
  ready: {
    label: "Pripravené",
    icon: PackageCheck,
    className: "border-amber-300 bg-amber-50 text-amber-900",
  },
  shipped: {
    label: "Odoslané",
    icon: Truck,
    className: "border-violet-300 bg-violet-50 text-violet-900",
  },
  completed: {
    label: "Vybavené",
    icon: CheckCircle2,
    className: "border-[#3E0F28]/70 bg-[#C8FF3D]/40 text-[#3E0F28]",
  },
};

const DOWNLOADED: BadgeConfig = {
  label: "Stiahnuté",
  icon: DownloadCloud,
  className: "border-sky-300 bg-sky-50 text-sky-900",
};

const NEW: BadgeConfig = {
  label: "Nové",
  icon: Inbox,
  className: "border-gray-300 bg-gray-100 text-gray-700",
};

function Badge({ label, icon: Icon, className }: BadgeConfig) {
  return (
    <span
      className={`inline-flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-xs font-bold ${className}`}
    >
      <Icon className="size-3.5 shrink-0" />
      {label}
    </span>
  );
}

export function AdminOrderStatusBadge({ order }: AdminOrderStatusBadgeProps) {
  const config =
    STATUS_CONFIG[order.status] ?? (order.downloaded_at ? DOWNLOADED : NEW);

  return <Badge {...config} />;
}

type AdminOrderStatusBadgeProps = {
  order: OrderRow;
};
