import { AdminDeleteOrderButton } from "@/components/admin/admin-delete-order-button";
import { AdminDownloadButton } from "@/components/admin/admin-download-button";
import { formatPrice } from "@/helpers/admin-order-price";
import {
  getOrderDiscountAmount,
  getOrderOriginalPrice,
  hasOrderDiscount,
  truncateText,
} from "@/helpers/admin-orders";
import {
  getCalendarTypeBadgeClass,
  getCalendarTypeDotClass,
  getCalendarTypeLabel,
} from "@/helpers/admin-table";
import { formatDateOnly, formatTimeOnly } from "@/helpers/format-date-time";

import { OrderRow } from "@/app/types/types";
import { AdminCompleteOrderButton } from "../admin-complete-order-button";
import { AdminCreatePacketaPacketButton } from "../admin-create-packeta-packet-button";
import { AdminNotifyFulfillmentButton } from "../admin-notify-fulfillment-button";
import { AdminOrderDelivery } from "./admin-order-delivery";
import { AdminOrderJsonPreview } from "./admin-order-json-preview";
import { AdminOrderStatusBadge } from "./admin-order-status-badge";
import { AdminPaymentStatusBadge } from "./admin-payment-status-badge";

type AdminOrderCardProps = {
  order: OrderRow;
  index: number;
};

export function AdminOrderCard({ order, index }: AdminOrderCardProps) {
  const orderHasDiscount = hasOrderDiscount(order);
  const discountAmount = getOrderDiscountAmount(order);
  const originalPrice = getOrderOriginalPrice(order);

  return (
    <article className="rounded-xl border border-[#EAD6DE] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-[#3E0F28]/45">#{index + 1}</p>
          <p className="truncate font-bold text-[#3E0F28]">
            {order.order_code ?? order.id}
          </p>
          <p className="mt-1 text-xs font-medium text-[#3E0F28]/55">
            {formatDateOnly(order.created_at)} · {formatTimeOnly(order.created_at)}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <AdminPaymentStatusBadge status={order.payment_status} />
          <AdminOrderStatusBadge order={order} />
        </div>
      </div>

      <div className="mt-4 space-y-3 text-sm">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-[#3E0F28]/45">
            Zákazník
          </p>
          <p className="font-bold">
            {order.first_name} {order.last_name}
          </p>
          <p className="truncate text-xs font-medium text-[#3E0F28]/65">
            {order.email}
          </p>
          <p className="text-xs font-medium text-[#3E0F28]/55">
            {order.phone ?? "Bez telefónu"}
          </p>
        </div>

        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-[#3E0F28]/45">
            Kalendár
          </p>
          <span
            className={`inline-flex items-center gap-2 rounded-md py-1 text-xs font-extrabold uppercase tracking-wide ${getCalendarTypeBadgeClass(order.calendar_type)}`}
          >
            <span
              className={`size-2 rounded-md ${getCalendarTypeDotClass(order.calendar_type)}`}
            />
            {getCalendarTypeLabel(order.calendar_type)}
          </span>
          <p className="mt-1 text-xs font-semibold text-[#3E0F28]/65">
            {order.quantity} ks · {order.photos?.length ?? 0} fotiek
          </p>
          <p className="mt-1 font-bold text-[#3E0F28]">
            {order.total_price !== null && order.total_price !== undefined ? (
              <span className="inline-flex items-center gap-1.5">
                {orderHasDiscount && originalPrice !== null && (
                  <span className="text-[#3E0F28]/40 line-through">
                    {formatPrice(originalPrice)}
                  </span>
                )}
                {formatPrice(Number(order.total_price))}
              </span>
            ) : (
              "Cena na mieru"
            )}
          </p>
          {orderHasDiscount && (
            <p className="mt-1 text-xs font-bold text-[#3E0F28]">
              {order.discount_code} · -{formatPrice(discountAmount)}
            </p>
          )}
        </div>

        <div>
          <p className="mb-1 text-[11px] font-extrabold uppercase tracking-wide text-[#3E0F28]/45">
            Doručenie
          </p>
          <AdminOrderDelivery order={order} />
        </div>

        {order.note && (
          <div className="rounded-md border border-[#FC5A61]/20 bg-[#FFF7F4] px-3 py-2">
            <p className="text-[10px] font-extrabold uppercase text-[#FC5A61]">
              Poznámka
            </p>
            <p className="mt-1 break-words text-xs font-semibold leading-5 text-[#3E0F28]/80">
              {truncateText(order.note, 220)}
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#EAD6DE] pt-4">
        <AdminDownloadButton
          orderId={order.id}
          fileName={order.order_code ?? order.id}
          disabled={order.payment_status !== "paid"}
        />
        <AdminCreatePacketaPacketButton
          orderId={order.id}
          deliveryMethod={order.delivery_method}
          trackingNumber={order.tracking_number}
          disabled={order.payment_status !== "paid"}
        />
        <AdminNotifyFulfillmentButton
          orderId={order.id}
          deliveryMethod={order.delivery_method}
          trackingNumber={order.tracking_number}
          disabled={
            order.payment_status !== "paid" ||
            order.status === "ready" ||
            order.status === "shipped" ||
            order.status === "completed"
          }
        />
        <AdminCompleteOrderButton
          orderId={order.id}
          disabled={
            order.payment_status !== "paid" ||
            order.status === "completed" ||
            (order.status !== "ready" && order.status !== "shipped")
          }
        />
        <AdminOrderJsonPreview order={order} />
        <AdminDeleteOrderButton
          orderId={order.id}
          orderCode={order.order_code ?? order.id}
        />
      </div>
    </article>
  );
}
