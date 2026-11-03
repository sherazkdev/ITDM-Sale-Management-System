# P18 — PDF/Excel Reports & Financial Reconciliation

> **Status:** NOT_STARTED  
> **Dependencies:** P11–P17  
> **Requirement basis:** BO p2–p3 (PO/contract/issue-return/invoice/budget/inventory reports, PDF/Excel)  
> **Scope:** BACKEND ONLY. No UI/dashboard implementation.

## Outcome and boundaries
- Provide exportable reports and API summaries matching the organization's standard templates and signed accounting rules.
- Support purchase orders, contract details, issuance and returns, invoices/expenditures, budget utilization and asset register.
- Build report filters for financial year, vendor, PO, contract, category, asset, status and date range.

## Entities and persistence
- Report queries should read canonical DB records and approved finance ledger, not stale UI-calculated totals.
- `report_exports` metadata optional: type, filter snapshot, actor, generated file, template/version/hash, runAt. Avoid storing large binary inside DB unless approved.

## Application services and use cases
- `ReportService.assetRegister/issuance/returns/contractRegister/invoiceAging/budgetUtilization/expenseByVendor/poSummary`.
- `ReportRenderer.pdf/xlsx` and queued background export only if demonstrated need; for small scoped datasets, stream safe document generation with row caps and timeouts.
- Financial report totals reconcile across breakdowns: by PO ↔ vendor ↔ contract ↔ budget category ↔ financial year. Include report as-of time and currency.

## Business rules and important edge cases
- Do not fake official PDF layout from generic template; use D12 provided samples.
- Spreadsheet cell values must not execute formulas from user-provided strings (escape formula-like prefixes, validate exporter).
- Respect role-based financial access on report generation, file download and cached artifacts; audit sensitive exports.
- Use decimal amounts, approved rounding/FX and fiscal year boundary; no aggregated cross-currency raw sum.

## Proposed REST API contract
- `GET /api/v1/reports/asset-register?format=pdf|xlsx`, `GET /api/v1/reports/issuance?format=pdf|xlsx`, `GET /api/v1/reports/returns?format=pdf|xlsx`, `GET /api/v1/reports/purchase-orders?format=pdf|xlsx`, `GET /api/v1/reports/contracts?format=pdf|xlsx`.
- `GET /api/v1/reports/invoices?format=pdf|xlsx`, `GET /api/v1/reports/expenditure?format=pdf|xlsx`, `GET /api/v1/reports/budget-utilization?financialYearId=...&format=pdf|xlsx`.
- Endpoint names and whether all formats apply to all reports subject to real template availability.

All endpoints are provisional until the schema/permission decisions are resolved. Use versioned `/api/v1` routes; controllers parse inputs and delegate to services; repositories only access persistence. Use the standard response/error contract from `reference/API_AND_ERROR_CONVENTIONS.md`.

## Tests / verification checklist
- Compare generated documents to owner-provided golden examples; verify file opens, formulas inert, correct rows/count/totals.
- Large dataset pagination/stream memory limits, unauthorized export/download, correct financial year and multi-vendor breakdown reconciliation.
- Regression snapshot for template version; no source secret leaked to PDF/Excel.

## Deliverables / exit gate
- Documented report catalog with generated examples, authorized download flow, audit, reconciliation tests and org approval.
- BO R10/R08 completion evidence recorded with approved templates.

## Open decisions and explicit non-assumptions
D12 final templates, D06–D08 finance calculations, D01 report permissions, D13 file retention; without approval don't mark compliant.

## Cursor execution instructions
1. Read `requirements/README.md`, `reference/SOURCE_TRACEABILITY.md`, `reference/DECISION_REGISTER.md`, `reference/ENGINEERING_STANDARDS.md`, and relevant preceding completed phase reports before coding.
2. Inspect the real repo first. Reuse existing code; implement only what this phase needs. If prerequisites are incomplete, stop and report.
3. Write failing tests for core business invariants where practical, implement, run tests, fix; do not hide failures.
4. Run actual format/lint/typecheck/tests and migration checks as relevant. Never claim a command passed unless its output confirms it.
5. Update `requirements/IMPLEMENTATION_STATUS.md` only with verified evidence. Log blockers and source-related decisions in `reference/DECISION_REGISTER.md`.
6. Stop at this phase's gate; **do not** implement the next phase without a new explicit continuation.
