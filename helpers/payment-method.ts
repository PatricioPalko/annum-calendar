export const PAYMENT_METHODS = ["bank_transfer", "cash"] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/**
 * `payment_status` of orders paid outside the site (bank transfer or cash).
 * The site never confirms these payments; the operator checks them manually.
 */
export const OFFLINE_PAYMENT_STATUS = "offline";

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return value === "bank_transfer" || value === "cash";
}

export function getPaymentMethodLabel(method: PaymentMethod) {
  switch (method) {
    case "bank_transfer":
      return "Prevodom na účet";
    case "cash":
      return "V hotovosti pri odbere";
  }
}

/**
 * Orders the operator may fulfil (download photos, notify, complete): placed
 * with an offline payment, or older orders that were paid online.
 */
export function isFulfillablePaymentStatus(status: string | null | undefined) {
  return status === "paid" || status === OFFLINE_PAYMENT_STATUS;
}
