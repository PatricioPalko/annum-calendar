import { OrderRow } from "@/app/types/types";
import { AdminResendPaidEmailsButton } from "@/components/admin/admin-resend-paid-emails-button";
import { formatDateOnly, formatTimeOnly } from "@/helpers/format-date-time";
import { getOrderCheckoutPaymentUrl } from "@/helpers/admin-order-payment-url";
import { cn } from "@/lib/utils";

import { AdminOrderCheckoutPaymentLink } from "./admin-order-checkout-payment-link";
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
  const checkoutPaymentUrl = getOrderCheckoutPaymentUrl(order);

  // Strict null: the columns are undefined until the email-tracking migration
  // is applied, and then no warning should show.
  const isPaid = order.payment_status === "paid";
  const customerEmailMissing = isPaid && order.customer_confirmed_at === null;
  const adminEmailMissing = isPaid && order.admin_notified_at === null;

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

      {(customerEmailMissing || adminEmailMissing) && (
        <AdminResendPaidEmailsButton
          orderId={order.id}
          customerMissing={customerEmailMissing}
          adminMissing={adminEmailMissing}
        />
      )}

      {checkoutPaymentUrl && (
        <AdminOrderCheckoutPaymentLink paymentUrl={checkoutPaymentUrl} />
      )}
    </div>
  );
}
