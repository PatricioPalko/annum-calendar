---
paths:
  - "app/**/*.{ts,tsx}"
  - "components/**/*.{ts,tsx}"
  - "lib/**/*.ts"
  - "helpers/**/*.ts"
  - "proxy.ts"
  - "next.config.ts"
---

# Architecture rules

## Module boundaries

Code is split by *where it may run*, not by layer folders. Respect these boundaries when adding or moving code.

**Server-only modules.** Never import these from a `"use client"` file or from anything a client file imports:

- `lib/supabase/admin.ts` (service-role client)
- `lib/stripe.ts`
- `lib/resend.ts`
- `lib/order-emails.ts`
- `lib/order-payments.ts`
- `lib/order-checkout.ts`
- `lib/order-export.ts`
- `lib/packeta.ts`
- `lib/order-payment-token.ts`
- `lib/upload-finalize-token.ts`
- `lib/rate-limit.ts`
- `lib/health-checks.ts`
- `lib/auth/admin.ts`
- `lib/supabase/server.ts`
- `helpers/order-code.ts` (uses `node:crypto`)

**Client-only modules:**

- `lib/upload-order-photos.ts`
- `lib/order-from-draft.ts`
- `lib/analytics.ts`
- `lib/supabase/browser.ts`
- `lib/supabase/client.ts`

**Shared pure modules** (safe on both sides, but **everything here ships to the browser**):

- `app/types/types.ts`
- `lib/schema.ts`
- `lib/order/config.ts`
- `lib/order/delivery-waves.ts`
- `helpers/discount-codes.ts`
- `helpers/delivery.ts`
- `helpers/phone.ts`
- `helpers/calendar-date.ts`
- `lib/seo.ts`
- `lib/legal.ts`

Never put secrets, unreleased codes or internal-only data in a shared module. Discount codes already leak this way (roadmap M-4); don't add more.

## Single sources of truth

Reuse these. Never re-implement them.

| Concern | Owner |
| --- | --- |
| Calendar price per variant and quantity | `getCalendarPrice` in `app/types/types.ts` |
| Delivery price (`packeta` 3.90 €, `pickup` 0 €) | `getDeliveryPrice` in `helpers/delivery.ts` |
| Discount math and the pickup permission | `getDiscountAmount` / `discountAllowsPickup` in `helpers/discount-codes.ts` |
| Order code and storage folder format | `helpers/order-code.ts` |
| Photo and dedication limits, Memory set prices | `lib/order/config.ts` |
| Delivery batches ("várky") | `lib/order/delivery-waves.ts` |
| Checkout session create or reuse | `getOrCreateOrderCheckoutSession` in `lib/order-checkout.ts` |
| Marking an order paid | `markOrderPaidFromCheckoutSession` in `lib/order-payments.ts` |
| Payment links | `lib/order-payment-token.ts` |
| Operator and legal identity | `lib/legal.ts` |
| Canonical site origin | `SITE_URL` in `lib/seo.ts` (must equal the `NEXT_PUBLIC_APP_URL` env value; roadmap M-10) |

## Integration adapters

Extend the existing adapter instead of creating a parallel one:

- Stripe: `lib/stripe.ts`
- Supabase: `lib/supabase/*`
- Resend: `getResend()` in `lib/resend.ts` (lazy) + `lib/order-emails.ts`
- Packeta: `lib/packeta.ts`
- Turnstile: inline verification in `app/api/uploads/sign/route.ts`

Do not add new third-party SDKs or services without explicit approval.

## Import-time side effects

`lib/stripe.ts` throws at import if `STRIPE_SECRET_KEY` is missing. The Resend client is created lazily by `getResend()` so a missing `RESEND_API_KEY` only breaks email (review N-9). Do **not** add import-time throws to modules on the order or payment path. Prefer lazy construction inside the function that needs the client. Startup env problems are reported by `instrumentation.ts` → `lib/env.ts` (log `ENV_CONFIG_ERROR` + `/admin` banner); add new required server env vars to `REQUIRED_SERVER_ENV` there.

## Rendering model (Next.js 16, no Cache Components)

- Check the route table printed by `npm run build` after changing pages. `○` means prerendered at build time; `ƒ` means rendered per request.
- `/` and the marketing and legal pages are static. Anything time-dependent in a Server Component on a static route (`new Date()`, delivery batches, "current" offers) is **frozen at build time**. Make it client-side or add a route segment `revalidate` (see `node_modules/next/dist/docs/01-app/02-guides/caching-without-cache-components.md`). This is review finding N-1.
- `fetch` and Route Handlers are not cached by default (`node_modules/next/dist/docs/01-app/01-getting-started/06-fetching-data.md`, `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`). Don't add caching to admin, order or payment data.

## Where new code goes

| New code | Location |
| --- | --- |
| Public JSON endpoint | `app/api/<area>/route.ts` |
| Admin endpoint | `app/api/admin/...` (see the security rule for the required auth sequence) |
| Domain logic shared by routes | a focused module in `lib/` (e.g. `lib/order-*.ts`) |
| Small pure helper or client hook | `helpers/` |
| Landing or marketing section | `components/sections/<name>/index.tsx` |
| Order-form field | `components/sections/order-form-components/<name>/index.tsx` |
| Admin UI | `components/admin/**` |
| UI primitive | `components/ui/` (shadcn, style `radix-nova`) |

Match the file's existing export style (named exports, plus `export default` where the folder already uses it).

`.cursor/rules/*.mdc` holds overlapping guidance for Cursor users. If you change a convention here, flag that the Cursor rule may need the same update.
