# P10 — Invoices, Partial Payments & Outstanding Balances

> **Status:** NOT_STARTED  
> **Dependencies:** P08, P05  
> **Requirement basis:** BO pp1–2; DB pp2,4  
> **Scope:** BACKEND ONLY. No UI/dashboard implementation.

## Outcome and boundaries
- Multiple invoices per purchase order (including partial invoices), payment state and outstanding balance with actual payment records.
- Link invoice through PO to vendor and contract, and to budget ledger later; avoid duplicate vendor/contract copies unless justified.
- Financial posting and corrections require signed D05/D06 policy, not inferred status field behavior.

## Entities and persistence
- Source `invoices`: invoice_id, invoice_number, purchase_order_id FK, invoice_date, invoice_amount, payment_status, payment_date.
- PROPOSED `invoice_payments`: id, invoice_id, amount decimal, paidAt, method/reference optional, status, createdBy, idempotencyKey; possible `invoice_lines` for line matching only if needed.
- `payment_status` should be derived from ledger, not independently PATCH-able; source column can be maintained as projection under transaction.

## Application services and use cases
- `InvoiceService.createDraft/post/void/get/list`, `PaymentService.record/reverse/list`, `OutstandingBalanceService.getForInvoice/PO`.
- Compute outstanding according to policy: net invoice payable minus approved posted payments/reversals; correctly handle partial and multiple payments.
- Use transaction + row lock around payment posting and invoice total / status update; audit financial actions and make them idempotent.
- If cash/settlement not modeled by stakeholder, limit to invoice registration and clearly mark payment posting blocked.

## Business rules and important edge cases
- Cannot attach invoice to nonexistent PO; vendor/contract info through joined PO.
- Duplicate invoice number scope D15, reject unauthorized or duplicate payment idempotency key. Prevent overpayment unless explicit policy; refunds, credit notes unresolved.
- Never trust client-submitted outstanding/status as source of truth; no JS float; invoices after cancelled PO subject to approval.
- Payment dates and invoice dates must be validated but backdating policy is stakeholder decision.

## Proposed REST API contract
- `POST /api/v1/invoices`, `GET /api/v1/invoices`, `GET /api/v1/invoices/:id`, `PATCH /api/v1/invoices/:id` (draft only), `POST /api/v1/invoices/:id/post` (policy-gated), `POST /api/v1/invoices/:id/payments`, `GET /api/v1/invoices/:id/payments`, `GET /api/v1/invoices/:id/balance`.
- `GET /api/v1/purchase-orders/:id/invoices`, `GET /api/v1/purchase-orders/:id/billing-summary`.

All endpoints are provisional until the schema/permission decisions are resolved. Use versioned `/api/v1` routes; controllers parse inputs and delegate to services; repositories only access persistence. Use the standard response/error contract from `reference/API_AND_ERROR_CONVENTIONS.md`.

## Tests / verification checklist
- 1 PO 2 invoices; 1 invoice 2 partial payments; overpayment; payment retry; concurrent payment; failure rollback.
- Invoice number duplicate policy, cancelled/invalid PO, negative or zero amount based on policy, penny rounding.
- Reconcile invoice amount, sum payments and outstanding for each invoice and PO.

## Deliverables / exit gate
- Invoicing APIs plus payment ledger and approved outstanding logic; automated money-invariant tests; finance permission and audit tests.
- Ready for P11 budget ledger by stable invoice/payment event references.

## Open decisions and explicit non-assumptions
D05 payment/credit notes, D06 actual expenditure timing, D08 FX, D15 number uniqueness BLOCK posting; read-only invoices can progress.

## Cursor execution instructions
1. Read `requirements/README.md`, `reference/SOURCE_TRACEABILITY.md`, `reference/DECISION_REGISTER.md`, `reference/ENGINEERING_STANDARDS.md`, and relevant preceding completed phase reports before coding.
2. Inspect the real repo first. Reuse existing code; implement only what this phase needs. If prerequisites are incomplete, stop and report.
3. Write failing tests for core business invariants where practical, implement, run tests, fix; do not hide failures.
4. Run actual format/lint/typecheck/tests and migration checks as relevant. Never claim a command passed unless its output confirms it.
5. Update `requirements/IMPLEMENTATION_STATUS.md` only with verified evidence. Log blockers and source-related decisions in `reference/DECISION_REGISTER.md`.
6. Stop at this phase's gate; **do not** implement the next phase without a new explicit continuation.
