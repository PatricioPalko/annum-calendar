import { OrderRow } from "@/app/types/types";
import { formatDateOnly, formatTimeOnly } from "@/helpers/format-date-time";
import { cn } from "@/lib/utils";

import { AdminPaymentStatusBadge } from "./admin-payment-status-badge";
import { AdminStripePaymentLink } from "./admin-stripe-payment-link";

type AdminOrderPaymentProps = {
  order: OrderRow;
  className?: string;
  align?: "start" | "end";
};

export function AdminOrderPayment({
  order,
  className,
  align = "start",
}: AdminOrderPaymentProps) {
  return (
    <div
      className={cn(
        "space-y-1",
        align === "end" && "flex flex-col items-end",
        className,
      )}
    >
      <AdminPaymentStatusBadge status={order.payment_status} />

      {order.paid_at && (
        <p className="text-xs font-medium text-[#3E0F28]/50">
          {formatDateOnly(order.paid_at)} · {formatTimeOnly(order.paid_at)}
        </p>
      )}

      {order.payment_status === "paid" && (
        <AdminStripePaymentLink order={order} />
      )}
    </div>
  );
}
