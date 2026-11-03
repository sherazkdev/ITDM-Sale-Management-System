# P01 — Backend Foundation, Tooling & Local PostgreSQL

> **Status:** NOT_STARTED  
> **Dependencies:** P00 reviewed  
> **Requirement basis:** BO p3–p4 (on-prem/modular); framework selection PROPOSED  
> **Scope:** BACKEND ONLY. No UI/dashboard implementation.

## Outcome and boundaries
- Initialize `apps/api` TypeScript strict Express, package manager workspace, organized modular monolith. UI untouched.
- Docker Compose PostgreSQL for local dev with data volume and healthcheck; DB only bound to localhost in dev, isolated Docker service network in staging/prod.
- Initialize Prisma/config compatible with selected pinned major, Zod env validation, pino logging, correlation/request IDs, standard error middleware and graceful shutdown.
- Configure ESLint/Prettier, test runner, coverage, `tsconfig`, seed/test scripts, `.env.example` and safe Git ignores.

## Entities and persistence
- Database connectivity bootstrapping only; P02 authors real business schema/migrations. `GET /health/live` does not require DB; `GET /health/ready` checks DB readiness securely.
- App config must distinguish local/test/prod and fail-fast on missing secrets/URLs.

## Application services and use cases
- Build `AppError`/domain errors with safe error translator, `asyncHandler` or framework equivalent, request validation wrapper, dependency modules and route registry.
- Make JSON body size limit, security headers, configurable CORS only as needed, no `*` auth origins, structured request logs.
- Add a DB transaction helper adaptable to Prisma and testing.

## Business rules and important edge cases
- Do not expose stack traces/secrets to clients; 500 includes request ID only.
- Docker volume persistence; no committing `.env`. Health readiness must fail on DB outage, liveness should not misreport DB health.
- Verify port conflicts and Windows/WSL Docker setup; avoid destructive Docker pruning.

## Proposed REST API contract
`GET /api/v1/health/live` and `GET /api/v1/health/ready` (or equivalent consistent naming, documented).
No authenticated business endpoints in P01.

All endpoints are provisional until the schema/permission decisions are resolved. Use versioned `/api/v1` routes; controllers parse inputs and delegate to services; repositories only access persistence. Use the standard response/error contract from `reference/API_AND_ERROR_CONVENTIONS.md`.

## Tests / verification checklist
- Unit request ID/error format/unknown route/invalid JSON tests; readiness integration against Postgres and outage mode.
- Run install, `docker compose config`, `docker compose up -d`, migration tooling version check, `lint`, `typecheck`, `test`, `build` and two health curl calls; paste actual results.

## Deliverables / exit gate
- Reproducible local onboarding and `scripts/db-verify`.
- `apps/api` builds, starts, connects to Docker database. Lockfile committed. No unreviewed DB schema.
- Record exact Node/Prisma/Postgres versions validated and source of pinned compatibility.

## Open decisions and explicit non-assumptions
D17 (deployment hardware) does not block dev; production settings pending. D02 affects auth, not this bootstrapping.

## Cursor execution instructions
1. Read `requirements/README.md`, `reference/SOURCE_TRACEABILITY.md`, `reference/DECISION_REGISTER.md`, `reference/ENGINEERING_STANDARDS.md`, and relevant preceding completed phase reports before coding.
2. Inspect the real repo first. Reuse existing code; implement only what this phase needs. If prerequisites are incomplete, stop and report.
3. Write failing tests for core business invariants where practical, implement, run tests, fix; do not hide failures.
4. Run actual format/lint/typecheck/tests and migration checks as relevant. Never claim a command passed unless its output confirms it.
5. Update `requirements/IMPLEMENTATION_STATUS.md` only with verified evidence. Log blockers and source-related decisions in `reference/DECISION_REGISTER.md`.
6. Stop at this phase's gate; **do not** implement the next phase without a new explicit continuation.
