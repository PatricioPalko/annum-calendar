---
paths:
  - "**/*.test.{ts,tsx}"
  - "**/*.spec.{ts,tsx}"
  - "tests/**"
  - "e2e/**"
  - "vitest.config.*"
  - "playwright.config.*"
  - "app/api/**/*.ts"
  - "lib/order*.ts"
  - "lib/order/**/*.ts"
  - "app/types/types.ts"
  - "helpers/discount-codes.ts"
---

# Testing rules

## Setup

- **Vitest 4** (`npm test`, `npm run test:watch`), config `vitest.config.mts`, node environment. Tests live in `tests/unit/**/*.test.ts`. `tests/unit/setup.ts` assigns placeholder env values unconditionally, so runs are identical locally and in CI.
- **CI:** `.github/workflows/ci.yml` runs `npm ci` → lint → `tsc --noEmit` → `npm test` → `npm run build` on pull requests and pushes to `main`, with placeholder env only.
- Every change must keep all four green. Also check the build's route table (`○` static vs `ƒ` dynamic) when pages change.
- Adding any other test library (Playwright, Testing Library, coverage) changes `package.json` and the lockfile and **requires explicit user approval**. Propose; don't install.

## Conventions

- Call route handlers directly: `POST(new Request(url, init), { params: Promise.resolve({...}) })`.
- Mock at the module boundary with `vi.mock`: `@/lib/supabase/admin` (use the in-memory `createFakeSupabase()` from `tests/unit/helpers/fake-supabase.ts`, which applies conditional updates like Postgres), `@/lib/order-emails` (or `@/lib/resend` to render real templates), `@/lib/order-notifications`, `@/lib/supabase/server`. Share state with mocks via `await vi.hoisted(async () => …)`.
- `after()` from `next/server`: mock it to collect tasks, then flush them in the test (see `tests/unit/orders-route.test.ts`), so post-response work is asserted explicitly.
- Tests must never reach live Supabase, Resend or Cloudflare.
- Fixtures are synthetic: fake names like `Test Testovací`, `@example.com` emails, generated images. **Never** use real customer data or photos.
- E2E (proposed, not installed): Playwright against `npm run build && npm run start` with the Turnstile test site key and a non-production Supabase project, in `tests/e2e/**/*.spec.ts`.

## Priority coverage (P0; from both audits)

All P0 unit tests are implemented: pricing (`pricing.test.ts`), order form schema (`order-schema.test.ts`), order emails and their recording (`order-emails.test.ts`, `order-notifications.test.ts`), env checks (`env.test.ts`), admin delete guard (`admin-delete-order.test.ts`), `POST /api/orders` (`orders-route.test.ts`), admin authorization for every `app/api/admin/**` route (`admin-routes-auth.test.ts`, table-driven: add new admin routes to `orderRoutes`), delivery waves and the N-1 `revalidate` check (`delivery-waves.test.ts`), plus the order-email retry job (`retry-paid-emails.test.ts`) and error alerts (`error-reporting.test.ts`). Still missing: E2E (needs approval).

The fake Supabase client supports select / insert / update / delete, eq / neq / is / lt / gt / or (`col.is.null`, `col.eq.value`), order and limit. Mock `@/lib/rate-limit`'s `consumeRateLimit` (keep the rest via `importOriginal`) instead of faking the RPC.

Auth tests must make the guard under test the **only** reason to reject (e.g. a paid order for Origin tests) and assert the message, otherwise a later guard can mask a missing one. Validation tests should send payloads shaped like the real client, including **omitted** optional keys (`value || undefined` drops them from the JSON; see V-1).

| Area | Must assert |
| --- | --- |
| Pricing | `getCalendarPrice` × variants × quantities {1,2,3,4,5,6,10,200}, codes {none, ANNUM20}, retired codes rejected. Plus a property test that `Math.round(total*100)` equals the cents of the `numeric(10,2)`-rounded total for all 1 200 pickup combinations. |
| `POST /api/orders` | Rejects a tampered photo path, a foreign storage folder, a bad finalize token, a missing or unknown payment method, dedications on non-Memory orders, and a dedication count ≠ quantity. Accepts the canonical payload, inserting `offline` + `payment_method` + `pickup` with the server-computed total, and queues the order emails in `after()`. |
| Order emails | Bank transfer (IBAN, variable symbol, payment note), cash, admin notification, escaping (`order-emails.test.ts`). Only offline orders are eligible; only sent emails are recorded (`order-notifications.test.ts`). |
| Admin authorization | Every `app/api/admin/**` route: no session → 401, non-allowlisted → 401, wrong Origin → 403, unfinished older online order → 403 where applicable; offline orders pass. |
| Delivery waves | Boundary dates in the shop timezone, and the static-page freeze (N-1). |

P1 covers uploads (sign, finalize, token forgery), rate-limit 429s, and mobile E2E at 375/390/768/1024/1440 with axe checks.

## Writing tests

- One behavior per test, with Slovak user-facing strings asserted exactly where they are part of the contract.
- Every bug fix in this rule's scope comes with a regression test, once a runner exists, that fails before the fix.
- Don't weaken production code (e.g. export internals or add test-only branches) just to make it testable without saying so.
