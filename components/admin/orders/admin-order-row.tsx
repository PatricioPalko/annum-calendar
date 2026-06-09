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
import { cn } from "@/lib/utils";

import { OrderRow } from "@/app/types/types";
import { AdminOrderDelivery } from "./admin-order-delivery";
import { AdminOrderJsonPreview } from "./admin-order-json-preview";
import { AdminOrderStatusBadge } from "./admin-order-status-badge";
import { AdminPaymentStatusBadge } from "./admin-payment-status-badge";

type AdminOrderRowProps = {
  order: OrderRow;
  index: number;
};

export function AdminOrderRow({ order, index }: AdminOrderRowProps) {
  const orderHasDiscount = hasOrderDiscount(order);
  const discountAmount = getOrderDiscountAmount(order);
  const originalPrice = getOrderOriginalPrice(order);

  return (
    <tr
      className={cn(
        "relative text-[#3E0F28]",
        index % 2 === 0 ? "bg-[#FFF7F4]" : "bg-white",
      )}
    >
      <td className="px-3 py-3 align-top font-bold text-[#3E0F28]/50">
        {index + 1}
      </td>

      <td className="px-3 py-3 align-top">
        <div className="space-y-1">
          <p
            className="font-bold text-[#3E0F28]"
            title={order.order_code ?? order.id}
          >
            {order.order_code ?? order.id}
          </p>

          <p className="text-xs font-medium text-[#3E0F28]/55">
            {formatDateOnly(order.created_at)} ·{" "}
            {formatTimeOnly(order.created_at)}
          </p>
        </div>
      </td>

      <td className="px-3 py-3 align-top">
        <div className="space-y-1">
          <p className="font-bold">
            {order.first_name} {order.last_name}
          </p>

          <p className="text-xs font-medium text-[#3E0F28]/65">{order.email}</p>

          <p className="text-xs font-medium text-[#3E0F28]/55">
            {order.phone ?? "Bez telefónu"}
          </p>
        </div>
      </td>

      <td className="w-70 max-w-50 px-3 py-3 align-top">
        <div className="space-y-3">
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-md py-1 text-xs font-extrabold uppercase tracking-wide",
              getCalendarTypeBadgeClass(order.calendar_type),
            )}
          >
            <span
              className={cn(
                "size-2 rounded-md",
                getCalendarTypeDotClass(order.calendar_type),
              )}
            />

            {getCalendarTypeLabel(order.calendar_type)}
          </span>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-[#3E0F28]/65">
            <span>{order.quantity} ks</span>

            <span>
              {order.total_price !== null && order.total_price !== undefined ? (
                <span className="inline-flex items-center gap-1.5">
                  {orderHasDiscount && originalPrice !== null && (
                    <span className="text-[#3E0F28]/40 line-through">
                      {formatPrice(originalPrice)}
                    </span>
                  )}

                  <span className="font-bold text-[#3E0F28]">
                    {formatPrice(Number(order.total_price))}
                  </span>
                </span>
              ) : (
                "Cena na mieru"
              )}
            </span>

            <span>{order.photos?.length ?? 0} fotiek</span>
          </div>

          {orderHasDiscount && (
            <div className="inline-flex w-fit items-center gap-1.5 text-xs font-bold text-[#3E0F28]">
              <span>{order.discount_code}</span>
              <span className="text-[#3E0F28]/45">|</span>
              <span>-{formatPrice(discountAmount)}</span>
            </div>
          )}

          {order.note && (
            <div className="max-w-50 rounded-md border border-[#FC5A61]/20 bg-white px-3 py-2">
              <p className="text-[10px] font-extrabold uppercase text-[#FC5A61]">
                Poznámka
              </p>

              <div className="mt-1 max-h-20 overflow-y-auto pr-2 text-xs font-semibold leading-5 text-[#3E0F28]/80">
                <p className="whitespace-pre-wrap wrap-break-words">
                  {truncateText(order.note, 220)}
                </p>
              </div>
            </div>
          )}
        </div>
      </td>

      <td className="px-3 py-3 align-top">
        <AdminOrderDelivery order={order} />
      </td>

      <td className="px-3 py-3 align-top">
        <div className="space-y-1.5">
          <AdminPaymentStatusBadge status={order.payment_status} />

          {order.paid_at && (
            <p className="text-xs font-medium text-[#3E0F28]/50">
              {formatDateOnly(order.paid_at)} · {formatTimeOnly(order.paid_at)}
            </p>
          )}
        </div>
      </td>

      <td className="px-3 py-3 align-top">
        <AdminOrderStatusBadge order={order} />
      </td>

      <td className="px-3 py-3 align-top text-right">
        <div className="flex justify-end gap-2">
          <AdminOrderJsonPreview order={order} />

          <AdminDownloadButton
            orderId={order.id}
            fileName={order.order_code ?? order.id}
            disabled={order.payment_status !== "paid"}
          />

          <AdminDeleteOrderButton
            orderId={order.id}
            orderCode={order.order_code ?? order.id}
          />
        </div>
      </td>
    </tr>
  );
}
