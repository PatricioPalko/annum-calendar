import { MapPin } from "lucide-react";

import {
  formatWaveDeadline,
  formatWaveDeliveryBy,
  getDeliveryWaveByKey,
} from "@/lib/order/delivery-waves";

import { OrderRow } from "@/app/types/types";

type AdminOrderDeliveryProps = {
  order: OrderRow;
};

export function AdminOrderDelivery({ order }: AdminOrderDeliveryProps) {
  const deliveryWave = getDeliveryWaveByKey(order.delivery_wave_key);

  return (
    <div className="max-w-52 space-y-1.5 text-xs font-semibold text-[#3E0F28]/70">
      <div className="inline-flex items-center gap-1.5 py-1 font-bold text-[#3E0F28]">
        <MapPin className="size-3.5" />
        Osobný odber
      </div>

      {deliveryWave && (
        <div className="space-y-0.5 rounded-md border border-[#EAD6DE] bg-white/70 px-2 py-1.5">
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#3E0F28]/45">
            Várka tlače
          </p>
          <p className="font-bold text-[#3E0F28]">{deliveryWave.batchLabel}</p>
          {deliveryWave.key !== "standard" && (
            <p className="leading-5 text-[#3E0F28]/55">
              Do {formatWaveDeadline(deliveryWave)} · na odber do{" "}
              {formatWaveDeliveryBy(deliveryWave)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
