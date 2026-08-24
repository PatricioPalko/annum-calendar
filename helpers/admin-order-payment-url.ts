import { OrderRow } from "@/app/types/types";
import { buildOrderPaymentUrl } from "@/lib/order-payment-token";

export function getOrderCheckoutPaymentUrl(order: OrderRow): string | null {
  if (
    order.payment_status === "paid" ||
    order.payment_status === "refunded" ||
    !order.order_code ||
    order.total_price === null ||
    Number(order.total_price) <= 0
  ) {
    return null;
  }

  try {
    return buildOrderPaymentUrl(order.id, order.order_code);
  } catch {
    return null;
  }
}
