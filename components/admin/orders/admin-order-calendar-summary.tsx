import { OrderRow } from "@/app/types/types";
import { formatPrice } from "@/helpers/admin-order-price";
import {
  getOrderDiscountAmount,
  getOrderOriginalPrice,
  hasOrderDiscount,
} from "@/helpers/admin-orders";
import {
  getCalendarTypeBadgeClass,
  getCalendarTypeDotClass,
  getCalendarTypeLabel,
} from "@/helpers/admin-table";
import { cn } from "@/lib/utils";

type AdminOrderCalendarSummaryProps = {
  order: OrderRow;
  className?: string;
};

export function AdminOrderCalendarSummary({
  order,
  className,
}: AdminOrderCalendarSummaryProps) {
  const orderHasDiscount = hasOrderDiscount(order);
  const discountAmount = getOrderDiscountAmount(order);
  const originalPrice = getOrderOriginalPrice(order);
  const hasPrice =
    order.total_price !== null && order.total_price !== undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      <span
        className={cn(
          "inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide",
          getCalendarTypeBadgeClass(order.calendar_type),
        )}
      >
        <span
          className={cn(
            "size-2 shrink-0 rounded-md",
            getCalendarTypeDotClass(order.calendar_type),
          )}
        />
        {getCalendarTypeLabel(order.calendar_type)}
      </span>

      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        {hasPrice ? (
          <>
            <span className="text-sm font-bold leading-none text-[#3E0F28]">
              {formatPrice(Number(order.total_price))}
            </span>
            {orderHasDiscount && originalPrice !== null && (
              <span className="text-xs font-semibold leading-none text-[#3E0F28]/40 line-through">
                {formatPrice(originalPrice)}
              </span>
            )}
          </>
        ) : (
          <span className="text-sm font-bold text-[#3E0F28]">Na mieru</span>
        )}
      </div>

      <p className="text-xs font-semibold text-[#3E0F28]/60">
        {order.quantity} ks · {order.photos?.length ?? 0} fotiek
      </p>

      {orderHasDiscount && (
        <span className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
          {order.discount_code} −{formatPrice(discountAmount)}
        </span>
      )}
    </div>
  );
}
