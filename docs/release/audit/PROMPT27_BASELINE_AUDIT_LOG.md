# Prompt #27 — Baseline audit log

**Started:** 2026-11-17 (local)  
**Pre-audit Git HEAD:** `410a7fba0a0bec45f9bb52af12af1f35b130f1f8`  
**Recovery tag created:** `itdms-pre-prompt27-2026-11-17` → `410a7fb`  
**Branch:** `main` (ahead of `origin/main`, push not authorized)

## Environment

| Item | Value |
|---|---|
| Postgres | `itdms-postgres` @ `127.0.0.1:5433` |
| Dev API (typical) | `:3000` / `itdms_dev` |
| E2E API | `:3020` / `itdms_e2e` |
| E2E Web (Playwright) | `:3011` via `next start` in playwright.config |
| Client templates | `storage/client-templates/Issuance.xlsx`, `Return.xlsx` (present, gitignored) |

## Route inventory (Next.js `page.tsx`)

**Total app pages:** 46 under `apps/web/src/app` (+ `/login`, root redirect) = **48 navigable entry points**

See `ITDMS_FINAL_360_DEGREE_QA_AUDIT.md` for enumerated paths.

## Test infrastructure

| Suite | Location |
|---|---|
| API Vitest | `apps/api/tests/**/*.test.ts` (43 files at last count) |
| Web Vitest | `apps/web/tests/**/*.test.ts` (18 files) |
| Playwright | `apps/web/e2e/*.spec.ts` (25 files; 537 tests listed with capture matrix; functional subset excludes `*capture*`, `staging`, optional `screenshots`) |

## Client PDF artifacts

`Background and Objective.pdf` / `Database structure.pdf` — **not verified in repo** this session; requirements cross-check uses `docs/release/CLIENT_DECISION_REGISTER.md` and Prompt #25/#26 acceptance docs.

## Safety

No push, deploy, volume delete, or production DB changes performed.