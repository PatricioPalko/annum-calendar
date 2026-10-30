---
paths:
  - "app/**/*.{ts,tsx}"
  - "components/**/*.tsx"
  - "lib/**/*.ts"
  - "helpers/**/*.ts"
  - "proxy.ts"
  - "next.config.ts"
  - "supabase/**"
---

# Code-level security rules

These rules govern the code Claude writes. They are instructions, not enforcement; see `CLAUDE.md` → "Safety boundaries".

## Secrets and environment variables

- Refer to env vars by **name only**. Never print, log, echo, commit or hard-code values, and never create example values that look real.
- `NEXT_PUBLIC_*` is reserved for values safe in the browser:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - `NEXT_PUBLIC_APP_URL`
  - `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
  - `NEXT_PUBLIC_PACKETA_API_KEY`
  - `NEXT_PUBLIC_COOKIEBOT_ID`
  - `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- Server-only: `SUPABASE_SECRET_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_EMAIL`, `ADMIN_EMAILS`, `ORDER_PAYMENT_SIGNING_SECRET`, `UPLOAD_SIGNING_SECRET`, `TURNSTILE_SECRET_KEY`, `PACKETA_API_PASSWORD`, `PACKETA_ESHOP`, `CRON_SECRET`. Never give these a `NEXT_PUBLIC_` prefix or reference them in client code.

## Admin authorization (required sequence)

Every handler under `app/api/admin/**` must start with this sequence. `proxy.ts` only matches `/admin` pages, **not** `/api/admin`.

```ts
if (!isAdminMutationOriginAllowed(request)) return 403;          // also for GET downloads
const supabase = await createSupabaseServerClient();
const { data: { user }, error } = await supabase.auth.getUser();
if (error || !user || !isAdminEmail(user.email)) return 401;
```

- Admin pages call `await requireAdmin()` (`lib/auth/admin.ts`) as their first statement.
- Never add auth bypasses, debug flags, alternate cookies, or hard-coded admin emails.
- Customer data actions (download, Packeta, notify, complete) must also check `payment_status === "paid"`.
- The allowlist checks only `user.email`. Supabase public sign-ups must stay disabled (verified 2026-10-30, U-4). Never add sign-up UI.

## Capability tokens

- Payment links (`lib/order-payment-token.ts`), upload path tokens (`app/api/uploads/sign` + `finalize`) and finalize tokens (`lib/upload-finalize-token.ts`) are HMAC-SHA256 with the expiry inside the signed payload. They are compared with `crypto.timingSafeEqual`.
- New token types must reuse this pattern, embed their purpose in the payload (domain separation), and expire.
- Never mint a capability from identifiers alone. The cancel page re-verifies the token before building a new pay link.

## Customer personal data and photos

- Personal data: name, email, phone, Packeta point, birthdays, namedays, dedications, notes, and photos. `order_code` contains the customer's full name, so treat it as personal data.
- Don't put personal data in URLs you create, in logs, in analytics, or in error responses.
- Photos are the most sensitive asset:
  - Never make them public.
  - Never generate customer-facing download URLs.
  - Never open, download or inspect real customer photos while developing.
  - Use synthetic images for any testing.
- Original uploads keep their EXIF metadata (possibly GPS; N-14). Don't expose originals outside the admin export, which re-encodes them with `sharp` and strips metadata.

## Input handling

- Validate every external input with Zod at the server boundary, with `.max()` on every new string and array (M-7 tracks the existing gaps).
- The upload chain must not be weakened: Turnstile → server-chosen paths → per-file HMAC → storage existence check → finalize HMAC over sorted paths → path-prefix check in `/api/orders`. Type checks should require MIME **and** extension (L-4).
- Never trust client-sent prices, totals, delivery fees, discount amounts or the Packeta point. Recompute or validate on the server.

## Output encoding

- Emails: `escapeHtml` for every interpolation. Packeta XML: `escapeXml`. JSON-LD: the existing `JsonLd` component (escapes `<`). React text only otherwise; no new `dangerouslySetInnerHTML`.
- `Content-Disposition` filenames use sanitized `order_code` values only.

## Transport, headers, third parties

- Global headers in `next.config.ts`: HSTS, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`. There is no CSP yet (L-6). When adding a third-party origin, list it for the future CSP.
- Admin mutations rely on the Origin/Referer check. Same-origin `fetch` GETs send only `Referer`, so don't set `referrerPolicy: "no-referrer"` on admin requests.
- Third-party scripts: Cookiebot (auto-blocking), GA4 (consent-gated), Turnstile, and the Packeta widget. Adding any other needs approval.

## Abuse controls

- New public endpoints need `consumeRateLimit`. The limiter falls back to per-instance memory if the RPC fails (L-3), so don't rely on it as the only protection for expensive operations.
