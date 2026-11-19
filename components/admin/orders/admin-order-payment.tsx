import { OrderRow } from "@/app/types/types";
import { AdminResendPaidEmailsButton } from "@/components/admin/admin-resend-paid-emails-button";
import { formatDateOnly, formatTimeOnly } from "@/helpers/format-date-time";
import { OFFLINE_PAYMENT_STATUS } from "@/helpers/payment-method";
import { cn } from "@/lib/utils";

import { AdminPaymentStatusBadge } from "./admin-payment-status-badge";

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
  // Strict null: the columns are undefined until the email-tracking migration
  // is applied, and then no warning should show. Only offline-payment orders
  // get the "order received" emails.
  const isAccepted = order.payment_status === OFFLINE_PAYMENT_STATUS;
  const customerEmailMissing =
    isAccepted && order.customer_confirmed_at === null;
  const adminEmailMissing = isAccepted && order.admin_notified_at === null;

  return (
    <div
      className={cn(
        "space-y-1",
        align === "end" && "flex flex-col items-end",
        className,
      )}
    >
      <AdminPaymentStatusBadge
        status={order.payment_status}
        method={order.payment_method}
      />

      {order.paid_at && (
        <p className="text-xs font-medium text-[#3E0F28]/50">
          {formatDateOnly(order.paid_at)} · {formatTimeOnly(order.paid_at)}
        </p>
      )}

      {(customerEmailMissing || adminEmailMissing) && (
        <AdminResendPaidEmailsButton
          orderId={order.id}
          customerMissing={customerEmailMissing}
          adminMissing={adminEmailMissing}
        />
      )}
    </div>
  );
}
