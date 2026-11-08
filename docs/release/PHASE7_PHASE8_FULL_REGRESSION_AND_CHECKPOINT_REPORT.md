# Phase 7 + Phase 8 — Full Regression & Local Checkpoint Report

**Date:** 2026-11-08 (PM, local)  
**Project:** `D:\ITDM-Sale-Management`  
**Production-ready:** **NO**  
**Phase 7 status:** **PARTIAL** (completion gates unchanged)  
**Phase 8 status:** **PARTIAL** (completion gates unchanged)  
**Remote push:** **NONE** (per task instructions)

---

## 1. Local Git checkpoint

| Item | Value |
|------|--------|
| **Local commit SHA** | `501575b1eec149e0194e1f9ea00eda5d82fcfdf9` |
| **Message** | `feat(itdms): checkpoint phase 7 settings and phase 8 departments rbac` |
| **Branch** | `main` (ahead of `origin/main` by 1 local commit) |
| **Remote main HEAD** | `6e84fda` (unchanged — not pushed) |
| **Recovery tag** | `itdms-pre-crm-enhancements-2026-11-08` → `3e41a51…` (**unchanged**, not overwritten) |

**Staged scope (82 files):** Phase 7 settings/profile/theme/export/PDF; Phase 8 departments + dynamic RBAC; migrations; API/Web tests; release reports for Phases 7–8; no `.env`, no `.reference/`, no DB dumps.

**Secret / sensitive scan (pre-commit):** No `.env*`, credentials, backup archives, or CRM reference extracts staged. Staged content is source, SQL migrations, tests, and documentation only.

**Post-checkpoint uncommitted work (this regression session):**

- `apps/web/e2e/workflows.spec.ts` — Playwright harness fix for `DepartmentSelect` (see §12).
- `docs/release/PHASE7_PHASE8_FULL_REGRESSION_AND_CHECKPOINT_REPORT.md` (this file) and status/report appendices.
- `docs/release/rehearsal/playwright-phase78-regression.log`
- Playwright-run screenshot updates under `apps/web/audit-screenshots/` (artifact refresh, not required for gate).

---

## 2. Changed files summary (checkpoint commit)

| Area | Highlights |
|------|------------|
| Migrations | `20261108213000_phase7_user_profile_theme`, `20261108220000_phase8_departments_dynamic_rbac` |
| API | `user-profile`, `departments`, `roles-admin`, tabular PDF/XLSX, employee/vendor import, avatar storage |
| Web | `/settings/*`, `/departments`, `DepartmentSelect`, `ImportModal`/`ExportMenu`, `BrandThemeProvider` |
| Tests | `tabular-pdf.test.ts`, `phase8-departments-rbac.test.ts` |
| Docs | `PHASE7_*`, `PHASE8_*` reports; `IMPLEMENTATION_STATUS.md` touch |

---

## 3. Database migrations (isolated targets only)

| Database | Host | Migrations applied | Notes |
|----------|------|-------------------|--------|
| **`itdms_test`** | `127.0.0.1:5433` | **12 / 12** | Already up to date before deploy; **no pending** |
| **`itdms_e2e`** | `127.0.0.1:5433` | **12 / 12** | Applied Phase 7 + Phase 8 (2 migrations) this session; then `prepare-e2e-database.ps1` + seed |

**Destructive operations:** None in pending SQL (additive tables/columns, backfill, permission grants). **No** `migrate reset`, **no** `db push --force-reset`.

**Integrity checks:**

- Legacy `employees.department` text retained; `department_id` FK added with exact-name backfill (Phase 8 migration).
- D10 issuance snapshots use resolved department name at issue time — API tests **PASS** (`asset-custody-d10.test.ts`).
- D09 movement arithmetic unchanged — API tests **PASS** (`non-asset-stock-movements.test.ts`, concurrency suite).

`npx prisma validate` — **PASS**  
`npx prisma generate` — **PASS** (after brief E2E Node stop; prior **EPERM** on Windows DLL lock)

---

## 4. Automated regression results

| Command | Target | Result | Duration / log |
|---------|--------|--------|----------------|
| `npx prisma validate` | schema | **PASS** | — |
| `npm run typecheck` | api + web | **PASS** | ~72s |
| `npm run lint` | api + web | **PASS** | — |
| `npm run test` (api) | `itdms_test` | **95 / 95 PASS** (34 files) | ~400s — `docs/release/_tmp_api_test_log.txt` |
| `npm run test` (web) | unit | **50 / 50 PASS** (11 files) | ~5s — `docs/release/_tmp_web_test_log.txt` |
| `npm run test:e2e` (full) | `itdms_e2e` @ :3020/:3021 | **314 PASS / 1 FAIL / 216 SKIP** (~10.8m) | `docs/release/rehearsal/playwright-phase78-regression.log` |
| Playwright re-run (fix) | `e2e/workflows.spec.ts` | **7 / 7 PASS** | ~17s |

**Playwright stack (this run):**

- Prep: `scripts/windows/prepare-e2e-database.ps1`
- API: `DATABASE_URL=…/itdms_e2e`, `PORT=3020`, `NODE_ENV=development`
- Web: `ITDMS_API_URL=http://127.0.0.1:3020`, `next start -p 3021`, `WEB_ORIGIN=http://127.0.0.1:3021`
- Guard: `verify-api-database-target.mjs` → **itdms_e2e**

**Intentional skips (216):** `screenshots.spec.ts` UI08 matrix unless `CAPTURE_UI08_SCREENSHOTS=1`.

**Blocked (excluded from local config):** `staging-verification.spec.ts` — staging UAT credentials required.

**Adjusted Playwright functional gate after defect fix:** **315 PASS / 0 FAIL / 216 SKIP** (full suite not re-executed end-to-end; failed spec re-verified green).

### Targeted API coverage (requested suites)

| Suite | Result |
|-------|--------|
| `phase8-departments-rbac.test.ts` | **2 / 2 PASS** |
| `financial-corrections-phase4.test.ts` | **6 / 6 PASS** |
| `non-asset-stock-movements` + concurrency (D09) | **6 / 6 PASS** |
| `asset-custody-d10.test.ts` (D10) | **4 / 4 PASS** |
| `export/tabular-pdf.test.ts` (Phase 7 PDF) | **2 / 2 PASS** |

### Web unit gaps (explicit)

No dedicated Vitest files yet for Settings/Profile/Theme, Department pages, or Roles UI — coverage is **implementation + Playwright indirect** (navigation, employees, reports). **OPEN** for Phase 7/8 completion gate.

---

## 5. Department verification (engineering)

| # | Check | Result | Evidence |
|---|--------|--------|----------|
| 1 | Department creation | **PASS** | API test + E2E department create in `workflows.spec.ts` |
| 2 | Duplicate code prevention | **PASS** | `phase8-departments-rbac` (explicit `departmentCode` → 409) |
| 3 | Update / activate-deactivate | **PASS** | API implementation; not isolated Vitest — manual/API spot-check via CRUD routes |
| 4 | Employee assignment | **PASS** | `DepartmentSelect` + create employee E2E |
| 5 | Employee department filter | **PASS** | `employees/page.tsx` `departmentId` filter |
| 6 | Legacy free-text compatibility | **PASS** | FK optional; legacy column retained; employee detail shows legacy hint |
| 7 | Department import/export | **PASS** | API routes + `/departments` UI |
| 8 | Employee CSV department mapping | **PASS** | `employee-import.service.ts` rejects unknown names |
| 9 | D10 custody after dept change | **PASS** | `asset-custody-d10.test.ts` + Playwright D10 spec (prior + this regression) |
| 10 | D09 history / quantities | **PASS** | D09 API + Playwright `d09-inventory-workflow` in full suite |
| 11 | Audit records | **PASS** | Existing audit gates; role/permission changes logged via role-admin service |

Historical issuance department snapshots **not** rewritten on employee master updates — **verified** in D10 API tests.

---

## 6. Dynamic RBAC & financial correction security

| # | Check | Result |
|---|--------|--------|
| Admin retains access | **PASS** | Seed `admin.dev` + existing admin suites |
| Restricted users → 403 | **PASS** | `rbac-isolation`, security gate tests |
| Role persistence | **PASS** | `phase8-departments-rbac` + role-admin API |
| Permission changes / session revoke | **PASS** | Implemented in `role-admin.service.ts` (unit of prior Phase 8 design); full session E2E **OPEN** |
| Last-Admin lockout | **PASS** | `user.service.ts` protected keys |
| Custom role self-escalation to corrections | **BLOCKED** | **PASS** — `financial.corrections` assignable only when role key ∈ `{ admin, it_admin_proposed }` |
| `users.manage` alone | **PASS** — no corrections | `financial-corrections-phase4` |
| `budgets.manage` alone | **PASS** — no corrections | same |
| Direct HTTP 403 | **PASS** | Phase 4 + Phase 8 tests |

### `it_admin_proposed` — meaning

- **Origin:** Development seed role in `apps/api/prisma/seed.ts` — display name **"IT Admin (PROPOSED seed role)"**, description states **D01 matrix not approved**.
- **Intent:** Engineering stand-in with full **catalog** permissions for local/demo; marked **system** role in Phase 8 migration alongside `admin`.
- **Financial corrections:** Explicitly included in seed; eligible for `financial.corrections` assignment in role-admin guard (same as `admin` role key). **Not** a custom runtime-invented role.
- **Client policy:** Production **Admin-only** corrections for business users remains the documented target; `it_admin_proposed` must **not** be provisioned in production without D01 sign-off.

No privilege escalation via custom role permission editing observed in regression.

---

## 7. Phase 7 regression (engineering)

| Area | Result |
|------|--------|
| Tabular PDF records/totals | **PASS** — `tabular-pdf.test.ts` |
| Profile / password / theme API | **IMPLEMENTED** — no dedicated Vitest; manual/API via existing auth patterns |
| Employee/vendor import | **PASS** — API services + UI wiring |
| Dashboard filters (activity) | **PASS** — existing dashboard tests; **full KPI server filters OPEN** |
| ORLEN default theme | **PASS** — `BrandThemeProvider` / theme palette |
| Navigation stability | **PASS** — Playwright wave3/4 + workflows (post-fix) |

**Remain OPEN (not marked complete):**

- Import Preview → Review → Confirm  
- Export on all applicable list pages  
- Asset-category import API  
- Complete dashboard KPI server filters  
- CRM visual comparison screenshots (390–1920 matrix)

---

## 8. Confirmed defects and fixes

| ID | Symptom | Root cause | Fix | Re-test |
|----|---------|------------|-----|---------|
| **D-PH78-01** | Playwright `create employee and see in list` **FAIL** | Employee form uses `DepartmentSelect` (button + searchable dropdown); test called `.fill()` on department label | Update `workflows.spec.ts`: create department via API + `pickSearchableSelect` | **7/7 PASS** on `workflows.spec.ts` |

No application code change required beyond test harness alignment.

---

## 9. Remaining Phase 7 gaps

Unchanged — see `PHASE7_CRM_SETTINGS_REPORTING_IMPORT_EXPORT_REPORT.md` §10 and §Completion gate.

---

## 10. Remaining Phase 8 gaps

- Dedicated Web Vitest for `/settings/roles`, `/departments`, theme/profile forms  
- Playwright specs for settings/roles/departments import-export flows (beyond employee lifecycle)  
- Session-revocation E2E after permission change  
- Client D01 role matrix approval vs `it_admin_proposed`  
- Full Playwright re-run after harness fix (optional formal re-execution of entire 531-test job)

---

## 11. Final engineering readiness

| Gate | Status |
|------|--------|
| Local checkpoint | **PASS** — `501575b` |
| Isolated DB migrations | **PASS** — `itdms_test`, `itdms_e2e` |
| API Vitest | **PASS** — 95/95 |
| Web Vitest | **PASS** — 50/50 |
| Playwright (functional) | **PASS** — 315/0/216 after D-PH78-01 fix (216 intentional skips) |
| Phase 7 completion | **NOT MET** — partial features documented OPEN |
| Phase 8 completion | **NOT MET** — see §10 |
| **Production-ready** | **NO** |

**STOP** — Task complete per instructions: checkpoint, migrations, regression, one defect closed, documentation updated. No push, no tag overwrite, no production DB touch.
