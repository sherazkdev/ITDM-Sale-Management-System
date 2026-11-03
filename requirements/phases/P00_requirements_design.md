# P00 — Source Audit, Domain Policy & ERD Planning

> **Status:** NOT_STARTED  
> **Dependencies:** Both PDFs present  
> **Requirement basis:** BO pp1–4; DB pp1–4  
> **Scope:** BACKEND ONLY. No UI/dashboard implementation.

## Outcome and boundaries
- Read PDFs end-to-end with page mapping. Produce `docs/requirements-coverage.md` with source IDs R01–R19, business entities, workflows, functional/nonfunctional constraints and conflicts.
- Separate explicit client statements, proposed design and blockers. Create a decision meeting packet and schema proposal only, **not final migrations**.
- Draw use-case graph (PO↔vendors/contracts/invoices/assets/budget, asset↔employee/movements/maintenance). Build full initial + proposed DB ERD.
- Confirm internal-browser LAN deployment and backend-first direction.

## Entities and persistence
- Validate all 13 source tables and every source column; create attribute/nullability/unique/FK matrix.
- Add proposed extensions in a clearly marked section: auth, PO lines, invoice payments, asset form header/lines, documents, audit, alerts.
- Avoid forcing DB `department` into new master table until D18; no unapproved data rewrite.

## Application services and use cases
- List workflow scenarios: purchase asset, assign asset, return asset, repair asset, renew license/contract, invoice partial pay, budget encumber and settle, one-PO global search.
- Produce REST endpoint inventory and role/permission proposal clearly marked DRAFT.
- Define financial accounting questions (D03–D08) and whether issue to a department is required (D10).

## Business rules and important edge cases
- No firm authorization matrix, expiry intervals, monetary posting rules, statuses or deleted-history policy until signed.
- Record each mismatch: BO PO expiry vs DB missing expiry field; stock quantity vs individually coded assets; BO department recipient vs DB employee-only movement; invoice payment/outstanding vs no payment ledger.

## Proposed REST API contract
**No HTTP endpoints** implemented in P00. Proposed only: `/api/v1/auth/*`, `/employees`, `/assets`, `/vendors`, `/contracts`, `/purchase-orders`, `/invoices`, `/budgets`, `/reports`, `/search`. Keep API draft in `docs/api-plan.md`.

All endpoints are provisional until the schema/permission decisions are resolved. Use versioned `/api/v1` routes; controllers parse inputs and delegate to services; repositories only access persistence. Use the standard response/error contract from `reference/API_AND_ERROR_CONVENTIONS.md`.

## Tests / verification checklist
- Coverage: all R01–R19 map to a phase and acceptance check.
- Schema linter review: every FK, cardinality and deletion behavior noted; no contradictions presented as resolved.
- Run lightweight document/link validation: all referenced phase files exist, decisions carry IDs.

## Deliverables / exit gate
- Deliver `docs/requirements-coverage.md`, `docs/domain-workflows.md`, `docs/db-schema-proposal.md`, `docs/erd.md`, `docs/api-plan.md`, `docs/adr/0001-modular-monolith.md`, updated decision register.
- **Gate:** developer reviews and approves provisional schema; blocking business decisions assigned to stakeholder. No database migration until schema concerns approved.

## Open decisions and explicit non-assumptions
D01–D24 in the register. Mark which stop P02 and which only stop later business operations.

## Cursor execution instructions
1. Read `requirements/README.md`, `reference/SOURCE_TRACEABILITY.md`, `reference/DECISION_REGISTER.md`, `reference/ENGINEERING_STANDARDS.md`, and relevant preceding completed phase reports before coding.
2. Inspect the real repo first. Reuse existing code; implement only what this phase needs. If prerequisites are incomplete, stop and report.
3. Write failing tests for core business invariants where practical, implement, run tests, fix; do not hide failures.
4. Run actual format/lint/typecheck/tests and migration checks as relevant. Never claim a command passed unless its output confirms it.
5. Update `requirements/IMPLEMENTATION_STATUS.md` only with verified evidence. Log blockers and source-related decisions in `reference/DECISION_REGISTER.md`.
6. Stop at this phase's gate; **do not** implement the next phase without a new explicit continuation.
