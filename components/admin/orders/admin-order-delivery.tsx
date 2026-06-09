import { MapPin, Package } from "lucide-react";

import { getDeliveryLabel } from "@/helpers/admin-orders";

import { OrderRow } from "@/app/types/types";

type AdminOrderDeliveryProps = {
  order: OrderRow;
};

export function AdminOrderDelivery({ order }: AdminOrderDeliveryProps) {
  const isPacketa = order.delivery_method === "packeta";
  const deliveryPrice = Number(order.delivery_price ?? 0);

  return (
    <div className="max-w-52 space-y-1.5 text-xs font-semibold text-[#3E0F28]/70">
      <div className="inline-flex items-center gap-1.5 py-1 font-bold text-[#3E0F28]">
        {isPacketa ? (
          <Package className="size-3.5" />
        ) : (
          <MapPin className="size-3.5" />
        )}

        {getDeliveryLabel(order.delivery_method)}
      </div>

      {isPacketa && (
        <div className="space-y-0.5">
          <p className="font-bold text-[#3E0F28]">
            {order.packeta_point_name ?? "Výdajné miesto neuvedené"}
          </p>

          {order.packeta_point_address && (
            <p className="leading-5 text-[#3E0F28]/55">
              {order.packeta_point_address}
            </p>
          )}

          {order.packeta_point_id && (
            <p className="text-[11px] text-[#3E0F28]/40">
              ID: {order.packeta_point_id}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
