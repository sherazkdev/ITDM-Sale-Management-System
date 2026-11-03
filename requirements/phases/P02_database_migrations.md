# P02 — Relational Schema, Keys & Safe Migrations

> **Status:** NOT_STARTED  
> **Dependencies:** P01 + approved entity/relationship decisions  
> **Requirement basis:** DB pp1–4; BO pp1–3  
> **Scope:** BACKEND ONLY. No UI/dashboard implementation.

## Outcome and boundaries
- Translate initial 13 tables, explicit source constraints and **approved** additions into Prisma models + PostgreSQL migrations.
- Add FK indexing, unique business codes, finance decimal precision, timestamps, transactional document reference strategy; make schema diagram and DB dictionary generated from actual migration.
- Seed deterministic **test** data only, with no invented real company details. Separate developer demo seed from production.

## Entities and persistence
- Source 13 tables as in `DATA_MODEL_BLUEPRINT.md`; optional extensions conditional on decisions: auth/RBAC, PO lines, invoice payments, asset headers/lines, file metadata, notification/audit.
- Ensure `purchase_orders.contract_id` nullable and contract-to-PO 1:N; PO-to-invoices 1:N; asset-to-transaction 1:N; budget allocations/transactions 1:N.
- Keep employee vs authentication user separate; mapping for `processed_by` actor to user reference is proposed and documented.

## Application services and use cases
- Entity mapping + repository primitives for common lookup only; no premature CRUD endpoints for all entities.
- Add migration discipline (review SQL, generate/apply/status, rollback strategy as documented); non-destructive upgrade test on seeded DB.

## Business rules and important edge cases
- Asset code input is *manual*, reject duplicates by DB constraint. Normalize only with documented canonical rules.
- `purchase_cost` and totals are decimal; guard negative values as appropriate; dates compare in business timezone.
- No default cascade delete of referenced history. Do not invent a PO expiry field without D04 resolution.
- If D05–D10 unanswered, safe migration only for agreed baseline; leave downstream extensions clearly BLOCKED.

## Proposed REST API contract
No business HTTP endpoints in P02. Internal DB adapters/migration tooling only.

All endpoints are provisional until the schema/permission decisions are resolved. Use versioned `/api/v1` routes; controllers parse inputs and delegate to services; repositories only access persistence. Use the standard response/error contract from `reference/API_AND_ERROR_CONVENTIONS.md`.

## Tests / verification checklist
- Validate FK and unique constraint failures; reject duplicate asset codes and PO numbers.
- Test 1 contract linked to 2 POs, 1 PO linked to 2 invoices, 1 asset with multiple movement records.
- Test decimal storage roundtrip, null optional FK, no accidental cascade, migration apply on clean test DB and additive upgrade on sample populated DB.

## Deliverables / exit gate
- Approved `schema.prisma`, migration SQL, DB dictionary and ERD matching reality.
- Repository test environment isolated; actual migration SQL reviewed, not just `db push`.
- Gate: stakeholder-approved decisions reflected or unresolved dependent features explicitly blocked.

## Open decisions and explicit non-assumptions
Requires signoff for any schema-changing D09/D10 or payment/finance modeling. Do not force final shape from proposed files.

## Cursor execution instructions
1. Read `requirements/README.md`, `reference/SOURCE_TRACEABILITY.md`, `reference/DECISION_REGISTER.md`, `reference/ENGINEERING_STANDARDS.md`, and relevant preceding completed phase reports before coding.
2. Inspect the real repo first. Reuse existing code; implement only what this phase needs. If prerequisites are incomplete, stop and report.
3. Write failing tests for core business invariants where practical, implement, run tests, fix; do not hide failures.
4. Run actual format/lint/typecheck/tests and migration checks as relevant. Never claim a command passed unless its output confirms it.
5. Update `requirements/IMPLEMENTATION_STATUS.md` only with verified evidence. Log blockers and source-related decisions in `reference/DECISION_REGISTER.md`.
6. Stop at this phase's gate; **do not** implement the next phase without a new explicit continuation.
