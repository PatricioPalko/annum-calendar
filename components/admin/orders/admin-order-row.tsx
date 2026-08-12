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

type AdminOrderRowProps = {
  order: OrderRow;
  index: number;
};

export function AdminOrderRow({ order, index }: AdminOrderRowProps) {
  const isFullyProcessed = isOrderFullyProcessed(order);

  return (
    <tr
      className={cn(
        "relative text-[#3E0F28]",
        isFullyProcessed
          ? "bg-emerald-50/90"
          : index % 2 === 0
            ? "bg-[#FFF7F4]"
            : "bg-white",
      )}
    >
      <td className="px-3 py-3 align-top font-bold text-[#3E0F28]/50">
        {index + 1}
      </td>

      <td className="px-3 py-3 align-top">
        <div className="space-y-1">
          <p
            className="font-bold text-[#3E0F28] truncate max-w-40 sm:max-w-none"
            title={order.order_code ?? order.id}
          >
            {order.order_code ?? order.id}
          </p>

          <p className="text-xs font-medium text-[#3E0F28]/55">
            {formatDateOnly(order.created_at)} ·{" "}
            {formatTimeOnly(order.created_at)}
          </p>

          <AdminOrderMetaLinks
            orderId={order.id}
            orderCode={order.order_code ?? order.id}
            order={order}
          />
        </div>
      </td>

      <td className="px-3 py-3 align-top">
        <AdminOrderCustomer order={order} />
      </td>

      <td className="min-w-36 px-3 py-3 align-top">
        <div className="space-y-2">
          <AdminOrderCalendarSummary order={order} />

          {order.note && (
            <div className="max-w-28 rounded-md border border-[#FC5A61]/20 bg-white/80 px-2 py-1.5">
              <p className="text-[10px] font-extrabold uppercase text-[#FC5A61]">
                Poznámka
              </p>
              <p className="mt-0.5 max-h-14 overflow-y-auto break-words text-[11px] font-semibold leading-4 text-[#3E0F28]/80">
                {truncateText(order.note, 100)}
              </p>
            </div>
          )}
        </div>
      </td>

      <td className="px-3 py-3 align-top">
        <AdminOrderDelivery order={order} />
      </td>

      <td className="px-3 py-3 align-top">
        <AdminOrderPayment order={order} />
      </td>

      <td className="min-w-56 px-3 py-3 align-top">
        <AdminOrderWorkflow order={order} align="start" />
      </td>
    </tr>
  );
}
