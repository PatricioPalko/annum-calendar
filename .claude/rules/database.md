---
paths:
  - "supabase/**"
  - "lib/supabase/**"
  - "lib/rate-limit.ts"
  - "lib/health-checks.ts"
  - "lib/order-payments.ts"
  - "lib/order-checkout.ts"
  - "app/api/**/*.ts"
  - "app/admin/**"
  - "app/objednavka/**"
  - "helpers/admin-*.ts"
---

# Database and Supabase rules

## Clients: pick the right one

| Client | File | Key | Use for |
| --- | --- | --- | --- |
| `supabaseAdmin` | `lib/supabase/admin.ts` | `SUPABASE_SECRET_KEY` (service role, **server only**) | All table and storage access in route handlers and server pages |
| `createSupabaseServerClient()` | `lib/supabase/server.ts` | publishable key + cookies | Reading the admin auth session on the server (`getUser()`) |
| `createSupabaseBrowserClient()` | `lib/supabase/client.ts` | publishable key | Admin login and logout in the browser only |
| `supabaseBrowser` | `lib/supabase/browser.ts` | publishable key | `uploadToSignedUrl` for customer photos only |

- Browser code **never** queries tables or calls RPCs.
- On the server, verify identity with `auth.getUser()`, never `getSession()`.
- `proxy.ts` follows the `@supabase/ssr` cookie pattern. Keep `getAll` / `setAll` intact.

## Schema and migrations

- The schema is applied **manually** in the Supabase SQL editor. There is no CLI migration history.
  - `supabase/schema.sql` is the full-state snapshot, with idempotent "incremental patches".
  - `supabase/migrations/YYYYMMDD_description.sql` holds deltas.
- For a schema change, add a new idempotent migration file (`add column if not exists`, `create … if not exists`, `drop constraint if exists` + `add constraint`) **and** mirror it into `schema.sql`. End migrations with `notify pgrst, 'reload schema';` as the existing one does.
- Claude writes SQL files only. **Never apply SQL, never run mutations against any Supabase project, and never ask for the service-role key.** The user applies migrations.
- Production parity is unverified (review M-8 / U-5). When a change depends on existing DB state, say so and give the user read-only verification queries.

## Tables

`public.orders`:

- Identity: `id uuid`, `order_number` (sequence `order_number_seq` via RPC `next_order_number`), `order_code` (`lastname-firstname-year-<type><qty>-<rand4>`, **contains the customer's name**), `storage_folder`.
- Money: `numeric(10,2)` EUR (`total_price`, `delivery_price`, `discount_amount`).
- Statuses are free text today (no CHECK constraint):
  - `payment_status`: `pending` → `paid` | `failed`. `refunded` is read in `helpers/admin-order-payment-url.ts` but never written (H-2).
  - `status`: `new` → `ready` (pickup) or `shipped` (Packeta) → `completed`.
- Timestamps use the `*_at` naming (`paid_at`, `downloaded_at`, `completed_at`, `ready_at`, `shipped_at`, `terms_accepted_at`, `marketing_consent_at`, `customer_confirmed_at`, `admin_notified_at`). The last two are `null` while a paid-order email is unsent, and `undefined` in rows until migration `20261030_order_email_tracking.sql` is applied.
- JSON columns: `photos`, `birthdays`, `namedays`, `dedications`.

`public.rate_limit_counters` is only accessed through RPC `consume_rate_limit` (`lib/rate-limit.ts`).

## RLS and privileges

- Every `public` table has RLS **enabled with no policies** for `anon` / `authenticated`. Keep it that way. Access goes through `supabaseAdmin` with authorization enforced in route code.
- New functions use `security definer` + `set search_path = public`, and need **all** of:
  ```sql
  revoke all on function public.fn(...) from public;
  revoke execute on function public.fn(...) from anon, authenticated;
  grant execute on function public.fn(...) to service_role;
  ```

  `next_order_number` and `consume_rate_limit` got the second revoke in `supabase/migrations/20261030_revoke_rpc_client_execute.sql` (review N-2). Applied and verified in production on 2026-10-30.

## Writes and state transitions

- Every state transition is a **conditional update** (compare-and-set) with `.select(...).maybeSingle()`. Treat a `null` result as "lost the race" and re-read. Patterns: `.neq("payment_status", "paid")` in `markOrderPaidFromCheckoutSession`, and the session-id CAS in `persistCheckoutSessionId`.
- Run side effects (emails, refunds) only from the branch that won the update.
- Supabase-js returns `{ data, error }` and doesn't throw. Always check `error` and handle `data === null` separately from errors.

## Reads

- Select explicit columns in new code. Existing `select("*")` in admin routes and pages is debt (L-7). The API caps responses at 1 000 rows by default, so paginate admin lists.
- Don't fetch personal data you don't render or need.

## Storage (`calendar-uploads`)

- The bucket is private, with a 10 MB limit and `image/jpeg`, `image/png`, `image/webp` only. Never add public read or list policies, `getPublicUrl`, or signed **download** URLs for customers.
- Path format: `orders/<year>-<NNN>/<index>-<uuid>-<safe-name>`, built only on the server (`helpers/order-code.ts`, `app/api/uploads/sign/route.ts`).
- Uploads: `createSignedUploadUrl` (no upsert) → browser `uploadToSignedUrl` → server finalize. Downloads only via `supabaseAdmin.storage.download` inside admin routes that check `payment_status === "paid"`.
- There is no automatic photo deletion and orphaned uploads exist (M-2). Any new deletion logic must not delete order rows needed for accounting.
