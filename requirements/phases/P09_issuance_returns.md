# P09 — Atomic Multi-Asset Issuance, Partial Return & History

> **Status:** NOT_STARTED  
> **Dependencies:** P04, P06, P03  
> **Requirement basis:** BO pp1,3; DB pp2–4  
> **Scope:** BACKEND ONLY. No UI/dashboard implementation.

## Outcome and boundaries
- Issue one or multiple physical assets to employee/department according to approved holder model; return one or more; maintain immutable movements.
- Generate persisted issuance/return document data for later branded PDF (P14) with reference number and document lines.
- Support read current holder and full chronological movement history.

## Entities and persistence
- Source `asset_transactions`: transaction_id, asset_id, employee_id, transaction_type ISSUE/RETURN, transaction_date, condition_notes, reference_number, processed_by, remarks.
- Proposed `asset_document_headers` (ID, type ISSUE/RETURN, reference, holder, actor, date) and `asset_document_lines` (document FK, asset FK, transaction FK, condition etc.).
- Optional current assignment projection/table indexed for concurrency; historical transaction records remain source of truth.
- BO allows department issue, DB stores employee_id; D10 must settle recipient model.

## Application services and use cases
- `AssetIssuanceService.issueAssets(input, actor, idempotencyKey)` and `returnAssets(...)`, `AssetHistoryService.listForAsset/employee`, `DocumentReadService.getIssueReturnData`.
- Within single DB transaction: lock relevant assets / authoritative current assignment, verify eligible statuses and holder, ensure no duplicate in payload, persist movement records, update current state/projection, persist header+lines, audit, commit.
- Deterministic lock order for multiple assets to reduce deadlocks; return must reference active issuance / authoritative holder. Design transaction isolation and retry on serialization conflicts.
- Partial return of a multi-asset document records only returned subset, never overwrites issue event.

## Business rules and important edge cases
- Two parallel issue requests for same asset: one wins, one 409; cannot issue retired/under-repair item per approved D11.
- Return of unissued asset, return by wrong holder, duplicate return, duplicate reference, duplicate assetIds → conflict.
- Actor `processed_by` must come from authenticated principal, never request body.
- Reissue only after correctly completed return; new transaction row every action; preserve condition notes.

## Proposed REST API contract
- `POST /api/v1/asset-issuances`, `GET /api/v1/asset-issuances/:documentId`, `POST /api/v1/asset-returns`, `GET /api/v1/asset-returns/:documentId`.
- `GET /api/v1/assets/:id/transactions`, `GET /api/v1/employees/:id/asset-assignments`, `GET /api/v1/assets/:id/current-holder`.
- Actual PDF output is P14; document data can be returned as JSON now.

All endpoints are provisional until the schema/permission decisions are resolved. Use versioned `/api/v1` routes; controllers parse inputs and delegate to services; repositories only access persistence. Use the standard response/error contract from `reference/API_AND_ERROR_CONVENTIONS.md`.

## Tests / verification checklist
- Multi-asset issue atomicity: failure of one item aborts whole document; concurrent requests; return subset; full return; reissue; history ordering.
- Invalid employee / inactive employee; unauthorized issuer; no fake or duplicate movement; return document separate references.
- Verify transaction rows unchanged after later operations; audit identity matches authenticated user; dedup retry behavior.

## Deliverables / exit gate
- Strongly consistent issue/return APIs with multi-asset document entities and real concurrent integration tests.
- `asset_code` appears on all movement lookup outputs; no loss of PO provenance.

## Open decisions and explicit non-assumptions
D10 employee vs department holder, D11 statuses/conditions, D15 document reference sequence, D16 deletion/history retention BLOCK core final state machine.

## Cursor execution instructions
1. Read `requirements/README.md`, `reference/SOURCE_TRACEABILITY.md`, `reference/DECISION_REGISTER.md`, `reference/ENGINEERING_STANDARDS.md`, and relevant preceding completed phase reports before coding.
2. Inspect the real repo first. Reuse existing code; implement only what this phase needs. If prerequisites are incomplete, stop and report.
3. Write failing tests for core business invariants where practical, implement, run tests, fix; do not hide failures.
4. Run actual format/lint/typecheck/tests and migration checks as relevant. Never claim a command passed unless its output confirms it.
5. Update `requirements/IMPLEMENTATION_STATUS.md` only with verified evidence. Log blockers and source-related decisions in `reference/DECISION_REGISTER.md`.
6. Stop at this phase's gate; **do not** implement the next phase without a new explicit continuation.
