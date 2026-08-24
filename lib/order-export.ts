import { getDeliveryWaveByKey } from "@/lib/order/delivery-waves";

type OrderExportPhoto = {
  index: number;
  name: string;
  path: string;
  originalType: string;
  originalSize: number;
  type: string;
  size: number;
  fileName: string;
  localPath: string;
  width: number;
  height: number;
  orientation: string;
  processed: boolean;
};

type OrderExportRow = {
  id: string;
  order_code: string | null;
  storage_folder: string | null;
  created_at: string;
  payment_status: string;
  paid_at: string | null;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  delivery_method: string | null;
  delivery_price: number | string | null;
  delivery_wave_key: string | null;
  packeta_point_id: string | null;
  packeta_point_name: string | null;
  packeta_point_address: string | null;
  tracking_number: string | null;
  shipped_at: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  calendar_type: string;
  quantity: number;
  total_price: number | null;
  discount_code: string | null;
  discount_amount: number | null;
  note: string | null;
  birthdays: unknown;
  namedays: unknown;
  dedications?: unknown;
  dedication?: string | null;
};

function normalizeOptionalString(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

export function normalizeExportDedications(raw: unknown) {
  if (!Array.isArray(raw)) {
    return [] as string[];
  }

  return raw.map((entry) => normalizeOptionalString(entry).trim());
}

export function buildOrderExportData(
  order: OrderExportRow,
  exportPhotos: OrderExportPhoto[],
) {
  const dedications = normalizeExportDedications(order.dedications);
  const legacyDedication = normalizeOptionalString(order.dedication).trim();
  const resolvedDedications =
    dedications.length > 0
      ? dedications
      : legacyDedication
        ? [legacyDedication]
        : [];

  return {
    id: order.id,
    orderCode: order.order_code ?? order.id,
    storageFolder: order.storage_folder ?? "",
    createdAt: order.created_at,

    payment: {
      status: order.payment_status,
      paidAt: order.paid_at,
      stripeCheckoutSessionId: order.stripe_checkout_session_id,
      stripePaymentIntentId: order.stripe_payment_intent_id,
    },

    delivery: {
      method: order.delivery_method ?? "pickup",
      label: order.delivery_method === "packeta" ? "Packeta" : "Osobný odber",
      price: Number(order.delivery_price ?? 0),
      wave: order.delivery_wave_key
        ? {
            key: order.delivery_wave_key,
            batchLabel:
              getDeliveryWaveByKey(order.delivery_wave_key)?.batchLabel ??
              order.delivery_wave_key,
          }
        : null,
      packetaPoint: order.packeta_point_id
        ? {
            id: order.packeta_point_id,
            name: normalizeOptionalString(order.packeta_point_name),
            address: normalizeOptionalString(order.packeta_point_address),
          }
        : null,
      trackingNumber: order.tracking_number ?? null,
      shippedAt: order.shipped_at ?? null,
    },

    customer: {
      firstName: order.first_name,
      lastName: order.last_name,
      email: order.email,
      phone: normalizeOptionalString(order.phone),
    },

    calendar: {
      type: order.calendar_type,
      quantity: order.quantity,
      totalPrice: order.total_price,
      discountCode: normalizeOptionalString(order.discount_code) || null,
      discountAmount: order.discount_amount,
      note: normalizeOptionalString(order.note) || null,
    },

    dedications: resolvedDedications,
    dedication: resolvedDedications.find((entry) => entry.length > 0) ?? null,

    birthdays: order.birthdays ?? [],
    namedays: order.namedays ?? [],
    photoCount: exportPhotos.length,
    photos: exportPhotos,
  };
}
