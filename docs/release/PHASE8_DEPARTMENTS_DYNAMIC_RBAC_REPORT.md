# Phase 8 — Departments & Dynamic RBAC

**Date:** 2026-11-08  
**Status:** **PARTIAL** (engineering foundation — not full completion gate)  
**Production-ready:** **NO**

---

## 1. Git preflight

| Item | State |
|------|--------|
| Cloud HEAD (unchanged push) | `6e84fda` + tag `itdms-pre-crm-enhancements-2026-11-08` |
| Local working tree | Checkpoint **501575b** local only; post-checkpoint harness/doc fixes **uncommitted** |
| Recovery | Existing tags preserved |

**Recommendation:** Create a local commit checkpoint before client UAT (not pushed unless authorized).

---

## 2. Phase 7 verification gate (pre–Phase 8)

| Check | Result |
|-------|--------|
| `prisma validate` | **PASS** |
| `npm run typecheck` | **PASS** (api + web, post–Phase 8 edits) |
| `npm run lint` | **PASS** |
| Phase 7 migration on `itdms_test` | **Applied** (11 migrations before Phase 8 file; Phase 8 migration **#12** on fresh deploy) |
| Full API Vitest (pre–Phase 8 edit) | **93 tests** — **91 pass** + **2 PDF tests** fixed in tree; re-run after Phase 8 |
| Web Vitest / Playwright | **NOT RE-RUN** this session |
| CRM screenshots 390–1920 | **NOT CAPTURED** |

---

## 3. Department schema & migration

**Migration:** `20261108220000_phase8_departments_dynamic_rbac`

- `departments` master table  
- `department_legacy_labels` — exact legacy strings, **no synonym auto-merge**  
- `employees.department_id` FK — legacy `department` text retained  
- Backfill: one department per distinct legacy label; link employees on **exact** name match  

**Permissions added:** `departments.read`, `departments.manage`, `roles.manage` (seed role `it_admin_proposed` granted in migration SQL).

---

## 4. Department functionality (API + web)

| Capability | Status |
|------------|--------|
| CRUD `/api/v1/departments` | **IMPLEMENTED** |
| List/search/status/pagination | **IMPLEMENTED** |
| Import `POST /departments/import` | **IMPLEMENTED** |
| Export `GET /departments/export` | **IMPLEMENTED** |
| Web `/departments` | **IMPLEMENTED** (CRM-style list + Import/Export) |
| Employee department select | **IMPLEMENTED** (`DepartmentSelect`) |
| Employee list `departmentId` filter | **IMPLEMENTED** |
| Employee import department resolve | **IMPLEMENTED** — rejects unknown department names |

---

## 5. Dynamic roles (API + web)

| Capability | Status |
|------------|--------|
| `GET/POST/PATCH/DELETE /api/v1/roles` | **IMPLEMENTED** |
| `PUT /api/v1/roles/:id/permissions` | **IMPLEMENTED** |
| `financial.corrections` on custom roles | **BLOCKED** (403) — Admin role keys only |
| Session revoke on role permission change | **IMPLEMENTED** |
| Last-admin assignment guard | **IMPLEMENTED** (`setRoles`) |
| Web `/settings/roles` + CRM `RoleFormDialog` | **IMPLEMENTED** |
| Permission catalog UI groups | **IMPLEMENTED** (`permission-groups.ts`) |

**Note:** Permissions remain **catalog keys from seed**; new keys require seed/migration — not arbitrary runtime permission invention.

---

## 6. Integration (D09/D10)

- Asset issuance uses `departmentRef.departmentName ?? department` for default receiving department snapshot — **historical snapshots unchanged**.
- D09/D10 movement arithmetic and custody snapshots — **not modified**.

---

## 7. CRM UI reuse (reference)

- Settings shell (Phase 7) extended with Administration links  
- `RoleFormDialog`, role colors, Import/Export modals  
- Department list/dialog patterns aligned to CRM spacing and cards  

---

## 8. Phase 7 gaps (unchanged — NOT COMPLETE)

| Gap | Status |
|-----|--------|
| Asset-category import API | **OPEN** |
| Import Preview → Confirm workflow | **OPEN** |
| Import/Export on all list modules | **OPEN** |
| Full dashboard KPI server filters | **OPEN** |
| Playwright + CRM side-by-side screenshots | **OPEN** |

---

## 9. Tests added

- `apps/api/tests/http/phase8-departments-rbac.test.ts` — department create + financial.corrections escalation block  

**Completion gate:** **NOT MET** — full Playwright regression, web Vitest, session-revocation e2e, and client UAT remain.

---

## 10. Client deployment blockers

Unchanged: D12 templates, D01/D02 matrix approval, native Windows PG, UAT sign-off, air-gap client install.

**STOP** — Phase 8 engineering foundation delivered; **PARTIAL** until regression matrix is green and completion gate items verified.

---

## 11. Addendum — Phase 7+8 checkpoint regression (2026-11-08 PM)

| Check | Result |
|-------|--------|
| Local commit | **501575b** (includes Phase 8 tree; report §1 pre-checkpoint note superseded for Git state) |
| Migration `20261108220000_phase8_departments_dynamic_rbac` | **Applied** on `itdms_test` (already current) and `itdms_e2e` (2 migrations applied this session) |
| `phase8-departments-rbac.test.ts` | **2/2 PASS** (duplicate explicit `departmentCode` → 409; custom role cannot hold `financial.corrections`) |
| D10 / D09 API regression | **PASS** (custody + movements suites in full **95/95**) |
| Playwright employee create | **FAIL then FIX** — `workflows.spec.ts` updated for `DepartmentSelect` (uncommitted post-**501575b**) |
| Dedicated Web Vitest for `/departments`, `/settings/roles` | **NOT ADDED** — completion gate **OPEN** |

**`it_admin_proposed`:** Dev seed system role only — see `PHASE7_PHASE8_FULL_REGRESSION_AND_CHECKPOINT_REPORT.md` §6.

**Phase 8 status remains PARTIAL.**

**Production-ready: NO**

---

## 12. Addendum — financial corrections hardening (2026-11-08 late PM)

| Item | Result |
|------|--------|
| `financial.corrections` assignable | **`admin` role key only** |
| `it_admin_proposed` | Corrections **removed** (migration + seed) |
| `admin.dev` | **admin** + proposed roles (corrections via admin) |
| API tests | `phase8-departments-rbac` **3/3**; financial Phase 4 **6/6** |

Gap-closure details: `PHASE7_PHASE8_FINAL_GAP_CLOSURE_REPORT.md` (uncommitted implementation after `fff1bf9`).

---

## 13. Addendum — Prompt #11 (2026-11-09)

No RBAC rule changes. `financial.corrections` admin-only enforcement **preserved**. Audit export uses `audit.read` + metadata redaction. Full `phase8-departments-rbac` suite **not re-run** (PostgreSQL down). See `PROMPT11_CRM_UI_AND_PHASE78_COMPLETION_REPORT.md`. Phase 8 remains **PARTIAL**.
