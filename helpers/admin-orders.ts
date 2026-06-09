import { OrderRow } from "@/app/types/types";

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

export function getDeliveryLabel(method?: string | null) {
  switch (method) {
    case "packeta":
      return "Packeta";
    case "pickup":
    default:
      return "Osobný odber";
  }
}

export function getOrderJsonPreview(order: OrderRow) {
  return {
    id: order.id,
    orderCode: order.order_code,
    storageFolder: order.storage_folder,
    createdAt: order.created_at,

    payment: {
      status: order.payment_status,
      paidAt: order.paid_at,
      stripeCheckoutSessionId: order.stripe_checkout_session_id,
      stripePaymentIntentId: order.stripe_payment_intent_id,
    },

    delivery: {
      method: order.delivery_method ?? "pickup",
      label: getDeliveryLabel(order.delivery_method),
      price: Number(order.delivery_price ?? 0),
      packetaPoint: order.packeta_point_id
        ? {
            id: order.packeta_point_id,
            name: order.packeta_point_name,
            address: order.packeta_point_address,
          }
        : null,
      trackingNumber: order.tracking_number ?? null,
      shippedAt: order.shipped_at ?? null,
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
