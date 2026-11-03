# ITDMS API (`apps/api`)

Backend modular monolith entry point (Phase P01 foundation).

Port **5433** is used on the host to avoid clashing with an existing local PostgreSQL on 5432.

Integration tests use **embedded PostgreSQL** on port `55432` unless `ITDMS_TEST_DATABASE_URL` is set (e.g. to Docker Compose).

## Prerequisites

- Node.js **20+** (validated on **v24.18.1**)
- Docker Desktop (or compatible engine) for the documented local PostgreSQL workflow

## Quick start

```bash
# From repository root
docker compose up -d
copy apps\api\.env.example apps\api\.env   # Windows
# cp apps/api/.env.example apps/api/.env   # macOS/Linux

npm install
npm run db:verify
npm run build --workspace=@itdms/api
npm run dev --workspace=@itdms/api
```

Health checks:

- `GET http://localhost:3000/api/v1/health/live` — process liveness (no DB)
- `GET http://localhost:3000/api/v1/health/ready` — includes PostgreSQL ping

## Scripts (workspace `@itdms/api`)

| Script | Purpose |
|---|---|
| `npm run dev` | Watch mode via `tsx` |
| `npm run build` | Compile to `dist/` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run test` | Vitest |

Root helpers:

- `npm run db:verify` — runs `SELECT 1` against `DATABASE_URL` (Docker on port 5433)
- `npm run smoke:api` — build + embedded Postgres + HTTP health smoke test

## Pinned stack (P01)

| Component | Version |
|---|---|
| Node | 24.18.1 (local) |
| PostgreSQL (Docker) | 16.8-alpine |
| Express | 4.21.2 |
| Prisma | 6.8.2 |
| TypeScript | 5.8.2 |
| Vitest | 3.0.9 |

Business schema migrations are **intentionally deferred to P02** after approval. Draft baseline: `prisma/schema.prisma`. Proposed extensions (not active): `prisma/schema.proposed.prisma`.

## Architecture

```
src/
  modules/<feature>/   routes → controller → service → repository
  shared/              config, errors, db, http, logging, middleware
  routes/              API v1 registry
```

See `docs/adr/0001-modular-monolith.md`.
