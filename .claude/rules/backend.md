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
- Use `export const runtime = "nodejs"` where the file already does (cron, ZIP routes). It is the default.
- Long-running routes set `export const maxDuration`.

GET handlers must not mutate state. (`GET /api/orders/[orderCode]/pay` only redirects old payment links to `/`.)

## Errors and logging

- Clients get short **Slovak** messages with no stack traces, SQL errors or provider responses. Admin routes may return actionable messages.
- Log server-side as `console.error("UPPER_SNAKE_CODE:", context)`. Reuse the existing code style (`CREATE_ORDER_ERROR`, `ORDER_CREATED_EMAIL_ERROR`, `ORDER_CUSTOMER_EMAIL_ERROR`, …).
- **Never log** full request bodies, emails, phones, names, notes, dedications, photo names or tokens. Log ids (`orderId`), status codes and error objects.
- Uncaught server errors email the operator via `onRequestError` (`instrumentation.ts` → `lib/error-reporting.ts`); errors a handler catches and logs do **not**. Make failures in order and email paths log a distinct code, and call `sendAdminAlertEmail` (ids only) where the operator must act.

## Outbound calls

- Add `AbortSignal.timeout(...)` when touching any `fetch` to Turnstile (N-8).
- Resend sends that can be retried pass an `idempotencyKey` (pattern: `order-created/${orderId}` in `app/api/orders/route.ts`).
- Work that must not delay the response (emails, notifications) belongs in `after()` from `next/server`. It is supported in Route Handlers; see `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/after.md`.

## Resend (email)

- Send only through `lib/order-emails.ts` → `sendEmail()`, which throws on a Resend `error`. Templates are inline HTML via `renderEmailShell`, and **every** interpolated value passes through `escapeHtml`.
- Recipient variables:
  - `ADMIN_EMAIL` (comma-separated) receives notifications.
  - `ADMIN_EMAILS` is the **login allowlist**, a different variable.
  - `EMAIL_FROM` is the sender.
- Existing emails:
  - `sendOrderReceivedEmails`: customer confirmation with payment instructions (bank transfer or cash) plus admin notification.
  - `sendOrderFulfillmentEmail`: ready for pickup.
  - `sendAdminAlertEmail`: operator alerts (failed email retry, server errors), ids only.
  - `sendBusinessInquiryEmail`.
- An email failure must **never** undo or block an order. Order emails run via `after()` in `resendMissingOrderEmails` (`lib/order-notifications.ts`), which records `customer_confirmed_at` / `admin_notified_at`; unsent ones show a warning and an "Odoslať znova" button in `/admin`.
- When computing the price breakdown, goods − discount + delivery must equal the total (review N-3, fixed in `lib/order-notifications.ts`).
- Never send to real addresses while developing or testing. Claude must not trigger any send.

## Payments and delivery

No payment provider and no carrier: personal pickup only, bank transfer or cash checked by the operator outside the site. See `payments.md`.

## Turnstile

`app/api/uploads/sign/route.ts` verifies `turnstileToken` server-side before reserving an order number. Don't move ordering steps in front of that check. New anonymous write endpoints should use Turnstile too.

## Scheduled jobs

`POST /api/cron/retry-paid-emails` (path kept for the existing workflow) resends order emails of offline orders not recorded as sent. It is called every 15 minutes by `.github/workflows/retry-paid-emails.yml` with `Authorization: Bearer ${CRON_SECRET}` (compared timing-safe; 503 when unset). Cron responses contain counts only, because Actions logs on the public repo are public. New scheduled work follows the same pattern: POST, secret header, bounded batch, idempotent.

## Health endpoints

`/api/health` is a public liveness check. `/api/health/deep` checks the DB, storage and the Resend config and is currently public (L-5). Don't add more checks that call paid APIs or reveal configuration.
