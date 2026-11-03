# UI05 — Procurement, Contracts & Asset Movement Report

**Status:** **UI05 COMPLETE** (verified)  
**Date:** 2026-11-02  
**Scope:** Contracts, purchase orders (draft + lines), asset issuance/returns

---

## Routes implemented

| Route | Features |
|---|---|
| `/contracts` | List, vendor filter, expiring-within-90-days (`before` query), pagination |
| `/contracts/new` | Create (`contracts.manage`) |
| `/contracts/[id]` | Detail, edit, related POs, `documentPath` display (metadata only) |
| `/purchase-orders` | List, search, pagination |
| `/purchase-orders/new` | Create draft PO |
| `/purchase-orders/[id]` | Header edit (draft), line add/remove, totals from API, invoice list if `invoices.read` |
| `/asset-issuance` | Issue / Return tabs, multi-asset, holder rules, query invalidation |

---

## CRM components reused

Same UI04 stack: `PageHeader`, `DataTable`, `Pagination`, `ListToolbar`, `FilterSelect`, `StatusPill`, `Card`, `Dialog`, `ConfirmDialog`, `Tabs`, `QuickTip` / `PolicyNotApprovedNotice`, form controls, `formatCurrency`.

---

## API endpoints integrated

| Module | Endpoints |
|---|---|
| Contracts | `GET/POST /contracts`, `GET/PATCH /contracts/:id`, `GET .../purchase-orders` |
| Purchase orders | `GET/POST /purchase-orders`, `GET/PATCH /:id`, `POST/DELETE .../lines`, `GET .../invoices` |
| Movements | `POST /asset-issuances`, `POST /asset-returns`, `GET /asset-issuances/:id`, `GET /asset-returns/:id` |
| Supporting | `GET /vendors`, `GET /employees`, `GET /assets?status=` |

Client: `src/lib/api/{contracts,purchase-orders,asset-movements}.ts`, `apiDelete` on client for line removal.

---

## Permissions

| Area | Read | Write / actions |
|---|---|---|
| Contracts | `contracts.read` | `contracts.manage` |
| POs | `purchaseOrders.read` | `purchaseOrders.manage` (draft edits, lines) |
| Invoices on PO | `invoices.read` | — |
| Issue | — | `assets.issue` |
| Return | — | `assets.return` |
| Movement docs | `assets.read` | — |

---

## D03 — PO workflow policy

Submit / approve / cancel endpoints return **`POLICY_NOT_APPROVED`**. UI shows `PolicyNotApprovedNotice` and **disabled** workflow buttons with explanation — **no fake success**. Draft creation and line management remain available.

---

## Tests and results

| Check | Result |
|---|---|
| Web typecheck / lint / build | **Pass** (28 routes) |
| Web vitest | **Pass** — **30/30** (incl. `ui05-validators.test.ts`) |
| API regression | **Pass** — **37/37** |
| `npm run smoke:ui05` | **Pass** — contract, PO draft + line, asset issue |

---

## Workflow verification

Smoke and manual paths: create contract → PO draft → add lines (totals from backend) → issue IN_STOCK asset → return with employee/holder validation. Conflict errors (409) surfaced via `ApiClientError` toasts. Dashboard/assets queries invalidated after movement.

---

## Bugs fixed during UI05

- Added missing `apiDelete` helper for PO line removal.

---

## Remaining client decisions

- **D03** — PO submit/approve/cancel approval workflow  
- **D04** — PO `validUntil` semantics  
- **D10** — department-level issuance rules  

---

## UI06 readiness

Finance, maintenance, and license screens implemented in UI06 — see `docs/frontend/UI06_IMPLEMENTATION_REPORT.md`.

---

## Screenshots (visual evidence)

Checklist and filenames: **`docs/frontend/screenshots/ui05/README.md`**.

Capture at **1440**, **1024**, **768**, **390**, and **375** px for contracts, PO detail (D03 notice), and asset issuance before release sign-off.

Automated regression: `npm run smoke:ui05`.

---

## Regression (UI00–UI04)

No changes to auth shell, dashboard aggregates, or master-data routes beyond shared API helpers (`apiDelete`). Re-run `smoke:ui04` and `smoke:ui02` recommended before release.
