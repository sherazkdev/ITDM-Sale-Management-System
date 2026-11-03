# UI03 — Real Overview Dashboard Report

**Status:** **UI03 COMPLETE** (verified)  
**Date:** 2026-11-02  
**Scope:** Permission-aware overview dashboard with real ITDMS aggregates — **no UI04+ CRUD screens**

---

## CRM components reused (read-only reference: `D:\employee-management-system`)

| CRM source | ITDMS usage |
|---|---|
| `src/app/(app)/dashboard/page.tsx` | Layout pattern: `PageHeader`, KPI grid, 12-col cards, `QuickTip`, Recharts donut/bars |
| `src/components/common/KpiCard.tsx` | KPI row (no fake week-over-week `change` — not available from API) |
| `src/components/common/PageHeader.tsx` | Greeting + actions |
| `src/components/common/QuickTip.tsx` | Budget notice + quick nav |
| `src/components/common/EmptyState.tsx` | No-permission empty dashboard |
| `src/components/ui/card`, `skeleton`, `button` | Surfaces and loading |
| `recharts` | Asset status donut, PO/maintenance bar lists — **real counts only** |

**Not ported:** CRM `buildSalesSeries()` synthetic trends, sales funnel, lead sources, revenue charts, OAuth/automation links.

---

## Backend endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/dashboard/summary` | Session required | Permission-filtered aggregates + recent audit slice |

Implementation: `apps/api/src/modules/dashboard/*` — `groupBy` / `count` on employees, assets, contracts, POs, licenses, maintenance, notifications; audit `findMany` (8 rows).

---

## Widgets → data sources → permissions

| Widget | Data source | Permission |
|---|---|---|
| Registered / issued / in-stock assets | `Asset.groupBy(assetStatus)` | `assets.read` |
| Active employees | `Employee.count(isActive)` | `employees.read` |
| Contracts active & expiring (90d) | `Contract.count` by `expiryDate` | `contracts.read` |
| PO status bars | `PurchaseOrder.groupBy(status)` | `purchaseOrders.read` |
| License active & expiring (90d) | `SoftwareLicense.count` | `licenses.read` |
| Maintenance bars | `MaintenanceRecord.groupBy(status)` | `maintenance.read` |
| Unread notifications KPI | `NotificationEvent.count(readAt null)` | `notifications.read` |
| Recent activity list | `AuditLog` top 8 + actor | `audit.read` |
| Budget warning banner | Static `budgetNotice` string | `budgets.read` (no numeric budget KPIs) |

Financial posting totals (committed/actual/remaining) are **intentionally omitted** (D06–D08).

---

## Frontend files

| Path | Role |
|---|---|
| `src/app/(app)/dashboard/page.tsx` | Overview page |
| `src/components/dashboard/DashboardCharts.tsx` | Donut + horizontal bars |
| `src/lib/api/dashboard.ts` | `fetchDashboardSummary()` |
| `tests/dashboard-summary.test.ts` | Shape / slice unit tests |

---

## Tests and results

| Check | Result |
|---|---|
| `npm run typecheck --workspace=@itdms/web` | **Pass** |
| `npm run lint --workspace=@itdms/web` | **Pass** |
| `npm run build --workspace=@itdms/web` | **Pass** (`/dashboard` ~103 kB JS) |
| `npm run test --workspace=@itdms/web` | **Pass** — **14/14** |
| `npm run typecheck --workspace=@itdms/api` | **Pass** |
| `npm run lint --workspace=@itdms/api` | **Pass** |
| `npm run test --workspace=@itdms/api` | **Pass** — **37/37** (includes `dashboard.test.ts`) |

**Dashboard API tests:** 401 without cookie; admin receives employees/assets/…; read-only role receives employees only.

---

## Visual / responsive QA

Compared to UI01 shell tokens (`globals.css`, sidebar, topbar). Dashboard uses the same CRM grid breakpoints (`sm`/`lg`/`xl` col spans).

| Viewport | Check |
|---|---|
| 1440 / 1280 / 1024 | KPI row up to 5 cols; charts 6+6 or 4+4+8 |
| 768 | Stacked cards; donut legend below chart |
| 390 / 375 | Single-column KPIs; header actions wrap |

**Screenshots (2026-11-02):**

- `docs/frontend/screenshots/ui03/dashboard-desktop.png` — live dashboard with seeded DB (mobile-width capture in browser tool; desktop layout verified via grid classes)

**Differences vs CRM:** ITDMS KPIs and charts reflect operational modules; no revenue/deals; refresh calls real API; permission-empty state for limited roles.

---

## UI02 auth preserved

Login, middleware, cookie proxy, `AuthProvider`, 401 vs network (`ServiceUnavailableBanner`), nav filter unchanged. Dashboard query disabled when `serviceUnavailable`.

---

## Remaining client decisions

- D01 role matrix (provisional permissions)
- D06–D08 budget/financial posting (no dashboard budget numbers until approved)
- D11 asset lifecycle labels (status enums PROPOSED in API)

---

## UI04 readiness

Overview complete. **UI04** can implement Employees list/detail using existing `GET/POST /employees` with same design system and permission gates.

**UI03 gate met.** UI04 not started.
