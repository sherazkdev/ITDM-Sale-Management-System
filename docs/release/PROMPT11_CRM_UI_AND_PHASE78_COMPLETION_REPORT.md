# Prompt #11 — CRM UI Fidelity, Settings QA, Exports & Phase 7/8 Completion

**Date:** 2026-11-09 (local)  
**Production-ready:** **NO**  
**GitHub push:** **NONE**

---

## 1. Local recovery commit (Part 0)

| Item | SHA |
|------|-----|
| Prompt #10 checkpoint | **`ccfaac58a78e3fdb49bce85c74c8ddc2ac6e65e8`** — `feat(itdms): checkpoint prompt 10 dashboard filters and list exports` |
| Prompt #11 engineering | **Uncommitted** on `main` (this session) |
| Recovery tag `itdms-pre-crm-enhancements-2026-11-08` | **Unchanged** |
| Remote `origin/main` | **`6e84fda`** — **unchanged** |

Screenshot churn and `_tmp_*` logs remain **unstaged** by design.

---

## 2. CRM reference audit (Part 1)

**Extract:** `.reference/crm-managment-extract/` (gitignored) from `crm-managment.zip`.

| CRM component | ITDMS component | Reuse / adaptation | Gap |
|---------------|-----------------|--------------------|-----|
| `ImportModal.tsx` | `apps/web/src/components/data-management/ImportModal.tsx` | Preview → Review → Confirm | Extended modules still import-blocked by policy |
| `ExportMenu.tsx` | `ExportMenu.tsx` + `ReportListExportMenu.tsx` | CRM dropdown scopes | List pages now largely covered (see §4) |
| `settings/profile` | `/settings/profile` | Card layout, avatar upload | RTL not added; validators centralized (§7) |
| `settings/security` | `/settings/security` | Password visibility, validation | Shared Zod schema extracted |
| `BrandThemeProvider` / theme | `/settings/theme` + `BrandThemeProvider` | ORLEN rose default, system/light/dark | Full CRM marketing shell **not** ported |
| Dashboard | `/dashboard` | KPI + filter bar patterns | As-of scope labels added (§5) |
| Roles / permissions UI | `/settings/roles`, `RoleFormDialog` | Permission groups | `financial.corrections` admin-only **preserved** (§8) |
| Departments (CRM customers metaphor) | `/departments` Phase 8 | Table + import/export | No CRM re-capture this session |
| MongoDB / CRM API | — | **Not copied** | N/A |

---

## 3. Remaining exports implemented (Part 2)

**New report routes** (`apps/api`):

| Slug | Permission | Filters | Content |
|------|------------|---------|---------|
| `/reports/maintenance` | `reports.read` | `status`, `assetId` | Full register |
| `/reports/software-licenses` | `reports.read` | `before` (expiry) | No license key secrets |
| `/reports/document-metadata` | `documents.read` | — | Metadata + owner link only |
| `/reports/audit-logs` | `audit.read` | `targetType` | Redacted `metadata` JSON |

**UI:** `ReportListExportMenu` on maintenance, software licenses, documents, audit log, plus PO **status filter** wired to list + filtered export.

**PO list:** API `status` query + URL state via `useServerListTable`.

---

## 4. Import / export matrix (module)

| Module | Import | Export (CSV/XLSX/PDF) |
|--------|--------|------------------------|
| Employees, vendors, departments, asset categories | Yes (preview/confirm) | Entity `ExportMenu` / reports |
| POs, contracts, invoices, budgets, assets, issuance | No | `ReportListExportMenu` |
| Maintenance, licenses | No | **Added** (reports) |
| Documents | No | **Metadata only** |
| Audit | No | **Added** (redacted) |
| Financial transactions | **Blocked** | — |

---

## 5. Dashboard filter consistency (Part 3)

- Server filters unchanged from Prompt #10; **scope notes** on maintenance chart, expiry watchlist (**as-of / not activity-scoped**).
- Budget USD metrics remain **financial-year** scoped; activity range does not alter as-of balances.
- `DashboardFilterBar` reset clears URL query (existing behavior).

See `PROMPT10_BUILD_DASHBOARD_IMPORT_EXPORT_CLOSURE.md` §4 for full KPI matrix.

---

## 6–8. Settings, departments, RBAC (Parts 4–6)

| Area | Result |
|------|--------|
| Profile | Validators → `lib/validators/settings.ts`; avatar rules unit-tested |
| Security | Shared `passwordChangeSchema`; min 12 chars + confirm match |
| Theme / preferences | No structural change; ORLEN default preserved |
| Departments | Existing Phase 8 UI retained; CRM table patterns already aligned |
| Roles | `RoleFormDialog` admin-only `financial.corrections` copy **unchanged**; API `role-admin.service.ts` enforcement **unchanged** |

---

## 9. Security regression

| Check | Result |
|-------|--------|
| `financial.corrections` on `it_admin_proposed` | **Unchanged** (migration + seed) |
| Audit export metadata | **Redaction** — `audit-metadata-sanitize.test.ts` **1/1 PASS** |
| Audit route ACL | **`audit.read`** required (not only `reports.read`) |
| Document export | **No file bytes** in tabular output |

Full API `phase8-departments-rbac` / `financial-corrections-phase4` — **NOT RE-RUN** (PostgreSQL down).

---

## 10. Frontend tests (Part 7)

| Suite | Result |
|-------|--------|
| Web Vitest | **58 / 58 PASS** (14 files) — +`phase7-settings-validators.test.ts` |
| React Testing Library | **Not introduced** — project Vitest remains **node** environment; coverage via shared validators + registry tests |
| API Vitest (full) | **BLOCKED** — Docker @ `127.0.0.1:5433` |
| Playwright / visual matrix | **BLOCKED** — see `docs/release/prompt11-visual-audit/README.md` |

---

## 11. Build / lint

| Gate | Result |
|------|--------|
| Typecheck (api + web) | **PASS** |
| Web production build | **PASS** |
| API unit (sanitize) | **1/1 PASS** |

---

## 12. Phase completion decisions

| Phase | Decision | Rationale |
|-------|----------|-----------|
| **Phase 7** | **PARTIAL** | Exports substantially complete; CRM visual matrix not re-captured; RTL/component tests thin; full regression blocked |
| **Phase 8** | **PARTIAL** | RBAC UI/engineering sound; E2E not re-run |

---

## 13. Remaining blockers

1. Start Docker + PostgreSQL → full API Vitest + Playwright.  
2. Responsive screenshot capture (Prompt #11 matrix).  
3. Optional RTL smoke tests for settings/roles dialogs.  
4. Client UAT / D12 / production gates (`PRE_DEPLOYMENT_GAP_LIST.md`).

---

## 14. Uncommitted artifacts after `ccfaac5`

Application source (reports, PO filter, settings validators, dashboard notes, list exports on 4 pages), `docs/release/PROMPT11_*`, `prompt11-visual-audit/README.md`, and prior screenshot churn.

---

**Production-ready: NO** — STOP (Prompt #12 not executed).
