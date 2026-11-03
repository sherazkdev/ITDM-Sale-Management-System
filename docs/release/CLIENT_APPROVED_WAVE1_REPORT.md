# Client-Approved Requirements — Wave 1 Report

**Date:** 2026-11-03  
**Project:** ITDMS (`D:\ITDM-Sale-Management`)  
**Source:** Client clarification response (**Document1.pdf** — *not present in repository at commit time*; Wave 1 scope taken from approved engineering brief aligned to that response). Baseline requirements: `requirements/Background and Objective.pdf`, `requirements/Database structure.pdf`.

**UAT / production:** Not started. **Financial rules:** Not modified (Wave 1 boundary).

---

## 1. Client-confirmed requirements (Wave 1 scope)

| Area | Client direction (summary) |
|------|----------------------------|
| Expiry reminders | **60 days** before expiry (contracts, licenses, PO when `valid_until` set) |
| PO process | **No** ITDMS approval workflow; **SAP / manual** external approval; ITDMS **records** POs |
| Excel reporting | Reports available in **Excel-compatible** export (operational extracts) |
| Inventory | **Asset** + **non-asset** stock entry; units (Each, Feet, Kg, …); quantities for non-assets |
| Initial access | **One** full-access user initially; RBAC retained |
| Issue/return | IT issues/receives; **manual** signing; templates **later** |
| Deployment | **Windows standalone** first; LAN/domain later |
| Financial / backup | **Still pending** — do not implement |

---

## 2. Decision register classifications (D01–D24)

See full table in [`CLIENT_DECISION_REGISTER.md`](./CLIENT_DECISION_REGISTER.md#wave-1-classifications-2026-11-03).

Highlights:

- **CONFIRMED (Wave 1):** D03 (no in-app PO approval), D09 partial (non-asset foundation), D14 partial (60-day in-app lead), single initial admin (operational, maps to D01 partial).
- **PARTIALLY CONFIRMED:** D04 (PO reminders only when `valid_until` populated), D12 (Excel operational exports ≠ official templates).
- **NEEDS CLARIFICATION:** D01 full role matrix, D02 auth method, D05–D08 finance, D17 backup overwrite/retention, PO status mirroring SAP.
- **NOT ANSWERED / pending:** As in register.
- **SUPERSEDED:** Prior “enable PO workflow when D03 approved” engineering default — replaced by SAP-external approval statement.

---

## 3. Implemented in Wave 1

| # | Implementation |
|---|----------------|
| Expiry | Default `NOTIFICATION_LEAD_DAYS=60`; scan unchanged for contracts/licenses/PO `valid_until`; payload notes updated; dashboard expiring window aligned to lead days |
| PO UX/API | `POLICY_NOT_APPROVED` message explains **SAP/external** approval; workflow endpoints **remain disabled** |
| Excel | Existing SpreadsheetML `xlsx` exports verified; new **`/reports/inventory`**; tests for inventory xlsx |
| Non-asset stock | Table `non_asset_stock_items`; API `/api/v1/non-asset-stock-items`; stock entry UI on `/assets/new`; list tab on `/assets` |
| Admin | [`WAVE1_INITIAL_ADMIN_SETUP.md`](./WAVE1_INITIAL_ADMIN_SETUP.md) |
| Issue/return | [`ASSET_MOVEMENT_TEMPLATE_INTEGRATION.md`](./ASSET_MOVEMENT_TEMPLATE_INTEGRATION.md) — hooks only |
| Windows | [`WINDOWS_STANDALONE_DEPLOYMENT_CHECKLIST.md`](./WINDOWS_STANDALONE_DEPLOYMENT_CHECKLIST.md) |

---

## 4. Database / API / frontend changes

| Layer | Change |
|-------|--------|
| **DB** | Migration `20261103143000_wave1_non_asset_stock` |
| **API** | `non-asset-stock-items` CRUD (create/list/get/patch metadata); reports `inventory`; expiry job optional `asOf` (non-prod job endpoint) |
| **Web** | Stock entry dual mode; assets list tabs; reports inventory slug; PO copy |
| **Config** | `NOTIFICATION_LEAD_DAYS` default **60** in `env.ts` / `.env.example` |

---

## 5. Preserved (unchanged semantics)

- CRM layout and ORLEN theme  
- PO draft edit/lines/audit; no auto-approve  
- Finance ledger, partial payments, budget **PROPOSED** labels  
- RBAC, CSRF, session auth  
- Serialized asset codes and issue/return movement integrity  
- Non-official export disclaimer (D12 templates still blocked)

---

## 6. Test results (actual)

| Suite | Result |
|-------|--------|
| `npm run typecheck` | Pass (api + web) |
| `npm run lint` | Pass |
| `npm run build` | Pass |
| API `notification-expiry.test.ts` | **2/2** |
| API `non-asset-stock.test.ts` | **2/2** |
| API `extended-modules.test.ts` (incl. inventory xlsx) | **4/4** |
| Web Vitest | **43/43** |

Tests use isolated DB via `prepareTestDatabase()` where applicable.

---

## 7. Partially implemented

| Item | Gap |
|------|-----|
| D09 inventory | No consumption/replenishment/returns for non-asset qty |
| D12 Excel | SpreadsheetML extracts with disclaimer — **not** client official layouts |
| D04 PO expiry | No `valid_until` auto-population; reminders only if field set |
| D03 PO status | Draft-only in ITDMS; SAP status sync **not** defined |

---

## 8. Still pending (client next response)

- D05–D08: expenditure recognition, partial payment policy, budget currency/FX  
- D17: backup overwrite, retention, RPO/RTO approval  
- D01: full role matrix; D02: directory vs local  
- D12: official PDF/Excel **templates** (PO, issue/return, etc.)  
- D10, D11, stock movement policies  

---

## 9. Remaining work after Wave 1

1. Ingest **Document1.pdf** into repo (`docs/release/client-responses/`) and attach approver/date to register.  
2. Drop ORLEN logo assets if not yet added (`public/brand/`).  
3. Wave 2: financial rules **only after** written approval.  
4. Template engine when client files arrive.  
5. Optional: PO status field guidance from SAP process owner.

---

*End of Wave 1 — engineering stop point.*
