# Business Phase 3 — Employee & Department Asset Custody (D10)

**Date:** 2026-11-08  
**Project:** `D:\ITDM-Sale-Management`

## 1. Client requirement and status

| Requirement | Status |
|-------------|--------|
| Serialized issuance records **receiving employee** | **Verified** (existing + unchanged contract) |
| Records **department at issuance time** (historical snapshot) | **IMPLEMENTED** |
| IT performs issuance/returns; employee signs on form (operational) | **No new workflow** — existing movement documents |
| Multi-asset issue/return atomic | **Verified** (`asset-issuance.test.ts`, concurrency tests) |
| Employee master **not** updated when issuance department differs | **Verified** (`asset-custody-d10.test.ts`) |
| Legacy rows without department | **Preserved** — nullable columns; UI shows `—` for missing snapshot |
| Official company issuance/return PDF templates | **Still blocked (D12)** — not invented |

**Business Phase 3 engineering:** **COMPLETE** for approved scope.

## 2. Prisma / migration

| Model | Field | Notes |
|-------|-------|-------|
| `AssetMovementDocument` | `receivingDepartment` `VARCHAR(128)` nullable | Set on **ISSUANCE** documents only |
| `AssetTransaction` | `receivingDepartment` `VARCHAR(128)` nullable | Copied on **ISSUE** rows; unchanged on **RETURN** |

Migration: `20261108180000_d10_asset_custody_department`  
Applied: `itdms_test`, `itdms_e2e` (no destructive reset).

## 3. API behavior

- `resolveReceivingDepartment(explicit, employee.department)` — required for new issuances: explicit body value **or** active employee profile; **422** if neither.
- Stored on issuance document and each issue transaction in the **same transaction** as asset status updates.
- Returns: **no** department overwrite on historical issue rows.
- Export: `report.service` asset-movements tabular column `receivingDepartment`.
- RBAC / audit: unchanged.

## 4. Web UI

| Surface | Change |
|---------|--------|
| `/asset-issuance` | `SearchableSelect` receiving employee; **Receiving department** field with profile prefill; **Review issue** → confirm dialog (employee, department, asset count) |
| `/assets/[id]` | Movement history **Department** column (historical `receivingDepartment`) |

Validators: `receivingDepartment` required on **issue** only; returns unchanged.

## 5. Legacy compatibility

- Pre-migration issuance rows: `receivingDepartment` **NULL** — not backfilled from today’s employee profile.
- New issuances always persist a department snapshot when rules above are satisfied.

## 6. Tests and evidence

| Suite | DB / stack | Result |
|-------|------------|--------|
| API Vitest | `itdms_test` @ `127.0.0.1:5433` | **85/85 PASS** (incl. `asset-custody-d10` **4/4**) |
| Web Vitest | — | **50/50 PASS** |
| API + Web typecheck / lint | — | **PASS** |
| Playwright `asset-custody-d10.spec.ts` | `itdms_e2e`, API **:3020**, web **:3021**, `NODE_ENV=development` on API for rate limits | **3/3 PASS** |
| Playwright `lifecycle-connected.spec.ts` | Same stack | **13/13 PASS** (incl. **document upload** — Review upload → Confirm) |
| Playwright `wave3-finance-verification.spec.ts` | Same stack | **6/6 PASS** |
| Playwright `d09-inventory-workflow.spec.ts` | Same stack (prior run this session) | **11/11 PASS** |
| Full local Playwright suite | — | **Not re-run end-to-end this session** — use isolated stack notes in `FINAL_SOURCE_CODE_GAP_AUDIT.md` |

Screenshots: `docs/release/audit-screenshots/d10/`

- `asset-issuance-department-field.png`
- `asset-detail-history-department.png`

## 7. Playwright harness

| Spec | Fix |
|------|-----|
| `lifecycle-connected` | Document upload: **Review upload** then confirm **Upload**; API issuance includes `receivingDepartment` |
| `asset-custody-d10` | Asset filter placeholder; history assertion via `table[role="grid"]` |

**Document-upload regression:** **RESOLVED** on isolated E2E stack (lifecycle test green).

## 8. Remaining defects / out of scope

- Department Management module — **deferred**
- Dynamic RBAC — **deferred**
- Admin financial corrections — **not implemented**
- Official D12 issuance/return layouts — **awaiting client files**
- E2E: run API with `NODE_ENV=production` → strict rate limit breaks auth/API seeding (documented; use non-production or dev API for Playwright)

## 9. Local client-demo readiness

**YES (engineering)** for D10 custody when:

1. `.\scripts\windows\prepare-e2e-database.ps1`
2. API `DATABASE_URL` → `itdms_e2e`, `PORT=3020`, `NODE_ENV=development` (or high `ITDMS_API_RATE_LIMIT_MAX`)
3. Web `ITDMS_API_URL=http://127.0.0.1:3020`, listen **:3021**
4. Demo: `/asset-issuance` + `/assets/{id}` history + movements export

Production release gates unchanged.
