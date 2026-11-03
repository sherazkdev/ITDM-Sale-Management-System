# UI06 — Finance, Maintenance & Software Licenses Report

**Status:** **UI06 COMPLETE** (verified)  
**Date:** 2026-11-02  
**Scope:** Invoices/payments, budgets, maintenance, software licenses — **no UI07/UI08**

---

## Routes implemented

| Route | Features |
|---|---|
| `/invoices` | List, pagination, payment status pills |
| `/invoices/new` | Create against PO (`invoices.manage`) |
| `/invoices/[id]` | Detail, API balance/outstanding, payment history, record payment + idempotency |
| `/budgets` | Financial years, allocations, provisional summary, manual ledger, by-PO/by-vendor lookup |
| `/maintenance` | List, status filter, optional `?assetId=` |
| `/maintenance/new` | Create (asset/contract/vendor link) |
| `/maintenance/[id]` | Detail, edit, complete |
| `/software-licenses` | List, expiring-before filter, renewal blocked notice |
| `/software-licenses/new` | Create license |
| `/software-licenses/[id]` | Detail, edit, key ref gated, disabled renew |

---

## CRM components reused

`PageHeader`, `SectionCard`, `DataTable`, `Pagination`, `FilterSelect`, `StatusPill`, `EmptyState`, `ListToolbar`, `Dialog`, `Card`, form controls, `PolicyNotApprovedNotice`, `BudgetProvisionalNotice`, `formatCurrency`.

---

## API integrations

| Module | Endpoints |
|---|---|
| Invoices | `GET/POST /invoices`, `GET /:id`, `GET /:id/balance`, `GET/POST /:id/payments` |
| Budgets | `GET/POST /financial-years`, `GET/POST /budget-allocations`, `POST /budget-ledger/entries`, `GET /budgets/:id/summary`, `GET /budgets/by-po/:id`, `GET /budgets/by-vendor/:id` |
| Maintenance | `GET/POST /maintenance-records`, `GET/PATCH /:id`, `POST /:id/complete` |
| Licenses | `GET/POST /software-licenses`, `GET/PATCH /:id`, `POST /:id/renew` (**403 POLICY_NOT_APPROVED**) |

Clients: `src/lib/api/{invoices,budgets,maintenance,software-licenses}.ts`  
Validators: `src/lib/validators/{invoice,budget,maintenance,software-license}.ts`

---

## Permissions

| Area | Read | Manage |
|---|---|---|
| Invoices | `invoices.read` | `invoices.manage` (create, record payment) |
| Budgets | `budgets.read` | `budgets.manage` (years, allocations, ledger) |
| Maintenance | `maintenance.read` | `maintenance.manage` |
| Licenses | `licenses.read` | `licenses.manage` (create/edit; key ref visible) |

---

## Policy / provisional financial UI

| Decision | UI treatment |
|---|---|
| **D06–D08** | `BudgetProvisionalNotice`; show `remainingProvisional`, `ledgerTotal`, `semanticsNote` from API — no fabricated utilization KPIs |
| **License renew** | Renew button disabled + notice; API returns **403** — no fake success |
| **Invoice balances** | Outstanding/paid totals from **`GET .../balance`** only |
| **Payments** | `idempotencyKey` (UUID per submit); duplicate-click guard on mutation |

---

## Tests and verification

| Check | Result |
|---|---|
| Web typecheck / lint / build | **Pass** — **31** routes |
| Web vitest | **Pass** — **36/36** (incl. `ui06-validators.test.ts`) |
| API regression | **Pass** — **37/37** |
| `npm run smoke:ui06` | **Pass** (when API + DB available) |

---

## UI05 visual evidence (pre-UI06 gate)

Screenshot capture folder: `docs/frontend/screenshots/ui05/README.md` (1440/1024/768/390/375 checklist). Automated UI05 regression: `npm run smoke:ui05`.

---

## Bugs fixed during UI06

- Aligned React Query usage with `apiGet` (unwrapped `data` vs paginated envelope).
- License DTO field: `licenseId` (not `softwareLicenseId`).
- Maintenance asset display: `assetCode`.

---

## Remaining client decisions

- **D03** — PO workflow (unchanged from UI05)  
- **D06–D08** — Official budget committed/actual semantics  
- **License renew** — Client approval for renew workflow  

---

## UI07 readiness

Global search (`/search`), documents, notifications, reports, and admin shells remain placeholders — backend routes exist per UI00 mapping. **UI07 not started.**
