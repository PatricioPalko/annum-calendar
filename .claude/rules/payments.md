---
paths:
  - "app/api/orders/**/*.ts"
  - "app/api/stripe/**/*.ts"
  - "app/api/uploads/**/*.ts"
  - "app/objednavka/**/*.tsx"
  - "lib/order*.ts"
  - "lib/order/**/*.ts"
  - "lib/stripe.ts"
  - "app/types/types.ts"
  - "helpers/discount-codes.ts"
  - "helpers/delivery.ts"
  - "app/api/admin/orders/**/*.ts"
  - "components/admin/admin-delete-order-button.tsx"
---

# Payments and order lifecycle rules

## Invariants (never break these)

1. **The server owns the price.**
   - `app/api/orders/route.ts` recomputes the total with `getCalendarPrice` → `getDiscountAmount` → + `getDeliveryPrice`.
   - Client totals are never accepted.
   - Online payment requires `finalTotalPrice > 0`.
2. **Cent conversion is `Math.round(eur * 100)` everywhere.**
   - Used for the Checkout `unit_amount` (`lib/order-checkout.ts`) and the webhook check (`lib/order-payments.ts`).
   - The DB stores `numeric(10,2)`.
   - A brute force over all 3 600 valid combinations found no mismatch (review L-10). Keep it that way, and prefer integer cents for new math.
3. **One Checkout line item** in `eur`, plus `metadata: { orderId, orderCode }` and `client_reference_id: order.id`. `metadata.orderId` is how the webhook finds the order. Never omit it.
4. **Sessions are created only by `getOrCreateOrderCheckoutSession`.**
   - It reuses an open session, re-checks the DB, expires stale sessions, and persists the new id with a CAS on the previous id.
   - Don't call `stripe.checkout.sessions.create` anywhere else.
5. **Orders are marked paid only by `markOrderPaidFromCheckoutSession`.**
   - Called from the webhook and from the thank-you page fallback (`app/objednavka/dakujeme/page.tsx`).
   - It verifies `payment_status === "paid"`, `amount_total`, and `currency === "eur"`.
   - It updates conditionally (`.neq("payment_status","paid")`).
   - It runs emails only when it won (`status: "marked"`).
   - It refunds a second, different paid session with `idempotencyKey: duplicate-refund:<sessionId>`.
6. **No other code may set `payment_status = 'paid'`.**

## Webhook (`app/api/stripe/webhook/route.ts`)

- Read the raw body with `await request.text()`, verify with `stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET)` **before** anything else, and keep `runtime = "nodejs"`.
- Events handled today:
  - `checkout.session.completed`: mark paid.
  - `checkout.session.expired`: set `failed` only if it is still the current session and not paid.
  - Everything else returns 200.
- Return **5xx only when a Stripe retry can succeed** (a transient DB error). For events that don't belong to this app (no `metadata.orderId`) or permanent conditions, return 2xx and log or alert. Today these return 400/500 forever (review N-6); don't extend that pattern.
- Handlers must be idempotent under replay and reordering. Rely on conditional updates, not on event-id bookkeeping.
- Known gaps, tracked in `docs/IMPLEMENTATION-ROADMAP.md`:
  - No `checkout.session.async_payment_succeeded` / `_failed` handling (H-1).
  - No `charge.refunded` / `charge.dispute.*` handling (H-2).
  - Payment for a deleted order: `markOrderPaidFromCheckoutSession` refunds it (`missing-order-refund:<sessionId>`), alerts the admin and returns `skipped` (200). A failed refund returns 500 so Stripe retries.
- Adding an event type also requires the user to subscribe the endpoint in the Stripe Dashboard. Say so in the change summary.

## Payment links and return pages

- `buildOrderPaymentUrl` / `verifyOrderPaymentToken` give an HMAC token with a 90-day TTL. The pay route returns the same redirect for a missing order and for a bad token (no oracle). Keep that.
- `success_url` → `/objednavka/dakujeme?session_id={CHECKOUT_SESSION_ID}`. `cancel_url` → `/objednavka/platba-zrusena?orderId=…&token=…`. Both pages are `noindex`. Their query strings must never reach analytics (M-3).
- The thank-you page message must reflect the **DB** state after the mark-paid attempt, not just Stripe's (N-10).

## Business rules encoded in code

- Variants: `basic`, `premium`, `memory` (Memory set). `business` exists only for the B2B inquiry and is not orderable online.
- Quantity is 1–200. Pricing tiers: 1–2 at the single price, 3–4 at the 3-pack unit price, 5+ at the 5-pack unit price.
- Premium and Memory set allow birthdays and namedays. Only Memory set allows dedications, exactly one entry per calendar (may be empty).
- Delivery: `packeta` (3.90 €, requires a pickup point) or `pickup`. Pickup is allowed **only** with a discount code that has `allowsPickup` (currently `RODINA15`), and this is enforced on the server.
- Delivery batch: `getDeliveryWaveForDate` at order creation is stored as `delivery_wave_key`. The promise is "ordered **and paid** by", so recomputing at payment is roadmap H-5.

## Admin actions on orders

- Download, Packeta label, fulfillment email, and complete all require `payment_status === "paid"`.
- Deleting an order (`app/api/admin/orders/[orderId]/route.ts`) refuses paid orders and sessions that are complete (409), expires an open Checkout session first, and deletes the row with `.neq("payment_status","paid")` before removing photos. Keep these guards in any change to deletion.

## Testing and safety

- Use Stripe **test mode** only: test keys, test cards, `stripe listen` / `stripe trigger` run by the user against a local server.
- Claude never creates real sessions, payments or refunds, and never asks for live keys.
- Changes to anything in this rule's scope need the P0 tests in `.claude/rules/testing.md` (once a runner exists) or an explicit manual test-mode verification note.
