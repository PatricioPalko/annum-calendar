---
name: pre-release-check
description: Go/no-go verification before deploying Annum Calendar to production. Runs lint, type check, build and tests, inspects the build output (static routes, bundle leaks), scans the release diff for secrets, personal data and risky changes, checks launch-blocking roadmap items, and lists the manual production checks the user must confirm. Use right before merging to main or deploying.
argument-hint: "[base-ref, default main]"
disable-model-invocation: true
---

# Pre-release check

## Purpose

Give a clear **GO / NO-GO** for a specific release, backed by command output and a short list of manual confirmations.

## When to use

- Before merging a release branch into `main` or deploying to production.
- Before delivery-batch deadlines (31. 10., 30. 11., 13. 12., 10. 1.), when stale content and payment issues hurt most.

Base ref: `$ARGUMENTS` (default `main`).

## Workflow

### 1. Release scope

- `git status --short`. Uncommitted changes mean NO-GO unless the user confirms they are intentionally excluded.
- `git log --oneline <base>..HEAD` and `git diff --stat <base>...HEAD`.
- Flag high-risk files in the diff: `app/api/stripe/**`, `lib/order-payments.ts`, `lib/order-checkout.ts`, `app/api/orders/**`, `app/api/uploads/**`, `app/api/admin/**`, `proxy.ts`, `lib/auth/**`, `supabase/**`, `next.config.ts`, `package.json`. If any are present, recommend running `/stripe-review` or `/supabase-review` or invoking `security-auditor` before release.

### 2. Automated gates (run all; don't stop at the first failure)

| Gate | Command | Pass criteria |
| --- | --- | --- |
| Lint | `npm run lint` | Zero errors |
| Types | `npx tsc --noEmit` | Exit 0 |
| Build | `npm run build` | Exit 0, no new warnings |
| Tests | `npm test` | All pass |
| Dependencies | `npm audit --omit=dev` | No critical or high advisories in production dependencies |

### 3. Build output inspection

- Route table: the `/`, `/objednavka`, `/pre-firmy` and legal pages should be `○`. `/admin`, `/objednavka/dakujeme`, `/objednavka/platba-zrusena` and all `/api/*` should be `ƒ`.
- `node -p "require('./.next/prerender-manifest.json').routes['/']"`: if `initialRevalidateSeconds` is `false` and the homepage still renders delivery batches server-side, flag N-1 (content frozen at build) and state which batch is baked in: `grep -o "[0-9]\{1,2\}\. [0-9]\{1,2\}\. 20[0-9][0-9]" .next/server/app/index.html | sort -u`.
- Bundle leaks: `grep -rlE "SUPABASE_SECRET_KEY|STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET|RESEND_API_KEY|UPLOAD_SIGNING_SECRET|ORDER_PAYMENT_SIGNING_SECRET|TURNSTILE_SECRET_KEY|PACKETA_API_PASSWORD" .next/static` must return nothing. Report variable names only. Note whether discount codes still appear (M-4, known).

### 4. Diff hygiene scan

On `git diff <base>...HEAD`:

- Secrets or tokens: patterns like `sk_live_`, `sk_test_`, `whsec_`, `re_[A-Za-z0-9]{20,}`, `eyJ` (JWT), `-----BEGIN`, and long base64 strings in non-asset files. **Print the file and line only, never the matched value.**
- Personal data: real-looking emails, phone numbers (`\+421`), or names in fixtures or logs.
- New `console.log`, new `NEXT_PUBLIC_` variables (check each is browser-safe), new `dangerouslySetInnerHTML`, new `select("*")`, new `<Link href="/api`.
- `package.json` or lockfile changes: list them and confirm they were approved.
- New SQL migrations: list them, because the user must apply them in Supabase **before** deploying code that depends on them.

### 5. Launch-blocker status

Read `docs/IMPLEMENTATION-ROADMAP.md` and report the status of every item in the **High** section (and any **Critical**), verifying against the code, not the document.

### 6. Manual confirmations for the user

Print this checklist. Claude cannot verify it.

- [ ] Production env vars set (names from the roadmap checklist). `NEXT_PUBLIC_APP_URL` = `https://www.annum.sk`.
- [ ] Stripe live webhook endpoint subscribed to the handled events, with the live `STRIPE_WEBHOOK_SECRET`.
- [ ] Stripe payment methods reviewed (H-1).
- [ ] Supabase: pending migrations applied. Sign-ups disabled, and admin accounts exist for all `ADMIN_EMAILS` (U-4).
- [ ] Resend domain verified. `ADMIN_EMAIL` and `EMAIL_FROM` set.
- [ ] Packeta sender approved.
- [ ] After deploy: one test-mode order or a live order that is refunded, the admin notification received, the homepage showing the correct current batch.

## Expected output

```text
## Pre-release check: <base>..HEAD (<short sha>)
Decision: GO | GO WITH RISKS | NO-GO

| Gate | Result | Notes |
|------|--------|-------|
### Blocking issues
### Risks accepted if GO
### High-risk files changed → recommended reviews
### Manual confirmations (user)
```

## Safety restrictions

- Don't deploy, push, merge, tag, or run `vercel`/`supabase`/`stripe` CLIs.
- Don't read `.env*` or print secret values (even ones found in the diff). Don't contact production services or send email.
- Commands are limited to local, read-only checks plus `npm run build` (writes `.next/` only). No `npm install`.
