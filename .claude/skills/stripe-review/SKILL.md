---
name: stripe-review
description: Review of Annum Calendar's Stripe integration (Checkout session creation and reuse, webhook signature verification, event handling, idempotency, duplicate-payment refunds, amount and currency checks, order payment-status transitions, payment links, return pages). Use when changing or reviewing payment code, or when asked whether payments are consistent and safe.
argument-hint: "[file, diff or 'all']"
paths: "app/api/stripe/**, app/api/orders/**, lib/order-checkout.ts, lib/order-payments.ts, lib/order-payment-token.ts, lib/stripe.ts, app/objednavka/**"
---

# Stripe payment review

## Purpose

Confirm that every euro charged maps to exactly one paid order, that no order is marked paid without a matching verified payment, and that failures are recoverable and visible.

## When to use

- Any change under the `paths` above, or to `app/types/types.ts` / `helpers/discount-codes.ts` / `helpers/delivery.ts` (price inputs).
- Before releases, or when asked about payment consistency, idempotency or duplicate orders.

Scope: `$ARGUMENTS` (a file, a diff range, or `all`; default `git diff main...HEAD` limited to payment files).

## Workflow

1. **Read end to end** (always, regardless of scope): `lib/order-checkout.ts`, `lib/order-payments.ts`, `app/api/stripe/webhook/route.ts`, `app/api/orders/route.ts` (price section and checkout call), `app/api/orders/[orderCode]/pay/route.ts`, `app/objednavka/dakujeme/page.tsx`, `app/objednavka/platba-zrusena/page.tsx`, `lib/order-payment-token.ts`.
2. **Price authority.** Trace `getCalendarPrice` → `getDiscountAmount` → `+ getDeliveryPrice` → `total_price`, then `unit_amount = Math.round(total*100)`, then the webhook's `expectedAmountCents`. No client-supplied amount may reach Stripe or the DB. If price math changed, re-run the brute-force idea from `docs/PRODUCTION-AUDIT-REVIEW.md` (L-10) as a scratch script outside the repo.
3. **Session creation.**
   - `sessions.create` appears only in `getOrCreateOrderCheckoutSession` (`grep -rn "sessions.create" app lib`).
   - Metadata includes `orderId` and `orderCode`, the currency is `eur`, and there is one line item.
   - The open session is reused, the session id is persisted with a CAS, and losing sessions are expired.
   - Check whether `payment_method_types` / `payment_method_configuration` is set (H-1).
4. **Webhook security.**
   - `request.text()` + `constructEvent` happen before any DB access, with `runtime = "nodejs"`.
   - A missing secret or signature returns 400.
   - No other route mutates payment state from unsigned input.
5. **Event handling matrix.** For each event type, record what happens and the HTTP status:
   - `checkout.session.completed` (paid / unpaid);
   - `checkout.session.expired` (current / stale session);
   - `checkout.session.async_payment_succeeded` / `_failed` (H-1);
   - `charge.refunded` / `charge.dispute.*` (H-2);
   - a session without `metadata.orderId` (N-6);
   - a deleted order (H-3).

   5xx should mean "a retry can help"; anything permanent should be 2xx plus a log or alert.
6. **Idempotency and races.**
   - Mark-paid uses `.neq("payment_status","paid")` with `RETURNING`, and emails only on `status: "marked"`.
   - The webhook and the thank-you page can't both send emails.
   - The duplicate-session refund uses `idempotencyKey: duplicate-refund:<sessionId>`.
   - Expired-event handling only touches the current session.
   - Re-pay of a `failed` order: the status is not reset to `pending` (N-12).
7. **Payment links.** HMAC with the expiry inside the payload, `timingSafeEqual`, the same redirect for a missing order and a bad token, and the cancel page re-verifies before minting a new link. Payment-link `<Link>` prefetch (N-7). Query strings kept out of analytics (M-3).
8. **Order lifecycle coupling.**
   - Delivery wave computed at creation vs payment (H-5).
   - The paid-email price breakdown (N-3).
   - Admin delete versus open sessions (H-3).
   - Emails sent inside the webhook path (H-4 / N-8).
9. **Verify** each finding by re-reading the code. Classify it as new, known (roadmap ID) or resolved.

## Expected output

```text
## Stripe review: <scope>
Verdict: consistent | issues found
### Event matrix
| Event | Condition | Handler result | HTTP | OK? |
### Findings
| Sev | Title | Location | Known ID / new | Fix | Regression test |
### Invariants confirmed
### Dashboard checks for the user (read-only): payment methods, webhook endpoint URL + subscribed events, live vs test secret
```

## Safety restrictions

- Don't call the Stripe API or CLI, and don't create sessions, payments or refunds.
- Don't read `.env*` or print keys. Dashboard facts are listed for the user to check, never fetched.
- Read-only unless the user explicitly asks for fixes. In that case hand off to `backend-developer` practices.
