---
name: code-quality
description: Code-quality and maintainability review for Annum Calendar changes (TypeScript strictness, validation alignment, module boundaries, reuse of single sources of truth, Next.js 16 patterns, React and Tailwind conventions, error handling and logging hygiene, lint and type results). Use when reviewing a diff or file for quality before merge, or when asked about tech debt in a specific area.
argument-hint: "[file, directory or diff range]"
---

# Code-quality review

## Purpose

Keep the codebase consistent and safe to change. Catch type holes, duplicated business logic, boundary violations and pattern drift before they become bugs.

## When to use

- Reviewing a feature branch or a single file. The `code-reviewer` agent preloads this skill.
- Assessing tech debt in an area (e.g. "how maintainable is the admin export?").

Scope: `$ARGUMENTS`. Default: `git diff main...HEAD` plus uncommitted changes.

## Workflow

1. **Collect scope.** `git status --short`, `git diff --name-only main...HEAD`. Read the full changed files, not just the hunks.
2. **Automated signals.** Run `npm run lint`, `npx tsc --noEmit` and `npm test`. All three were green at the last baseline, so any failure is new.
3. **TypeScript.**
   - No new `any`, non-null `!` on external data, or `as` casts on untrusted input (use Zod or narrowing). Existing env `!` assertions are debt; don't add more.
   - Types come from Zod (`z.output`) or `app/types/types.ts` rather than parallel hand-written shapes.
   - Async functions are awaited. No floating promises in route handlers, except intentional `void` with a comment, or `after()`.
4. **Single sources of truth** (`.claude/rules/architecture.md`). Flag any re-implementation of pricing, delivery price, discount math, order code or path format, delivery waves, token signing, or limits from `lib/order/config.ts`. Flag hard-coded prices or limits in components.
5. **Boundaries.** Is a server-only module imported into a client file? Are secrets or internal data in a shared module? Is `"use client"` added where a Server Component would do? Is there time-dependent output on a static route?
6. **Validation alignment.** For changed fields, compare `lib/schema.ts` (client) with the server Zod schema. Limits must match, and the server must bound every string and array.
7. **Error handling and logging.** Every Supabase `{ error }` is checked. Client messages are Slovak and minimal. Logs use `UPPER_SNAKE_CODE` with no personal data. `request.json()` is guarded.
8. **React / Next.js / Tailwind.**
   - Hooks rules (no synchronous `setState` in effects).
   - Async `params`/`searchParams`.
   - `<a>` for `/api/*` links.
   - `cn()` and existing primitives.
   - Class style consistent with the file (tokens vs brand hex).
   - Accessible form wiring.
9. **Maintainability.** Duplicated blocks across routes (e.g. the repeated admin auth prologue: note it, but don't demand abstraction in unrelated changes). Functions over about 80 lines that mix concerns. Dead code and commented-out blocks added by the change.
10. **Verify** each item. Keep only findings with a concrete consequence.

## Expected output

```text
## Code quality: <scope>
Automated: lint <pass/fail (new/pre-existing)>, tsc <pass/fail>
| # | Severity (Blocker/Major/Minor) | Category | Location | Issue → consequence | Suggested change |
### Good patterns worth keeping
### Debt noted (not blocking)
```

## Safety restrictions

- Review only. Don't edit unless the user asks for fixes.
- Never read `.env*`, never install packages, never run commands that modify the repository or contact external services.
