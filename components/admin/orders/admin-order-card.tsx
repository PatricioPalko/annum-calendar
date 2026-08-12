import { truncateText } from "@/helpers/admin-orders";
import { formatDateOnly, formatTimeOnly } from "@/helpers/format-date-time";
import { cn } from "@/lib/utils";

import { OrderRow } from "@/app/types/types";
import { isOrderFullyProcessed } from "@/helpers/admin-order-workflow";
import { AdminOrderCustomer } from "./admin-order-customer";
import { AdminOrderCalendarSummary } from "./admin-order-calendar-summary";
import { AdminOrderMetaLinks } from "./admin-order-meta-links";
import { AdminOrderPayment } from "./admin-order-payment";
import { AdminOrderWorkflow } from "./admin-order-workflow";
import { AdminOrderDelivery } from "./admin-order-delivery";

type AdminOrderCardProps = {
  order: OrderRow;
  index: number;
};

export function AdminOrderCard({ order, index }: AdminOrderCardProps) {
  const isFullyProcessed = isOrderFullyProcessed(order);

  return (
    <article
      className={cn(
        "rounded-xl border border-[#EAD6DE] p-4 shadow-sm",
        isFullyProcessed ? "bg-emerald-50/90" : "bg-white",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-[#3E0F28]/45">#{index + 1}</p>
          <p className="truncate font-bold text-[#3E0F28]">
            {order.order_code ?? order.id}
          </p>
          <p className="mt-1 text-xs font-medium text-[#3E0F28]/55">
            {formatDateOnly(order.created_at)} · {formatTimeOnly(order.created_at)}
          </p>
          <div className="mt-1">
            <AdminOrderMetaLinks
              orderId={order.id}
              orderCode={order.order_code ?? order.id}
              order={order}
            />
          </div>
        </div>

        <AdminOrderPayment order={order} align="end" />
      </div>

      <div className="mt-4 space-y-3 text-sm">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-[#3E0F28]/45">
            Zákazník
          </p>
          <AdminOrderCustomer order={order} />
        </div>

        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-[#3E0F28]/45">
            Kalendár
          </p>
          <AdminOrderCalendarSummary order={order} className="mt-1" />
        </div>

        <div>
          <p className="mb-1 text-[11px] font-extrabold uppercase tracking-wide text-[#3E0F28]/45">
            Doručenie
          </p>
          <AdminOrderDelivery order={order} />
        </div>

        {order.note && (
          <div className="max-w-56 rounded-md border border-[#FC5A61]/20 bg-[#FFF7F4] px-2.5 py-2">
            <p className="text-[10px] font-extrabold uppercase text-[#FC5A61]">
              Poznámka
            </p>
            <p className="mt-1 max-h-14 overflow-y-auto break-words text-xs font-semibold leading-4 text-[#3E0F28]/80">
              {truncateText(order.note, 100)}
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 border-t border-[#EAD6DE] pt-4">
        <AdminOrderWorkflow order={order} align="start" />
      </div>
    </article>
  );
}
