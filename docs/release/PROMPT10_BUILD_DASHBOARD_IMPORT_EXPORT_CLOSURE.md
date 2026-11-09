# Prompt #10 — Build Repair, Dashboard Filters, Import/Export Closure

**Date:** 2026-11-09 (local)  
**Production-ready:** **NO**  
**GitHub push:** **NONE**

---

## 1. Git checkpoints

| Item | Value |
|------|--------|
| Part 0 checkpoint (prior session) | `4656039` — `feat(itdms): checkpoint dashboard and import-export gap closure` |
| Earlier Phase 7+8 | `501575b`, `fff1bf9` |
| Recovery tag `itdms-pre-crm-enhancements-2026-11-08` | `3e41a51` — **unchanged** |
| Remote `main` | `6e84fda` — **unchanged** |
| Prompt #10 engineering delta | **Committed** as **`ccfaac5`** (`feat(itdms): checkpoint prompt 10 dashboard filters and list exports`) |

**Staged for this task:** application source, `ReportListExportMenu`, `list-export-config.ts`, API report/dashboard changes, release docs — **not** screenshot matrix churn or `docs/release/_tmp_*` logs unless explicitly requested.

---

## 2. Next.js production build (`/404` prerender)

| Field | Detail |
|-------|--------|
| **Symptom** | `next build` failed during `/404` prerender with an `Html`-related error (conflicts with App Router). |
| **Root cause** | **Corrupt or stale `apps/web/.next` artifact** from an interrupted or mixed-mode build — not invalid `next/document` usage in App Router source. |
| **Fix** | Remove `apps/web/.next`, run `npm run build --workspace=@itdms/web`. |
| **Result (2026-11-09)** | **PASS** — full route table compiled; standalone output unchanged. |
| **Files changed** | None in application source for this defect (environment hygiene only). |

---

## 3. Automated regression (2026-11-09)

| Gate | Result | Notes |
|------|--------|--------|
| `prisma validate` (`apps/api`) | **PASS** | |
| API + Web `typecheck` | **PASS** | |
| Web `lint` | **PASS** | |
| Web Vitest | **54 / 54 PASS** (13 files) | Includes `dashboard-filters.test.ts` |
| Web production `build` | **PASS** | After `.next` clean |
| API Vitest | **BLOCKED (infra)** | Docker Desktop **down** → `P1001` @ `127.0.0.1:5433`; **28 suites** failed at `migrate deploy`, **7 passed** (unit-only) |
| Playwright full (`itdms_e2e`, :3020/:3021) | **NOT RUN** | PostgreSQL unavailable; ports **3020/3021 closed** |
| Prior evidence (unchanged) | API **97/97**, Playwright **315/0/216** | `PHASE7_PHASE8_FINAL_GAP_CLOSURE_REPORT.md` |

**To re-run API + Playwright:** start Docker / PostgreSQL on `127.0.0.1:5433`, `migrate deploy` on `itdms_test` and `itdms_e2e`, then `npm run test --workspace=@itdms/api` and `npm run test:e2e:local --workspace=@itdms/web` with healthy E2E services on **3020/3021**.

---

## 4. Dashboard filter matrix (KPI / chart vs filters)

Legend: **Y** = server-scoped where semantically valid; **—** = not applied (as-of / lifetime / unrelated); **P** = partial / client-only.

| Section | Date range | Financial year | Department | PO status | Asset category | Asset status |
|---------|------------|----------------|------------|-----------|----------------|--------------|
| Employees (counts) | — | — | **Y** | — | — | — |
| Serialized assets (status breakdown) | — | — | — | — | **Y** | **Y** |
| Non-asset item count | — | — | — | — | — | — |
| Issuance / return doc counts | **Y** | — | **Y** (receiving dept snapshot) | — | — | — |
| Purchase orders (by status) | — | — | — | **Y** | — | — |
| Budget USD (allocated / utilized / actual / remaining) | — | **Y** | — | — | — | — |
| Budget ledger line counts (committed / actual payment) | — | — | — | — | — | — |
| Recent audit activity (list) | **Y** | — | — | — | — | — |
| Contracts / licenses (active & expiring) | — | — | — | — | — | — |
| Maintenance by status | — | — | — | — | — | — |
| Expiry watchlist | — | — | — | — | — | — |
| Notifications unread | — | — | — | — | — | — |

**UI:** `DashboardFilterBar` — date presets, department, financial year, PO status, asset category, asset status, active-filter badge, URL sync, reset.

**Backend:** `GET /api/v1/dashboard/summary` query params: `from`, `to`, `departmentId`, `financialYearId`, `poStatus`, `assetCategoryId`, `assetStatus`.

**Remaining gap:** Contracts, licenses, maintenance, and non-asset **balances** intentionally exclude activity date filters (as-of semantics). Optional future: maintenance **opened-in-period** metric if product approves.

---

## 5. Export feature matrix (list / management pages)

| Module | UI component | CSV | XLSX | PDF | Filtered export | Notes |
|--------|--------------|-----|------|-----|-----------------|-------|
| Employees | `ExportMenu` (entity) | Y | Y | Y | Y (search, dept, active) | |
| Departments | `ExportMenu` | Y | Y | Y | Y | |
| Vendors | `ExportMenu` | Y | Y | Y | Y | |
| Asset categories | `ExportMenu` | Y | — | — | Y | Entity CSV |
| Serialized assets | `ReportListExportMenu` | Y | Y | Y | All / filtered* | *Report = full register today |
| Non-asset inventory | `ReportListExportMenu` (`inventory-combined`) | Y | Y | Y | Report scope | |
| Purchase orders | `ReportListExportMenu` | Y | Y | Y | **Y** (`status` query) | List UI has no status filter yet |
| Contracts | `ReportListExportMenu` | Y | Y | Y | All / filtered* | Row cap **removed** |
| Invoices | `ReportListExportMenu` | Y | Y | Y | **Y** (`search`, `paymentStatus`) | Row cap **removed**; aligns with list API |
| Budgets | `ReportListExportMenu` (`budget-utilization`) | Y | Y | Y | **Y** (`financialYearId`) | Uses selected FY on page |
| Asset issuance (workflow) | `ReportListExportMenu` (`asset-movements`) | Y | Y | Y | All | Non-official D12 layout |
| Reports hub | Built-in download | Y | Y | Y | Per slug | |
| Maintenance | — | — | — | — | — | **No report slug** — use hub or future module export |
| Software licenses | — | — | — | — | — | Same |
| Documents | — | — | — | — | — | Attachment-centric; no tabular bulk export |
| Audit logs | — | — | — | — | — | Read-only; no export API |
| Asset history search | — | — | — | — | — | Navigate to asset detail / movements report |

**Infrastructure:** Phase 7 `tabular-pdf.ts` / `tabular-xlsx.ts`; disclaimer header `NON-OFFICIAL-D12`; formula-safe CSV escaping in shared export helpers.

**Remaining gap:** PO list **filtered** export without list status filter; inventory/asset register filtered by current list search; maintenance/licenses module-level menus; remove **5000** caps on `inventory` / `asset-register` reports if datasets exceed cap (PO/employees/contracts/invoices uncapped or filter-scoped).

---

## 6. Import support matrix

| Module | CRM `ImportModal` | Preview API | Confirm step | Policy |
|--------|-------------------|-------------|--------------|--------|
| Employees | Y | `POST …/import/preview` | Y | |
| Vendors | Y | Y | Y | |
| Departments | Y | Y | Y | |
| Asset categories | Y | Y | Y | |
| All other masters | — | — | — | No fake Import buttons |
| Invoices, payments, budget ledger, stock movements, custody history | — | — | — | **Forbidden** bulk CSV |

**CRM reuse:** `ImportModal.tsx`, `ExportMenu.tsx`, `itdms-import-export-config.ts` patterned on CRM ZIP (`.reference/crm-managment-extract/`, gitignored).

---

## 7. PDF / CSV / XLSX correctness

| Check | Status |
|-------|--------|
| PDF row truncation fix (Phase 7) | **VERIFIED** (prior) — `tabular-pdf.test.ts` |
| Invoice export columns (Wave 2) | **VERIFIED** (prior) |
| Invoice **filtered** export vs list | **IMPLEMENTED** (Prompt #10); **not re-tested** (DB down) |
| Budget utilization vs `computeBudgetUsdMetrics` | **Unchanged** authoritative path |
| D12 official issuance/return PDFs | **CLIENT BLOCKED** — operational export only |

---

## 8. Phase 7 / 8 status (honest)

| Phase | Status | Rationale |
|-------|--------|-----------|
| **Phase 7** | **PARTIAL** | Build **fixed**; dashboard filters **extended** (assets + movements); list export **partial rollout**; full regression **blocked** on PostgreSQL |
| **Phase 8** | **PARTIAL** | RBAC/departments **preserved**; no new Phase 8 defects found; E2E not re-run |

---

## 9. Remaining defects / blockers

1. **Docker / PostgreSQL `127.0.0.1:5433` down** — API Vitest and Playwright not executed this session.  
2. Export coverage gaps (maintenance, licenses, documents, audit).  
3. Dashboard lifetime sections (contracts, licenses, maintenance) intentionally unfiltered — document for UAT.  
4. Release blockers **B1–B15** unchanged (`PRE_DEPLOYMENT_GAP_LIST.md`).  
5. Large screenshot churn in working tree — exclude from checkpoints by default.

---

## 10. Key files touched (Prompt #10 delta)

| Area | Paths |
|------|--------|
| Dashboard API | `apps/api/src/modules/dashboard/dashboard.controller.ts`, `dashboard.service.ts` |
| Reports API | `apps/api/src/modules/reports/report.controller.ts`, `report.service.ts` |
| Dashboard UI | `apps/web/src/components/dashboard/DashboardFilterBar.tsx`, `app/(app)/dashboard/page.tsx`, `lib/api/dashboard.ts` |
| List export UI | `ReportListExportMenu.tsx`, `list-export-config.ts`, PO/assets/invoices/contracts/budgets pages, `asset-issuance/page.tsx` |

---

**Production-ready: NO** — client UAT, D12 templates, infrastructure rehearsal, and fresh full regression on live PostgreSQL remain open.
