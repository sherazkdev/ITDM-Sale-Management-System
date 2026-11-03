# Login runtime fix (2026-11-02)

## Issue

`/login` showed **"missing required error components, refreshing..."** in Next.js 15 dev.

## Root cause

`AuthProvider` React Query bootstrap called `GET /auth/me` on every page (including `/login`). When the Express API was **unreachable** or returned a **network error** (`ApiClientError` status `0`), the query **re-threw** the error. Without `error.tsx` / `global-error.tsx`, Next dev cannot recover and shows the generic refresh loop.

Contributing factors:

- **EADDRINUSE** on port 3011 from a stale `next dev` process (competing dev servers).
- Middleware `validateSession` could also throw if `fetch` to the API failed (now wrapped in `try/catch`).

## Fix

1. `src/lib/auth/resolve-auth-me-query.ts` — map `ApiClientError` (401, network, etc.) to anonymous session (`null`) during bootstrap.
2. `AuthProvider` uses `resolveAuthMeQueryError` instead of rethrowing non-401 errors.
3. `middleware.ts` — `try/catch` around session validation `fetch`.
4. `AuthShell.tsx` — explicit `"use client"`; stable `FeatureIcon` render in showcase list.

## Regression tests

`apps/web/tests/auth-me-query.test.ts` (3 cases).

## Verification

- `npm run typecheck --workspace=@itdms/web` — pass
- `npm run test --workspace=@itdms/web` — 5/5 pass
- `npm run build --workspace=@itdms/web` — pass
- Browser: `http://localhost:3011/login` renders login form (Welcome back, username/password, AuthShell showcase)
- `node scripts/smoke-web-auth.mjs` — pass when API on `:3000`

## Ops note

Before dev: ensure a single listener on 3011; stop old `node` processes; delete `apps/web/.next` after failed/crashed dev sessions.
