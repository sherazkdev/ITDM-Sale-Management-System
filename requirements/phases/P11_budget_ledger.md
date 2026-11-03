# P11 — Financial Years, Allocation, Commitment & Actual Spend

> **Status:** NOT_STARTED  
> **Dependencies:** P08, P10  
> **Requirement basis:** BO p1–p2; DB pp3–4  
> **Scope:** BACKEND ONLY. No UI/dashboard implementation.

## Outcome and boundaries
- Maintain annual IT budgets by financial year, categories, committed expenditure, actual expenditure, utilization and remaining balance.
- Expose grouping by year/PO/contract/vendor/category and precise reconciliation to source transactions.
- Enforce separate allocation vs transaction records **and no double counting**, as DB explicitly requires.

## Entities and persistence
- Source `financial_years`, `budget_allocations`, `budget_transactions` exactly as PDF; transaction links optional PO/invoice.
- PROPOSED event types `COMMIT`, `RELEASE_COMMIT`, `ACTUAL`, `REVERSE_ACTUAL`, `TRANSFER` only if signed; preserve append-only money history.
- Ensure category and currency allocations are explicit and year ranges valid; finance revisions may need separate journal corrections.

## Application services and use cases
- `FinancialYearService.create/close/list`, `BudgetAllocationService.allocate/revise`, `BudgetLedgerService.commitPO/recordActual/reverse/reconcile`, `BudgetReportService.byYear/byCategory/byVendor/byContract/byPO`.
- Illustrative **proposal**, not accounting approval: on approved PO reserve 60; upon qualifying actual 20 linked to same PO, release 20 of reserve; encumbered 40 + actual 20, available = allocation 100 - 60 = 40. On cancellation release unused 40. Actual defined by payment vs invoice is D06; signed policy must override example.
- Persist traceable ledger entries with unique event IDs; prevent duplicate booking across retries. Each ledger event references source and is audited.

## Business rules and important edge cases
- Never compute `remaining = allocated - full_committed - full_actual` if actual replaces part of same commitment; double counts.
- No negative available budget unless approved overdraft policy. Prevent closed-year postings if policy says locked.
- Ignore cross-currency aggregates until FX rule approved; use `numeric`, same currency per ledger summation.
- Serializing/concurrent approvals must not overspend; use budget row locks and unique event constraints.
- No silent edit/delete of posted ledger entries; corrections are traceable reversals.

## Proposed REST API contract
- `POST /api/v1/financial-years`, `GET /api/v1/financial-years`, `POST /api/v1/budget-allocations`, `GET /api/v1/budget-allocations`, `POST /api/v1/budget-allocations/:id/adjust` (policy-gated).
- `GET /api/v1/budgets/summary?financialYearId=...`, `GET /api/v1/budgets/ledger?budgetId=...`, `GET /api/v1/budgets/by-po/:id`, `GET /api/v1/budgets/by-vendor/:id`, `GET /api/v1/budgets/by-contract/:id`.
- Internal finance posting services invoked from approved workflows rather than public arbitrary `/ledger/post` endpoint.

All endpoints are provisional until the schema/permission decisions are resolved. Use versioned `/api/v1` routes; controllers parse inputs and delegate to services; repositories only access persistence. Use the standard response/error contract from `reference/API_AND_ERROR_CONVENTIONS.md`.

## Tests / verification checklist
- Allocation 100→PO commit 60→qualifying actual 20→release remaining: no double count and invariant always holds.
- Test 2 invoices on same PO, duplicate events, retry, concurrent commitments, closed financial year, cancellation, reversal, currency mismatch, exact decimal totals.
- Query reports by vendor, contract, PO and year reconcile to same ledger and source docs.

## Deliverables / exit gate
- Approved financial event dictionary, immutable budget ledger, reconciliation endpoint/reports with unit/integration tests and formal numerical examples signed by client.
- **If D03/D06/D07/D08 unresolved, phase is BLOCKED, not 'VERIFIED'.**

## Open decisions and explicit non-assumptions
D03 and D05–D08, D16, D23 critical. Do not implement a pseudo-budget formula in production without approval.

## Cursor execution instructions
1. Read `requirements/README.md`, `reference/SOURCE_TRACEABILITY.md`, `reference/DECISION_REGISTER.md`, `reference/ENGINEERING_STANDARDS.md`, and relevant preceding completed phase reports before coding.
2. Inspect the real repo first. Reuse existing code; implement only what this phase needs. If prerequisites are incomplete, stop and report.
3. Write failing tests for core business invariants where practical, implement, run tests, fix; do not hide failures.
4. Run actual format/lint/typecheck/tests and migration checks as relevant. Never claim a command passed unless its output confirms it.
5. Update `requirements/IMPLEMENTATION_STATUS.md` only with verified evidence. Log blockers and source-related decisions in `reference/DECISION_REGISTER.md`.
6. Stop at this phase's gate; **do not** implement the next phase without a new explicit continuation.
