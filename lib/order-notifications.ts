import {
  isPaymentMethod,
  OFFLINE_PAYMENT_STATUS,
} from "@/helpers/payment-method";
import {
  sendOrderReceivedEmails,
  type OrderReceivedEmailsResult,
} from "@/lib/order-emails";
import { supabaseAdmin } from "@/lib/supabase/admin";

type OrderEmailRow = {
  id: string;
  order_code: string | null;
  order_number: number | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  note: string | null;
  calendar_type: string;
  quantity: number;
  total_price: number | string | null;
  delivery_price: number | string | null;
  delivery_wave_key: string | null;
  payment_status: string | null;
  payment_method: string | null;
  discount_code: string | null;
  discount_amount: number | string | null;
  photos: unknown[] | null;
  birthdays: unknown[] | null;
  namedays: unknown[] | null;
  dedications: unknown[] | null;
  customer_confirmed_at: string | null;
  admin_notified_at: string | null;
};

const orderEmailSelect = `
  id,
  order_code,
  order_number,
  first_name,
  last_name,
  email,
  phone,
  note,
  calendar_type,
  quantity,
  total_price,
  delivery_price,
  delivery_wave_key,
  payment_status,
  payment_method,
  discount_code,
  discount_amount,
  photos,
  birthdays,
  namedays,
  dedications,
  customer_confirmed_at,
  admin_notified_at
`;

export type ResendOrderEmailsResult =
  | { status: "not_found" }
  | { status: "not_eligible" }
  | { status: "nothing_to_send" }
  | {
      status: "sent";
      customerRequested: boolean;
      adminRequested: boolean;
      customerSent: boolean;
      adminSent: boolean;
    }
  | { status: "error"; message: string };

/**
 * Sends the "order received" emails (customer confirmation with payment
 * instructions and admin notification) that have not been recorded as sent.
 * Used right after an order is created, by the scheduled retry and by the
 * "Odoslať znova" button in /admin. The admin button passes no idempotency
 * key, because the resend is intentional.
 */
export async function resendMissingOrderEmails(
  orderId: string,
  options: { idempotencyKeyPrefix?: string } = {},
): Promise<ResendOrderEmailsResult> {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select(orderEmailSelect)
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    console.error("RESEND_ORDER_EMAILS_LOOKUP_ERROR:", { orderId, error });
    return { status: "error", message: error.message };
  }

  if (!data) {
    return { status: "not_found" };
  }

  const order = data as OrderEmailRow;

  if (
    order.payment_status !== OFFLINE_PAYMENT_STATUS ||
    !isPaymentMethod(order.payment_method)
  ) {
    return { status: "not_eligible" };
  }

  const customerRequested = order.customer_confirmed_at === null;
  const adminRequested = order.admin_notified_at === null;

  if (!customerRequested && !adminRequested) {
    return { status: "nothing_to_send" };
  }

  const result = await sendOrderEmails(order, {
    customer: customerRequested,
    admin: adminRequested,
    idempotencyKeyPrefix: options.idempotencyKeyPrefix,
  });

  if (!result) {
    return { status: "error", message: "Order has no order code." };
  }

  return {
    status: "sent",
    customerRequested,
    adminRequested,
    customerSent: result.customerSent,
    adminSent: result.adminSent,
  };
}

/**
 * Sends the requested emails and records which ones went out in
 * `customer_confirmed_at` / `admin_notified_at`, so failures stay visible in
 * the admin and can be resent.
 */
async function sendOrderEmails(
  order: OrderEmailRow,
  emailOptions: { customer: boolean; admin: boolean; idempotencyKeyPrefix?: string },
): Promise<OrderReceivedEmailsResult | null> {
  if (!order.order_code || !isPaymentMethod(order.payment_method)) {
    console.error("ORDER_EMAIL_SKIPPED:", {
      orderId: order.id,
      reason: "missing_order_code_or_payment_method",
    });

    return null;
  }

  const totalPrice =
    order.total_price === null || order.total_price === undefined
      ? null
      : Number(order.total_price);
  const deliveryPrice = Number(order.delivery_price ?? 0);
  const discountAmount =
    order.discount_amount === null || order.discount_amount === undefined
      ? null
      : Number(order.discount_amount);

  const result = await sendOrderReceivedEmails(
    {
      orderCode: order.order_code,
      orderNumber: order.order_number,
      firstName: order.first_name,
      lastName: order.last_name,
      email: order.email,
      phone: order.phone,
      totalPrice,
      calendarType:
        order.calendar_type === "basic" ||
        order.calendar_type === "premium" ||
        order.calendar_type === "memory" ||
        order.calendar_type === "business"
          ? order.calendar_type
          : "basic",
      quantity: order.quantity,
      // Goods price before the discount, so goods − discount + delivery = total.
      goodsPrice:
        totalPrice === null
          ? null
          : Math.max(0, totalPrice - deliveryPrice + (discountAmount ?? 0)),
      discountCode: order.discount_code,
      discountAmount,
      deliveryWaveKey: order.delivery_wave_key,
      paymentMethod: order.payment_method,
      photoCount: Array.isArray(order.photos) ? order.photos.length : undefined,
      birthdaysCount: Array.isArray(order.birthdays)
        ? order.birthdays.length
        : undefined,
      namedaysCount: Array.isArray(order.namedays)
        ? order.namedays.length
        : undefined,
      dedications: Array.isArray(order.dedications)
        ? order.dedications.filter(
            (entry): entry is string =>
              typeof entry === "string" && entry.trim().length > 0,
          )
        : undefined,
      note: order.note,
    },
    emailOptions,
  );

  if (result.customerError) {
    console.error("ORDER_CUSTOMER_EMAIL_ERROR:", {
      orderId: order.id,
      error: result.customerError,
    });
  }

  if (result.adminError) {
    console.error("ORDER_ADMIN_EMAIL_ERROR:", {
      orderId: order.id,
      error: result.adminError,
    });
  }

  const sentAt = new Date().toISOString();
  const emailStatus: { customer_confirmed_at?: string; admin_notified_at?: string } =
    {};

  if (result.customerSent) {
    emailStatus.customer_confirmed_at = sentAt;
  }

  if (result.adminSent) {
    emailStatus.admin_notified_at = sentAt;
  }

  if (Object.keys(emailStatus).length > 0) {
    const { error } = await supabaseAdmin
      .from("orders")
      .update(emailStatus)
      .eq("id", order.id);

    if (error) {
      console.error("ORDER_EMAIL_STATUS_UPDATE_ERROR:", {
        orderId: order.id,
        error,
      });
    }
  }

  return result;
}
