---
name: production-audit
description: Full production-readiness audit of Annum Calendar (architecture, order and payment consistency, Stripe, Supabase RLS and Storage, uploads and photo privacy, Resend, Packeta, admin auth, validation, UX and accessibility, SEO, error handling, configuration, tests). Produces a dated report in docs/ that compares against the previous audits. Use before a launch, after large changes, or periodically.
argument-hint: "[focus-area or output-path]"
disable-model-invocation: true
---

# Production readiness audit

## Purpose

Decide, with evidence, whether Annum Calendar can safely accept real orders and payments. Track which known findings are resolved, still open, or new.

## When to use

- Before a public launch or a seasonal peak (the delivery batches end 31. 10., 30. 11., 13. 12., 10. 1.).
- After a large change to the order, payment, upload or admin flows.
- When the user asks for an "audit", "readiness review" or "launch check".

For a quick go/no-go before a deploy, use `/pre-release-check` instead.

Arguments: `$ARGUMENTS`. Treat them as a focus area (e.g. `payments`) or an output path. The default output is `docs/PRODUCTION-AUDIT-<YYYY-MM-DD>.md`. **Never overwrite** `docs/PRODUCTION-AUDIT.md` or `docs/PRODUCTION-AUDIT-REVIEW.md`.

## Workflow

### 1. Baseline

1. Read `docs/IMPLEMENTATION-ROADMAP.md`, then `docs/PRODUCTION-AUDIT-REVIEW.md` (authoritative), then `docs/PRODUCTION-AUDIT.md`.
2. Run `git log --oneline -20` and `git diff --stat <last-audited-commit>..HEAD` (the audits were written at `f88a0a6`) to see what changed since.
3. Inventory: `package.json`, installed versions (`node -p "require('./node_modules/<pkg>/package.json').version"`), `git ls-files`, `supabase/`, `.claude/`.

### 2. Automated checks (safe, local)

Run and record exit codes and the relevant output:

- `npm run lint`: must report zero errors.
- `npm test`: Vitest unit suite.
- `npm audit --omit=dev`: production dependency advisories (report package, severity and fixed version).
- `npx tsc --noEmit`
- `npm run build`: record the route table. Flag any time-dependent Server Component on a `○` route (N-1). `.next/prerender-manifest.json` → `routes["/"].initialRevalidateSeconds`.
- Tests, if a runner now exists.
- Bundle leak check: `grep -rl "RODINA15\|ANNUM10" .next/static` (M-4), and grep `.next/static` for server env var **names** that must not appear (`SUPABASE_SECRET_KEY`, `STRIPE_SECRET_KEY`, …). Report names only, never values.

### 3. Manual review, area by area

For each area, read the implementation (not just the referenced lines), then re-verify every known finding ID from the roadmap and look for new issues.

| Area | Files to read |
| --- | --- |
| Order creation | `app/api/uploads/sign/route.ts`, `app/api/uploads/finalize/route.ts`, `lib/upload-order-photos.ts`, `app/api/orders/route.ts`, `components/sections/order-form/index.tsx` |
| Payments | run the `stripe-review` skill workflow |
| Supabase / RLS / Storage | run the `supabase-review` skill workflow |
| Admin | `proxy.ts`, `lib/auth/admin.ts`, every `app/api/admin/**/route.ts`, `app/admin/**`, `components/admin/**` |
| Emails | `lib/resend.ts`, `lib/order-emails.ts`, callers in `lib/order-payments.ts`, `app/api/orders/route.ts`, the notify-fulfillment route |
| Packeta | `lib/packeta.ts`, `components/delivery/packeta-picker/index.tsx`, the create-packeta-packet route |
| Privacy | `components/analytics/google-analytics.tsx`, `lib/analytics.ts`, `lib/order-from-draft.ts`, logs (`grep -rn "console\.\(log\|error\)" app lib`), URLs containing `order_code` |
| Frontend / UX / accessibility | order-form components, mobile bar, dropzone, thank-you and cancel pages. Check the viewports 375×812, 390×844, 768×1024, 1024×768 and 1440×900 by reading the code; do visual checks only if a server is already running and browser tooling is available. |
| SEO / performance | `app/layout.tsx`, `lib/seo.ts`, `app/robots.ts`, `app/sitemap.ts`, `next.config.ts`, `public/` asset sizes |
| Configuration | env var **names** referenced (`grep -rhoE "process\.env\.[A-Z_]+" app lib components helpers proxy.ts next.config.ts \| sort -u`), `NEXT_PUBLIC_APP_URL` vs `SITE_URL`, import-time throws |
| Tests and CI | test files, runner, `.github/` |

Consult `node_modules/next/dist/docs/` before judging any Next.js-specific pattern.

### 4. Verify before reporting

For every finding, re-open the code and confirm the failure scenario. Label it **Verified**, **Likely** (library- or code-level reasoning, not observed at runtime) or **Unverified** (needs dashboard, production or legal facts). Drop anything you can't support.

### 5. Write the report

Structure:

1. Verdict (ready / not ready / conditionally ready) and the reasons.
2. Automated check results.
3. Status of known findings: an ID table with Resolved / Open / Changed severity.
4. New findings. For each one: severity, status label, `file:line`, root cause, business impact, recommended fix, regression test.
5. Unverified assumptions, as a checklist for the user.
6. Prioritized next steps.

Then propose (don't apply without asking) the matching updates to `docs/IMPLEMENTATION-ROADMAP.md`.

## Project-specific must-checks

- The server recomputes the price, and the `Math.round(x*100)` conversion is consistent across checkout, DB and webhook.
- The webhook verifies its signature on the raw body. Mark-paid is a conditional update with side effects only for the winner. Duplicate paid sessions are refunded with an idempotency key.
- Every `/api/admin/**` handler runs Origin → `getUser()` → `isAdminEmail()`, and actions on customer data gate on `paid`.
- No public photo URLs. The upload HMAC chain is intact.
- Personal data (including `order_code`) stays out of logs, analytics and new URLs.
- `security definer` functions revoke execute from `anon` / `authenticated`.
- Static routes contain no build-time-frozen dates or offers.

## Safety restrictions

- Read-only on application code: don't fix anything during an audit.
- Never read `.env*`, print env values, request secrets, open dashboards, connect MCP servers, run SQL, call Stripe, Resend, Packeta or Turnstile, submit orders, or touch customer photos or data.
- `npm run build` writes only to `.next/`. Don't run `npm install` or delete files.
