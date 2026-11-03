# P15 — Connected Global Search & PO 360-Degree Lookup

> **Status:** NOT_STARTED  
> **Dependencies:** P04–P14  
> **Requirement basis:** BO p2 (single PO search with linked records)  
> **Scope:** BACKEND ONLY. No UI/dashboard implementation.

## Outcome and boundaries
- Build global exact/prefix search for PO numbers, asset codes, contract numbers, invoices, employee numbers under approved permissions.
- **Primary acceptance**: one PO number returns a consolidated related overview, without manually fetching module by module.

## Entities and persistence
- Read-model joins across `purchase_orders`, `vendors`, `contracts`, `purchase_order_lines`, `invoices/payments`, `assets` (purchase source), `asset_transactions`/employees, `maintenance_records`, `software_licenses`, `budget_transactions/allocations`, `stored_documents`.
- No duplicated operational source of truth; materialized view or read model only if needed and kept consistent.

## Application services and use cases
- `GlobalSearchService.search(query, actor, paging)` and `PurchaseOrder360Service.getByNumber(number, actor)`.
- Search typed identifiers/term, normalized safe query, exact before fuzzy, limit results, stable ordering; optimize relational queries with select + batching rather than N+1.
- Authorize **each linked section**/sensitive field; return intentionally redacted summaries for restricted users per approved policy, not all-or-nothing leak.
- Include only actually related maintenance/license records via asset or PO references; not everything with same vendor name.

## Business rules and important edge cases
- Source BO explicitly lists PO details, contract, vendor, files, invoices/payment, purchased items/asset codes, issue/return, maintenance/software, expiry, budget allocation/remaining.
- If expiry data is undefined for PO, show explicit 'not configured' not synthetic date.
- Global search cannot bypass users' financial/export permissions. Input cannot cause unbounded `ILIKE` scans or injected raw SQL.

## Proposed REST API contract
- `GET /api/v1/search?q=...&type=...&page=...`, `GET /api/v1/search/purchase-orders/:poNumber/overview`, `GET /api/v1/assets/by-code/:assetCode` (if useful).
- Response typed sections: `purchaseOrder`, `contract`, `vendor`, `lineItems`, `invoices`, `assets`, `movements`, `maintenance`, `licenses`, `documents`, `budget` with visibility policy and pagination/caps.

All endpoints are provisional until the schema/permission decisions are resolved. Use versioned `/api/v1` routes; controllers parse inputs and delegate to services; repositories only access persistence. Use the standard response/error contract from `reference/API_AND_ERROR_CONVENTIONS.md`.

## Tests / verification checklist
- Real seeded linked chain: one PO with vendor, contract, 2 lines, 2 assets, issue/return, maintenance, licenses, 2 invoices/payment, budget; verify exact output.
- Different role sees only permitted details; no documents/cost leaks; pagination/term validation; index explain plan for PO number and asset code.

## Deliverables / exit gate
- Search endpoints, selective projections, DB indexes, API documentation and performance test evidence for representative local data.
- Source R09 acceptance passed end-to-end.

## Open decisions and explicit non-assumptions
D01 role visibility, D04 PO expiry, D05–D08 finance outputs; unresolved sections explicitly flagged and cannot be falsely certified.

## Cursor execution instructions
1. Read `requirements/README.md`, `reference/SOURCE_TRACEABILITY.md`, `reference/DECISION_REGISTER.md`, `reference/ENGINEERING_STANDARDS.md`, and relevant preceding completed phase reports before coding.
2. Inspect the real repo first. Reuse existing code; implement only what this phase needs. If prerequisites are incomplete, stop and report.
3. Write failing tests for core business invariants where practical, implement, run tests, fix; do not hide failures.
4. Run actual format/lint/typecheck/tests and migration checks as relevant. Never claim a command passed unless its output confirms it.
5. Update `requirements/IMPLEMENTATION_STATUS.md` only with verified evidence. Log blockers and source-related decisions in `reference/DECISION_REGISTER.md`.
6. Stop at this phase's gate; **do not** implement the next phase without a new explicit continuation.
