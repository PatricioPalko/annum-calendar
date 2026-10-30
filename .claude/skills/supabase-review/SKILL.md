---
name: supabase-review
description: Review of Annum Calendar's Supabase usage (SSR auth and admin session handling, client and key separation, RLS and function privileges, schema and migration hygiene, Storage bucket and photo access, query patterns and conditional updates). Use when changing supabase/*.sql, lib/supabase, auth or admin code, storage or upload code, or when asked whether customer data and photos are protected.
argument-hint: "[file, diff or 'all']"
paths: "supabase/**, lib/supabase/**, proxy.ts, lib/auth/**, app/api/uploads/**, app/api/admin/**, lib/rate-limit.ts"
---

# Supabase review

## Purpose

Ensure customer personal data and photos are reachable only by the server (service role) and the authenticated admin, that schema changes are safe and reproducible, and that writes are race-safe.

## When to use

- Any change under the `paths` above, to code calling `supabaseAdmin`, or to new SQL.
- Before releases and in security reviews.

Scope: `$ARGUMENTS` (default `git diff main...HEAD` limited to the paths above).

## Workflow

1. **Client and key separation.**
   - `grep -rn "supabaseAdmin\|SUPABASE_SECRET_KEY" app components lib helpers`: every hit must be server-only (no `"use client"` file, and no module imported by one).
   - `grep -rn "supabaseBrowser\|createSupabaseBrowserClient" app components lib`: browser clients may only call `uploadToSignedUrl` and the admin login/logout auth methods.
   - No browser `.from(` or `.rpc(` calls.
2. **Auth.**
   - `proxy.ts` uses `createServerClient` with `getAll`/`setAll`, `getUser()`, and redirects non-admins. The matcher covers `/admin` pages only.
   - Every `app/api/admin/**` handler runs Origin → `getUser()` → `isAdminEmail()`.
   - `grep -rn "getSession(" app lib proxy.ts` must return nothing on the server.
   - Login: `lib/supabase/client.ts` `persistSession:false` is a known problem (M-5).
   - The allowlist trusts `user.email`, so public sign-ups must be disabled (U-4).
3. **RLS and privileges** (`supabase/schema.sql`, `supabase/migrations/*.sql`).
   - Every `create table` is followed by `enable row level security`. Flag any `create policy` for `anon` / `authenticated`.
   - Every `security definer` function sets `search_path` and revokes execute from `public` **and** `anon, authenticated`. The repo fixes this for `next_order_number` and `consume_rate_limit` in `20261030_revoke_rpc_client_execute.sql` (N-2); confirm it is applied with the SQL below.
   - New migrations are idempotent and mirrored into `schema.sql`.
4. **Storage.**
   - The bucket `calendar-uploads` stays `public = false`, with the size and MIME limits.
   - `grep -rn "getPublicUrl\|createSignedUrl\b\|createSignedUrls" app lib` must find nothing customer-facing.
   - Paths are built on the server only. Signed uploads have no upsert.
   - The finalize chain is intact. Downloads happen only in paid-gated admin routes.
   - The bulk export doesn't skip missing photos silently (N-4).
5. **Query patterns.**
   - State transitions use conditional updates plus `maybeSingle()`, with null handled.
   - `{ error }` is always checked.
   - Explicit column lists in new code (L-7).
   - No customer personal data returned to unauthenticated callers. Thank-you/cancel pages expose only the order code, behind `session_id` or a token (L-8).
6. **Produce read-only verification SQL for the user** (Claude must not run it):
   ```sql
   select relname, relrowsecurity from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r';
   select schemaname, tablename, policyname, roles, cmd from pg_policies where schemaname in ('public','storage');
   select has_function_privilege('anon', 'public.consume_rate_limit(text,text,bigint,integer)', 'execute') as anon_rate_limit,
          has_function_privilege('anon', 'public.next_order_number()', 'execute')                          as anon_next_number;
   select id, public, file_size_limit, allowed_mime_types from storage.buckets where id = 'calendar-uploads';
   ```

   Also ask the user to confirm in the Dashboard that Auth sign-ups are disabled and every `ADMIN_EMAILS` address has an existing account.
7. **Verify** findings against the code. Classify each as new, known (ID) or resolved.

## Expected output

```text
## Supabase review: <scope>
### Findings
| Sev | Title | Location | Known ID / new | Fix | Regression test |
### Controls confirmed (client separation, RLS, storage privacy, CAS writes)
### Read-only checks for the user (SQL + Dashboard)
```

## Safety restrictions

- Never run SQL, connect to Supabase, use the service-role key, list, download or view storage objects, or read `.env*`.
- Never include real customer data in examples. Read-only unless the user explicitly requests fixes.
