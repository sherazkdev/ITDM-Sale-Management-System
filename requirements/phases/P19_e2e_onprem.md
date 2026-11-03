# P19 — System Integration, Operations & On-Premise Deployment

> **Status:** NOT_STARTED  
> **Dependencies:** P00–P18 VERIFIED or explicitly accepted exceptions  
> **Requirement basis:** BO pp3–4 (LAN deployment, testing, maintenance, backup)  
> **Scope:** BACKEND ONLY. No UI/dashboard implementation.

## Outcome and boundaries
- Cross-module integration testing, regression, performance sanity, security verification and deployment on organization-approved in-house server.
- Verify no frontend dashboard is required to finish backend HTTP acceptance; client can test API by Postman/Bruno/OpenAPI and sample reports.
- Produce production runbooks for API/worker/database/storage with release checklist.

## Entities and persistence
- Check migration compatibility with current schema, seeded test dataset and production data upgrade. Avoid destructive resets.
- Persist DB, private documents and backup artifacts on protected volumes; configure separate test vs prod config and non-root process where practical.

## Application services and use cases
- `docker compose -f compose.prod.yml` or approved deployment layout (API, Postgres, worker, reverse proxy), internal DNS/TLS/firewall.
- Environment provisioning, secrets, database migrations, startup dependencies, readiness probes, centralized logs, periodic reminders, backup scheduling and restore drill.
- Publish verified OpenAPI, deployment/upgrade/rollback/backup/incident runbooks, role matrix, report catalog and maintenance guide.

## Business rules and important edge cases
- No direct internet exposure unless organization explicitly changes requirements. LAN access still requires HTTPS, auth and least privilege.
- Never run `prisma migrate reset`, destructive migration or Docker volume prune against live system.
- Full production readiness requires approval of blocking D decisions and external document templates.
- No claims about hardware sizing, RPO/RTO, absolute latency or security certification without measurements and signoff.

## Proposed REST API contract
- All Phase 03–18 existing documented APIs, contract integration tests and health/readiness endpoints.
- No new business API feature planned here; fix documented defects via tested changes and change log.

All endpoints are provisional until the schema/permission decisions are resolved. Use versioned `/api/v1` routes; controllers parse inputs and delegate to services; repositories only access persistence. Use the standard response/error contract from `reference/API_AND_ERROR_CONVENTIONS.md`.

## Tests / verification checklist
- Run TEST_MATRIX T01–T20 against staging/isolated test DB; postman smoke across core flows; verify permissions from two authorized roles.
- Performance load plan with realistic counts, concurrent issue/payment tests, backup/restore, reboot process recovery, deployment config validation.
- Run static security review, dependency audit, DB migration status, all test suites and final E2E; record exact outputs.

## Deliverables / exit gate
- Signed `docs/release-report.md` with functionality matrix, security and test evidence, known limits, runbooks, deployment diagram.
- Client IT admin confirms server/credentials/restore and document compliance. Mark BACKEND_READY only when no blocking unresolved source requirements remain.
- Next project milestone (outside this kit): Next.js frontend dashboards integrated to stabilized API.

## Open decisions and explicit non-assumptions
D01–D24 decisions relevant to go-live; unapproved critical policies prevent 'production ready' claim.

## Cursor execution instructions
1. Read `requirements/README.md`, `reference/SOURCE_TRACEABILITY.md`, `reference/DECISION_REGISTER.md`, `reference/ENGINEERING_STANDARDS.md`, and relevant preceding completed phase reports before coding.
2. Inspect the real repo first. Reuse existing code; implement only what this phase needs. If prerequisites are incomplete, stop and report.
3. Write failing tests for core business invariants where practical, implement, run tests, fix; do not hide failures.
4. Run actual format/lint/typecheck/tests and migration checks as relevant. Never claim a command passed unless its output confirms it.
5. Update `requirements/IMPLEMENTATION_STATUS.md` only with verified evidence. Log blockers and source-related decisions in `reference/DECISION_REGISTER.md`.
6. Stop at this phase's gate; **do not** implement the next phase without a new explicit continuation.
