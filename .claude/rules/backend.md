---
paths:
  - "app/api/**/*.ts"
  - "app/**/route.ts"
  - "app/objednavka/dakujeme/page.tsx"
  - "app/objednavka/platba-zrusena/page.tsx"
  - "app/admin/page.tsx"
  - "lib/**/*.ts"
  - "proxy.ts"
---

# Backend rules

## Route handler shape

Follow the sequence the existing handlers use (`app/api/orders/route.ts`, `app/api/uploads/*/route.ts`):

1. **Rate limit**: `consumeRateLimit(scope, getClientIp(request), { windowMs, max })` from `lib/rate-limit.ts`, returning `rateLimitResponse()` as 429. Existing scopes: `orders-create`, `orders-pay`, `upload-sign`, `upload-finalize`, `business-inquiry`. Every new public endpoint needs its own scope.
2. **Config check** for the env vars the handler needs. Log `XYZ_CONFIG_ERROR` and return a generic 500 Slovak message.
3. **Parse the body** inside `try/catch` and return 400 on malformed JSON. Several existing handlers don't do this yet (L-2); don't copy that.
4. **Validate** with a Zod `safeParse` and return `{ message, errors: parsed.error.flatten() }` with 400.
5. **Authorization** (admin routes: see the security rule) and business-rule checks.
6. **DB and integration work** through `lib/` modules.
7. **Respond** with `NextResponse.json(...)`.

Next.js 16 specifics:

- Dynamic `params` are a `Promise`: `{ params }: { params: Promise<{ orderId: string }> }` → `await params`.
- `cookies()` and `headers()` are async.
- Use `export const runtime = "nodejs"` where the file already does (webhook, ZIP routes). It is the default.
- Long-running routes set `export const maxDuration`.

GET handlers must not mutate state. The pay link `GET /api/orders/[orderCode]/pay` is a known exception, because it can create a Checkout session. Don't add more.

## Errors and logging

- Clients get short **Slovak** messages with no stack traces, SQL errors or provider responses. Admin routes may return actionable messages (e.g. mapped `PacketaApiError`).
- Log server-side as `console.error("UPPER_SNAKE_CODE:", context)`. Reuse the existing code style (`CREATE_ORDER_ERROR`, `MARK_ORDER_PAID_UPDATE_ERROR`, `PAID_ORDER_EMAIL_ERROR`, …).
- **Never log** full request bodies, emails, phones, names, notes, dedications, photo names or tokens. Log ids (`orderId`, Stripe ids), status codes and error objects.
- There is no error monitoring yet (H-4). Make failures in money-relevant paths log a distinct code, so alerting can be attached later.

## Outbound calls

- Add `AbortSignal.timeout(...)` when touching any `fetch` to Turnstile or Packeta (N-8).
- Every Stripe create or refund needs an `idempotencyKey` (pattern: `duplicate-refund:${session.id}` in `lib/order-payments.ts`).
- Work that must not delay the response (emails, notifications) belongs in `after()` from `next/server`. It is supported in Route Handlers; see `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/after.md`.

## Resend (email)

- Send only through `lib/order-emails.ts` → `sendEmail()`, which throws on a Resend `error`. Templates are inline HTML via `renderEmailShell`, and **every** interpolated value passes through `escapeHtml`.
- Recipient variables:
  - `ADMIN_EMAIL` (comma-separated) receives notifications.
  - `ADMIN_EMAILS` is the **login allowlist**, a different variable.
  - `EMAIL_FROM` is the sender.
- Existing emails:
  - `sendOrderCreatedEmail`: awaiting payment, with the payment link.
  - `sendOrderPaidEmail`: customer confirmation plus admin notification.
  - `sendOrderFulfillmentEmail`: shipped or ready for pickup.
  - `sendBusinessInquiryEmail`.
- An email failure must **never** undo or block a payment state change. Paid-order emails run via `after()` in `sendPaidOrderEmails` (`lib/order-payments.ts`), which records `customer_confirmed_at` / `admin_notified_at`; unsent ones show a warning and an "Odoslať znova" button in `/admin`. Payment anomalies go to the operator through `sendAdminAlertEmail` (ids only, no customer data, deduplicated per code and session).
- When computing the price breakdown, goods − discount + delivery must equal the total. The paid email currently violates this (review N-3).
- Never send to real addresses while developing or testing. Claude must not trigger any send.

## Packeta

- API calls only via `createPacketaPacket` in `lib/packeta.ts` (XML REST at `zasilkovna.cz/api/rest`). Escape every value with `escapeXml`, map errors to `PacketaApiError`, and use the env vars `PACKETA_API_PASSWORD` and `PACKETA_ESHOP`.
- Packet creation is **admin-only, paid-only, Packeta-delivery-only**, and short-circuits when `tracking_number` exists (`app/api/admin/orders/[orderId]/create-packeta-packet/route.ts`). The packet `number` is `order_number`.
- The pickup point (`packeta_point_id/name/address`) comes from the client widget (`components/delivery/packeta-picker`, SK vendors, Z-BOX preferred) and is **untrusted**. Validate its shape and length; never use it for anything but display and `addressId`.

## Turnstile

`app/api/uploads/sign/route.ts` verifies `turnstileToken` server-side before reserving an order number. Don't move ordering steps in front of that check. New anonymous write endpoints should use Turnstile too.

## Health endpoints

`/api/health` is a public liveness check. `/api/health/deep` checks the DB, storage and Stripe and is currently public (L-5). Don't add more checks that call paid APIs or reveal configuration.
