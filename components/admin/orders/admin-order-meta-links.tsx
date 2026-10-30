"use client";

import { AdminDeleteOrderButton } from "@/components/admin/admin-delete-order-button";
import { AdminOrderJsonPreview } from "@/components/admin/orders/admin-order-json-preview";

type AdminOrderMetaLinksProps = {
  orderId: string;
  orderCode: string;
  order: Parameters<typeof AdminOrderJsonPreview>[0]["order"];
};

export function AdminOrderMetaLinks({
  orderId,
  orderCode,
  order,
}: AdminOrderMetaLinksProps) {
  // Paid orders are accounting records; the API refuses to delete them too.
  const canDelete = order.payment_status !== "paid";

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] font-semibold">
      <AdminOrderJsonPreview order={order} variant="link" />
      {canDelete && (
        <>
          <span className="text-[#3E0F28]/20">·</span>
          <AdminDeleteOrderButton
            orderId={orderId}
            orderCode={orderCode}
            variant="link"
          />
        </>
      )}
    </div>
  );
}
