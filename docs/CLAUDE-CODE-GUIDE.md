# Claude Code Guide: Annum Calendar

How this repository configures Claude Code, and how to use it for features, fixes, security reviews and releases.

## 1. Configuration at a glance

```text
CLAUDE.md                     ← main instructions (imports AGENTS.md)
AGENTS.md                     ← Next.js agent rules block + shared Next.js rules (also read by other agents)
.claude/
  settings.json               ← pre-existing: permission deny rules for .env*/secrets reads (unchanged)
  rules/                      ← path-scoped rules, load when Claude touches matching files
    architecture.md  frontend.md  backend.md  database.md
    security.md      payments.md  testing.md
  agents/                     ← specialized subagents
    code-reviewer.md  security-auditor.md  frontend-developer.md
    backend-developer.md  qa-engineer.md
  skills/                     ← reusable workflows, invoked as /<name>
    production-audit/  stripe-review/  supabase-review/
    code-quality/      pre-release-check/
docs/
  PRODUCTION-AUDIT.md         ← first audit (historical)
  PRODUCTION-AUDIT-REVIEW.md  ← second pass, authoritative over the first
  IMPLEMENTATION-ROADMAP.md   ← prioritized open work with finding IDs
  CLAUDE-CODE-GUIDE.md        ← this file
```

**What loads when:**

- `CLAUDE.md`, and through `@AGENTS.md` the Next.js rules, load in **every** session and in subagents.
- Each `.claude/rules/*.md` file has a `paths:` list and loads only when Claude reads or edits a matching file. This keeps the base context small (Claude Code docs: "Path-specific rules").
- An agent's system prompt loads when that agent runs. Skills listed in an agent's `skills:` field are preloaded into it.
- A skill's full text loads when you type `/<skill>` or when Claude matches its description. `production-audit` and `pre-release-check` are **manual only** (`disable-model-invocation: true`), because they are long and run builds.

## 2. What each file does

| File | Role | Applies to |
| --- | --- | --- |
| `CLAUDE.md` | Business context, stack, commands, directory map, order lifecycle, integration boundaries, conventions, **safety boundaries**, change workflow | Always |
| `rules/architecture.md` | Server/client/shared module split, single sources of truth, adapters, import-time side effects, static vs dynamic rendering, where new code goes | `app`, `components`, `lib`, `helpers`, `proxy.ts`, `next.config.ts` |
| `rules/frontend.md` | Component structure, shadcn primitives, Tailwind tokens vs brand hex, mobile viewports, accessibility, forms, analytics and privacy in the browser, Slovak copy, SEO | components, pages, layouts, client modules |
| `rules/backend.md` | Route handler sequence, Next 16 async APIs, errors and logging, timeouts and idempotency, `after()`, Resend, Packeta, Turnstile, health endpoints | `app/api`, server pages, `lib`, `proxy.ts` |
| `rules/database.md` | Which Supabase client to use, migration process (files only), the `orders` model and statuses, RLS and function privileges, conditional updates, storage rules | `supabase`, `lib/supabase`, API and admin code |
| `rules/security.md` | Env var classification, the mandatory admin auth sequence, capability tokens, personal data and photo handling, input and output encoding, headers, abuse controls | all application code |
| `rules/payments.md` | Payment invariants, webhook semantics, payment links, business rules (variants, pricing tiers, pickup code, waves), admin order actions | order, payment, upload, admin-order files |
| `rules/testing.md` | Vitest setup and conventions, mocking approach, P0/P1 coverage, fixture rules, approval needed for new test libraries | test files plus critical logic files |

The rules hold the detail and `CLAUDE.md` holds only summaries, so the two don't repeat each other.

`.cursor/rules/*.mdc` is the older Cursor equivalent and partly overlaps. If you change a convention, update both, or retire the Cursor rules.

## 3. Specialized agents

| Agent | Use it for | Edits code? | Preloaded skills |
| --- | --- | --- | --- |
| `code-reviewer` | Correctness, regressions and maintainability of a diff | No | `code-quality` |
| `security-auditor` | Vulnerabilities, authorization, RLS and storage, personal data and photo privacy, payment abuse | No | `stripe-review`, `supabase-review` |
| `frontend-developer` | UI: components, pages, order-form UX, styling, accessibility | Yes (UI scope only) | none |
| `backend-developer` | API routes, order and payment logic, webhook, emails, Packeta, SQL migration files | Yes (server scope only) | none |
| `qa-engineer` | Test plans, edge cases, writing tests once a runner is approved | Tests only | none |

The responsibilities don't overlap. Reviewers hand fixes to developers, developers hand verification to QA, and anything security-sensitive goes to the auditor.

All agents set `disallowedTools: mcp__*`, so they can't use MCP servers. The reviewer and auditor have no Edit or Write tools.

**Invoking an agent:**

- Natural language: "Use the security-auditor agent to review the changes in app/api/admin."
- Guaranteed: type `@agent-security-auditor` followed by the task.
- Claude may also delegate automatically when a task matches an agent's description.
- Plugin agents with similar names (e.g. `feature-dev:code-reviewer`) are separate. The project's `code-reviewer` is the one tailored to this codebase.

## 4. Skills

| Skill | Invoke | What it does |
| --- | --- | --- |
| `/production-audit [focus\|output]` | manual | Full readiness audit. Compares against both audits and the roadmap, runs lint, tsc and build plus bundle checks, writes `docs/PRODUCTION-AUDIT-<date>.md`. |
| `/stripe-review [scope]` | manual or auto on payment files | Event matrix, price authority, session creation, idempotency, payment links, lifecycle coupling |
| `/supabase-review [scope]` | manual or auto on Supabase, auth or upload files | Client and key separation, auth, RLS and grants, storage privacy, query patterns. Outputs read-only SQL for **you** to run. |
| `/code-quality [scope]` | manual or auto | TypeScript, sources of truth, boundaries, validation alignment, logging, React/Next/Tailwind patterns |
| `/pre-release-check [base]` | manual | GO / NO-GO: gates, build-output inspection (static routes, bundle leaks), diff hygiene, launch-blocker status, your manual checklist |

Skills are executable workflows with the commands to run and the files to read. They never fix code unless you ask afterwards.

## 5. Recommended workflows

### New feature

1. Describe the feature and ask Claude to **plan first** (plan mode, or "propose a plan and file list before editing").
2. Implement with `backend-developer` for API and data work and `frontend-developer` for UI. For cross-cutting work, do the backend first, then hand the API contract to the frontend.
3. `qa-engineer`: a test plan (and tests once a runner exists).
4. `code-reviewer` on the diff. Add `security-auditor` if the change touches auth, admin, payments, uploads, personal data or SQL.
5. Run `npm run lint && npx tsc --noEmit && npm run build` (agents do this too), then commit when you ask.

### Bug fix

1. Give Claude the symptom and, if possible, the roadmap ID (e.g. "fix N-3").
2. Ask it to **reproduce or confirm the cause in code first** and re-verify the roadmap finding against current code.
3. Fix with the right developer agent, in the minimal diff.
4. `qa-engineer`: a regression test that fails before the fix (once a runner exists), or a manual verification note.
5. `code-reviewer`, then update the roadmap item's status.

### Security review

1. Targeted: `/stripe-review` or `/supabase-review` with the scope, or `@agent-security-auditor` with the diff or area.
2. Periodic or full: `@agent-security-auditor` on the whole repository, or `/production-audit security`.
3. Run the read-only production checks the auditor lists yourself, in the dashboards.
4. Turn the findings into roadmap entries before fixing.

### Before a production release

1. `/pre-release-check main`.
2. If high-risk files changed: `/stripe-review` / `/supabase-review` / `@agent-security-auditor`.
3. Apply pending SQL migrations in Supabase **yourself**, before deploying the code that needs them.
4. Complete the manual checklist the skill prints (env, Stripe webhook and methods, Supabase auth, Resend, Packeta).
5. After deploy: a test order (or a live order that you refund), the admin email received, the homepage showing the current delivery batch.

## 6. Safety model and its limits

- `CLAUDE.md`, the rules, agents and skills all tell Claude never to read `.env*`, request secrets, open dashboards, use MCP servers, create payments or refunds, send emails, mutate databases, touch customer photos or data, or run destructive commands without explicit approval.
- **These are instructions, not a security boundary.** A model can misread or be manipulated by untrusted content. The only enforcement in this repository is `.claude/settings.json` (deny `Read` of `.env`, `.env.*` and `secrets/**`) plus Claude Code's permission prompts. That deny list does not cover every path to a file (e.g. shell commands). For stronger guarantees use OS-level sandboxing, keep production secrets out of the local checkout, and use test-mode keys locally.
- No hooks, MCP servers, plugins, permission bypasses or `allowed-tools` grants were added. Add any of these deliberately, if ever.

## 7. Maintaining the configuration

- Keep `CLAUDE.md` under about 200 lines. Put area-specific detail in `.claude/rules/`, and multi-step procedures in skills.
- When a roadmap item is fixed, update its status in `docs/IMPLEMENTATION-ROADMAP.md` **and** remove the "known gap" note from the relevant rule (e.g. `payments.md` lists H-1, H-2, H-3, N-6).
- When a test runner is approved, update `rules/testing.md` (conventions become facts), the commands table in `CLAUDE.md`, and the gates in `/pre-release-check`.
- Run `/doctor prompt-audit` (Claude Code built-in) periodically to find conflicting or stale instructions.
