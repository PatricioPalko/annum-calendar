import { OrderRow } from "@/app/types/types";
import {
  getPaymentMethodLabel,
  isPaymentMethod,
  OFFLINE_PAYMENT_STATUS,
} from "@/helpers/payment-method";

export function truncateText(value: string, maxLength = 80) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength).trimEnd()}...`;
}

export function getOrderDiscountAmount(order: OrderRow) {
  return Number(order.discount_amount ?? 0);
}

export function getOrderOriginalPrice(order: OrderRow) {
  if (order.total_price === null || order.total_price === undefined) {
    return null;
  }

  return Number(order.total_price) + getOrderDiscountAmount(order);
}

export function hasOrderDiscount(order: OrderRow) {
  return Boolean(order.discount_code) && getOrderDiscountAmount(order) > 0;
}

export type OrderPaymentGroup = "bank_transfer" | "cash" | "online" | "pending";

/** Offline method chosen by the customer, an older online payment, or unpaid. */
export function getOrderPaymentGroup(order: OrderRow): OrderPaymentGroup {
  if (order.payment_status === "paid") {
    return "online";
  }

  if (order.payment_status === OFFLINE_PAYMENT_STATUS) {
    return order.payment_method === "cash" ? "cash" : "bank_transfer";
  }

  return "pending";
}

export function getOrderJsonPreview(order: OrderRow) {
  return {
    id: order.id,
    orderCode: order.order_code,
    storageFolder: order.storage_folder,
    createdAt: order.created_at,

    payment: {
      status: order.payment_status,
      method: order.payment_method ?? null,
      methodLabel: isPaymentMethod(order.payment_method)
        ? getPaymentMethodLabel(order.payment_method)
        : null,
      paidAt: order.paid_at,
    },

    delivery: {
      method: "pickup",
      label: "Osobný odber",
      price: Number(order.delivery_price ?? 0),
      readyAt: order.ready_at ?? null,
    },

    customer: {
      firstName: order.first_name,
      lastName: order.last_name,
      email: order.email,
      phone: order.phone,
    },

    calendar: {
      type: order.calendar_type,
      quantity: order.quantity,
      totalPrice: order.total_price,
      discountCode: order.discount_code,
      discountAmount: order.discount_amount,
      note: order.note,
    },

    birthdays: order.birthdays ?? [],
    namedays: order.namedays ?? [],
    photoCount: order.photos?.length ?? 0,
    photos: order.photos ?? [],
  };
}
