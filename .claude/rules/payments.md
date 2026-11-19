---
paths:
  - "app/api/orders/**/*.ts"
  - "app/api/uploads/**/*.ts"
  - "app/api/cron/**/*.ts"
  - "app/objednavka/**/*.tsx"
  - "lib/order*.ts"
  - "lib/order/**/*.ts"
  - "app/types/types.ts"
  - "helpers/discount-codes.ts"
  - "helpers/delivery.ts"
  - "helpers/payment-method.ts"
  - "app/api/admin/orders/**/*.ts"
  - "components/admin/admin-delete-order-button.tsx"
---

# Payments and order lifecycle rules

The shop takes orders from family and friends only. **There is no online payment and no carrier.** Stripe and Packeta were removed from the code (2026-11-19). Customers pick up in person in Košice and pay by bank transfer or in cash at pickup. The site never takes, confirms or refunds a payment; the operator checks payments outside the site.

## Invariants (never break these)

1. **The server owns the price.**
   - `app/api/orders/route.ts` recomputes the total with `getCalendarPrice` → `getDiscountAmount` → + `getDeliveryPrice()` (pickup, 0 €).
   - Client totals, delivery fees and discount amounts are never accepted.
   - The total must be a positive number; `numeric(10,2)` stores it. Cents are `Math.round(eur * 100)` (`tests/unit/pricing.test.ts` checks every combination).
2. **New orders are offline orders.** `POST /api/orders` inserts `payment_status = 'offline'`, `payment_method` (`bank_transfer` | `cash`, required) and `delivery_method = 'pickup'`. Any Packeta fields an outdated client sends are ignored.
3. **Nothing on the site sets `payment_status = 'paid'`.** `paid`, `pending` and `failed` exist only on older orders from the removed Stripe flow.
4. **Payment methods have one owner:** `helpers/payment-method.ts` (`PAYMENT_METHODS`, `OFFLINE_PAYMENT_STATUS`, `getPaymentMethodLabel`, `isFulfillablePaymentStatus`). Don't re-implement the checks.

## Order emails

- After the insert, `POST /api/orders` calls `resendMissingOrderEmails` (`lib/order-notifications.ts`) inside `after()`. It sends `sendOrderReceivedEmails` (`lib/order-emails.ts`): the customer confirmation with payment instructions and the admin notification, and records `customer_confirmed_at` / `admin_notified_at`.
- Bank transfer instructions: amount, IBAN from `BANK_ACCOUNT_IBAN` (server-only env), variable symbol = `order_number`, payment note = `order_code`. Without the env var the email says the account number follows separately and logs `BANK_ACCOUNT_CONFIG_ERROR`.
- Only `offline` orders with a valid method get these emails (`not_eligible` otherwise). The scheduled retry (`/api/cron/retry-paid-emails`) and the admin "Odoslať znova" button reuse the same function. An email failure never undoes or blocks the order.

## Business rules encoded in code

- Variants: `basic`, `premium`, `memory` (Memory set). `business` exists only for the B2B inquiry and is not orderable online.
- Quantity is 1–200. Pricing tiers: 1–2 at the single price, 3–4 at the 3-pack unit price, 5+ at the 5-pack unit price.
- Premium and Memory set allow birthdays and namedays. Only Memory set allows dedications, exactly one entry per calendar (may be empty).
- Delivery: personal pickup in Košice only, 0 €. Discount code: `ANNUM20` (20 %).
- Payment: `bank_transfer` or `cash`, chosen in the form (no default), stored in `orders.payment_method` (migration `20261119_order_payment_method.sql`).
- Delivery batch: `getDeliveryWaveForDate` at order creation is stored as `delivery_wave_key` ("ready for pickup by").
- The old pay link `GET /api/orders/[orderCode]/pay` only redirects to `/`, so links in older emails keep working.

## Admin actions on orders

- Download, the "ready for pickup" email and complete require `isFulfillablePaymentStatus` (`offline`, or `paid` for older orders).
- Deleting an order (`app/api/admin/orders/[orderId]/route.ts`) refuses older `paid` orders (409, accounting records) and deletes with `.neq("payment_status","paid")` before removing photos. Offline orders can be deleted (e.g. a cancelled family order).
- The admin shows the chosen method ("Prevodom" / "Hotovosť") and a payment filter; it never claims an offline payment was received.

## Testing and safety

- Covered by `pricing.test.ts`, `orders-route.test.ts`, `order-notifications.test.ts`, `order-emails.test.ts`, `retry-paid-emails.test.ts`, `admin-routes-auth.test.ts`, `admin-delete-order.test.ts`.
- Never send real emails while developing or testing.
- Re-adding an online payment provider or carrier is a new integration: it needs explicit approval, new dependencies and new rules.
