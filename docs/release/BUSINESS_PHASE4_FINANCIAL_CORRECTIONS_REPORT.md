# Business Phase 4 — Admin Financial Corrections & Audit

**Date:** 2026-11-08  
**Project:** `D:\ITDM-Sale-Management`

## 1. Capability matrix

| Capability | Status | Notes |
|------------|--------|-------|
| Correct **draft** invoice number / date / amount | **IMPLEMENTED + VERIFIED** | Admin only; no ledger impact until post |
| Correct budget **allocation** category / USD amount | **IMPLEMENTED + VERIFIED** | Does not rewrite committed/actual ledger rows |
| Admin **manual** budget ledger append | **IMPLEMENTED + VERIFIED** | Was `budgets.manage`; now **admin only** + reason + audit |
| Normal invoice **create / post / pay** | **NOT REQUIRED** (existing) | Still `invoices.manage`; unchanged semantics |
| Posted invoice **edit / reversal** | **BLOCKED — needs client policy** | `403 POLICY_NOT_APPROVED` |
| Payment **edit / delete / refund** | **BLOCKED — needs client policy** | No API surface |
| Credit notes / negative ledger | **BLOCKED — needs client policy** | Manual ledger rejects `COMMITTED_INVOICE` / `ACTUAL_PAYMENT` types |
| Budget formula (Allocated / Utilized / Actual / Remaining) | **Preserved** | Phase 2 metrics unchanged |

**Phase 4 engineering:** **COMPLETE** for approved scope. **Not** a full financial reversal product.

## 2. Authorization

- **Admin gate (Phase 5):** dedicated `financial.corrections` permission (`requireFinancialCorrections()`). `users.manage` alone is **insufficient** (user-admin delegate test).
- Seed `admin.dev` retains all permissions including `users.manage`.
- Finance clerk test role: `invoices.manage` + `budgets.manage` **without** `users.manage` → **403** on correction endpoints and ledger append.
- Server-side only; UI hides admin sections without `users.manage`.

## 3. Audit trail

Reuses `audit_logs` (no migration).

| Field | Storage |
|-------|---------|
| Action | `financial.correction` |
| Entity | `targetType` + `targetId` |
| Actor | `actorUserId` |
| Reason / before / after / changed fields | `metadata` JSON via `recordFinancialCorrectionAudit()` |
| Failed posted-invoice attempts | `result: failure` + `errorMessage` in metadata |

Discoverable under **Admin → Audit log** (`/admin/audit`).

## 4. API changes

| Method | Path | Auth |
|--------|------|------|
| `PATCH` | `/api/v1/invoices/:id/corrections` | `users.manage` |
| `PATCH` | `/api/v1/budget-allocations/:budgetId/corrections` | `users.manage` |
| `POST` | `/api/v1/budget-ledger/entries` | `users.manage` (was `budgets.manage`) |

Schemas: `financial-correction.schema.ts`; ledger body requires `correctionReason`.

## 5. UI changes

| Screen | Change |
|--------|--------|
| `/invoices/[id]` | Admin-only “Financial correction” (draft); Review → Confirm |
| `/budgets` | Admin allocation correction + admin manual ledger (reason required) |
| Copy | `budget-ui.ts` provisional notice updated |

## 6. Migrations

**None** — audit metadata sufficient.

## 7. Tests (this session)

| Suite | DB | Result |
|-------|-----|--------|
| API Vitest | `itdms_test` | **90/90 PASS** (incl. `financial-corrections-phase4` **5/5**) |
| Web Vitest | — | **50/50 PASS** |
| Typecheck / lint | — | **PASS** |
| Playwright (full local) | — | **Not re-run** this session (prior D09/D10/wave3/lifecycle evidence on `itdms_e2e`) |

Phase 4 acceptance covered by API integration tests (admin allow, clerk deny, reason required, posted block, allocation metrics).

## 8. Remaining policy gaps

- Invoice **unpost**, commitment reversal, utilization rollback
- Payment amendment, refund, idempotency replay abuse
- Credit notes and official correction forms (D12)
- Final role matrix (D01) — still using proposed seed admin

## 9. Client demo readiness

**YES (engineering)** for **approved** corrections when stack uses `itdms_e2e` and admin session:

1. Draft invoice on PO → correct amount as admin → audit shows before/after
2. Budget allocation typo → admin correction → summary shows new allocated / remaining
3. Finance user without admin → correction UI hidden and API 403

## 10. Release

Production-ready flag remains **NO** (UAT, D01 matrix, reversal policy, staging). Phase 4 does not change that gate.
