# Non-Asset Inventory (D09) — Implementation Report

**Date:** 2026-11-08  
**Final verification:** 2026-11-08 (E2E + concurrency + regression)

## Summary

Client-confirmed D09 stock movement workflow is **implemented and locally verified**: registration with opening ledger entry, issue, return, replenishment, write-off, decimal quantities, employee/department linkage, append-only movement history, audit events, Excel/CSV report, and premium UI on non-asset detail.

## Data model

**Migration:** `20261108120000_d09_non_asset_movements`

| Database | Migration status (this session) |
|----------|----------------------------------|
| `itdms_test` | Applied (Vitest `prepareTestDatabase`) |
| `itdms_e2e` | Applied via `scripts/windows/prepare-e2e-database.ps1` |

- `non_asset_stock_items.quantity_available` (Decimal 18,4)
- `non_asset_stock_movements` ledger (`INITIAL_STOCK`, `ISSUE`, `RETURN`, `REPLENISHMENT`, `WRITE_OFF`)
- Idempotent backfill: `INITIAL_STOCK` rows for existing items without movements

## Quantity rules (verified)

| Step | Operation | Result available |
|------|-----------|------------------|
| Register 100 ft | INITIAL_STOCK | 100 |
| Issue 20 ft | ISSUE | 80 |
| Return 5 ft | RETURN | 85 |
| Write off 10 ft | WRITE_OFF | 75 |
| Replenish 2.5 ft | REPLENISHMENT | 77.5 |

- `quantityOnHand` = cumulative received (initial + replenishment)
- `quantityAvailable` = issuable / returnable pool in store
- Returns capped by outstanding issued qty per employee or department recipient

## APIs

Base: `/api/v1/non-asset-stock-items`

| Method | Path | Permission |
|--------|------|------------|
| POST | `/:id/movements/issue` | `assets.manage` |
| POST | `/:id/movements/return` | `assets.manage` |
| POST | `/:id/movements/replenish` | `assets.manage` |
| POST | `/:id/movements/write-off` | `assets.manage` |
| GET | `/:id/movements` | `assets.read` |

**Concurrency:** row-level `FOR UPDATE` on stock item; transactional movement insert + available balance update.

**Idempotency:** optional `idempotencyKey` per movement (unique). Parallel duplicate keys replay the winning movement after transaction abort (no double deduction).

## Frontend

- `apps/web/src/app/(app)/assets/non-asset/[id]/page.tsx` — quantity summary + operations
- `apps/web/src/components/inventory/NonAssetStockOperations.tsx` — issue/return/add/write-off + history table

## Reporting

- `GET /api/v1/reports/non-asset-stock-ledger?format=xlsx|csv|json`
- Inventory combined export shows **available** qty for non-asset rows
- Playwright asserts CSV contains stock code and movement types after full workflow

## Automated verification (2026-11-08)

| Check | Result |
|-------|--------|
| API typecheck / lint | **PASS** |
| Web typecheck / lint / build | **PASS** |
| API Vitest (`itdms_test`) | **76/76 PASS** (incl. `non-asset-stock-movements` **4/4**, `non-asset-stock-concurrency` **2/2**, `non-asset-stock` **3/3**) |
| Web Vitest | **50/50 PASS** |
| Playwright D09 (`e2e/d09-inventory-workflow.spec.ts`) | **11/11 PASS** (+ 1 auth setup) on `itdms_e2e` @ **3020/3021** |
| Playwright full local suite (excl. staging) | **296 passed / 2 failed / 216 skipped** — failures are **non-D09** harness drift (`selectOption` on vendor field after Phase D `SearchableSelect`; see `rehearsal/playwright-e2e-d09-closure.log`) |
| E2E stack | API `DATABASE_URL` → `itdms_e2e`; `WEB_ORIGIN` → `http://127.0.0.1:3021`; `ITDMS_API_URL` → `http://127.0.0.1:3020` |

### Concurrency & idempotency (PostgreSQL, automated)

| Case | Result |
|------|--------|
| Two concurrent issues of 8 ft each on 10 ft available | **201 + 422**; final available **2**; exactly **one** ISSUE movement |
| Two parallel requests with same `idempotencyKey` (5 ft issue) | Both **201**; **one** movement row; available **45** |
| Negative inventory | **Not observed** (over-issue rejected) |
| Ledger integrity | Existing INITIAL_STOCK / history preserved across tests |

## Screenshots (fully loaded @ 1440×900)

`docs/release/audit-screenshots/d09/`

- `non-asset-detail-1440-loaded.png`
- `non-asset-issue-form-1440-loaded.png`
- `non-asset-return-form-1440-loaded.png`
- `non-asset-writeoff-form-1440-loaded.png`
- `non-asset-movement-history-1440-loaded.png`

## Department UX (no new module)

| Question | Answer |
|----------|--------|
| How are employee departments stored? | Free-text column `employees.department` (`VarChar(128)`), optional |
| Employee create UI | Plain text input on `/employees/new` — **not** a searchable master list |
| D09 movement department association | Movements store `department` and/or `employeeId`; issue/return UI has `SearchableSelect` for employee **or** free-text department |
| Department Management module | **Does not exist** (no `/departments` routes or master table) |

## Security

- RBAC unchanged (`assets.read` / `assets.manage`)
- Audit: `non_asset_stock.issue|return|replenish|write_off|register`
- No movement deletes; ledger append-only

## Client demo readiness

**YES (local engineering demo)** — isolated `itdms_e2e`, ports **3020/3021**, full D09 UI workflow + ledger CSV verified.

**NO (staging UAT)** — `staging-verification` still **BLOCKED** (credentials).

## Remaining defects (D09 scope)

None confirmed in D09 API/UI/regression. Unrelated Playwright failures: `lifecycle-connected.spec.ts`, `wave3-finance-verification.spec.ts` (vendor `<select>` harness vs searchable vendor control).

## Business Phase 2 gate

**Approved to begin Business Phase 2 planning/engineering** for non-D09 scope, with the understanding that:

- Serialized asset issuance rules remain unchanged
- Department master data is still free-text (no Dept module unless client approves)
- Two legacy Playwright finance/lifecycle specs need harness refresh (not blocking D09 demo)
- Production release remains **NO** per existing readiness gates (UAT, D12 templates, etc.)
