import { CheckCircle2, DownloadIcon, Inbox } from "lucide-react";

import { OrderRow } from "@/app/types/types";

type AdminOrderStatusBadgeProps = {
  order: OrderRow;
};

export function AdminOrderStatusBadge({ order }: AdminOrderStatusBadgeProps) {
  if (order.status === "completed") {
    return (
      <span className="inline-flex items-center h-8 gap-1 rounded-md border border-[#3E0F28]/80 bg-[#C8FF3D]/70 px-2.5 py-1 text-xs font-bold text-[#3E0F28]">
        <CheckCircle2 className="size-4" />
        Vybavené
      </span>
    );
  }

  if (order.downloaded_at) {
    return (
      <span className="inline-flex items-center h-8 gap-1 rounded-md border border-secondary bg-[#FFF7F4] px-2.5 py-1 text-xs font-bold text-secondary">
        <DownloadIcon className="size-4" />
        Stiahnuté
      </span>
    );
  }

  return (
    <span className="inline-flex items-center h-8 gap-1 rounded-md border border-[#3E0F28]/80 bg-[#FFF7F4] px-2.5 py-1 text-xs font-bold text-[#3E0F28]/80">
      <Inbox className="size-4" />
      Nové
    </span>
  );
}
