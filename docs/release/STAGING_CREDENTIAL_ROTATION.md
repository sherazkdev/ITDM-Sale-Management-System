# UAT credential delivery (Phase 04B)

**Rule:** Do not commit live UAT passwords. Repository seed defaults are **local staging fixtures only**.

## Local staging

1. Copy `apps/api/.env.staging.example` → `apps/api/.env.staging` (gitignored).
2. Set unique `SESSION_SECRET` (32+ characters).
3. Override UAT passwords via environment **before** `seed-staging-uat.ts`:

| Variable | Purpose |
|---|---|
| `STAGING_UAT_ADMIN_USER` | Admin username (default `uat.admin`) |
| `STAGING_UAT_ADMIN_PASSWORD` | Admin password — **set locally, not in git** |
| `STAGING_UAT_READER_USER` | Reader username |
| `STAGING_UAT_READER_PASSWORD` | Reader password |

4. For Playwright staging runs, set `ITDMS_E2E_USER`, `ITDMS_E2E_PASSWORD`, `ITDMS_E2E_READER`, `ITDMS_E2E_READER_PASSWORD` in a local `.env.staging.local` (gitignored) or shell session — **not** in tracked files.

## Before real client UAT

1. Generate new passwords (password manager / `openssl rand -base64 24`).
2. Re-run `npx tsx prisma/seed-staging-uat.ts` on **staging DB only** with new env vars.
3. Deliver credentials to client through approved secure channel (not email plaintext if policy forbids).
4. Revoke or rotate repository-known defaults on any shared host.
5. Record rotation date in UAT checklist sign-off.

## Code references (defaults exist for local rehearsal only)

- `apps/api/prisma/seed-staging-uat.ts` — uses env with fallbacks
- `scripts/staging-smoke.mjs` — reads env first

**Production role matrix:** `uat_*_proposed` roles are **not** client-approved (D01).
