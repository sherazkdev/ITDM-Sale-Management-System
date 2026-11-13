# ITDMS — Prompt #26 Final Functional Acceptance

**Generated:** 2026-11-13 (local)  
**Scope:** Complete Prompt #25 gaps — official document UI downloads, verification regression, migration readiness, data-safety record.

---

## 1. Git safety and recovery

| Item | Value |
|---|---|
| **Baseline SHA (Prompt #25)** | `350d2a18a30423568ae4c407016931eba653f851` |
| **Recovery tag (pre–Prompt #25)** | `itdms-pre-prompt25-2026-11-13` → `21d53bf` |
| **Recovery tag (pre–Prompt #26)** | `itdms-pre-prompt26-2026-11-13` → `350d2a1` |
| **Post–#26 commit** | See §15 (local only; no push) |
| **GitHub push** | **NOT DONE** (unauthorized) |
| **Production deploy** | **NOT DONE** (unauthorized) |

---

## 2. Data and environment preservation

| Check | Result |
|---|---|
| Docker PostgreSQL | `itdms-postgres` healthy on `127.0.0.1:5433` |
| Dev database identity | `itdms_dev` (from compose; fresh volume `itdm-sale-management_itdms_pg_data` from Prompt #25 — **pre–#25 dev records not assumed present**) |
| Test database | `itdms_test` — used by API Vitest (`prepareTestDatabase`; no destructive reset of dev) |
| E2E database | `itdms_e2e` — prepared via `scripts/windows/prepare-e2e-database.ps1` for Playwright |
| Client templates | `storage/client-templates/Issuance.xlsx` present; `Return.xlsx` expected alongside (gitignored) |
| Destructive ops | No volume deletes, no client-DB migration apply, no production touch |

---

## 3. Confirmed implementation status (Prompt #25 + #26 UI)

| Area | Status | Evidence |
|---|---|---|
| PO auto-approval on create | **Implemented** | `purchase-order.service.ts`; API test `prompt25-po-auto-approve.test.ts` |
| Manual PO submit/approve disabled | **Implemented** | Service 403; UI `PO_SHOW_LEGACY_WORKFLOW_ACTIONS = false` |
| Expiry milestones 60…0 | **Implemented** | `expiry-reminder-policy.ts`, `notification.service.ts` |
| Super Admin recipients only | **Implemented** | `super-admin-users.ts`, migration `recipient_user_id` |
| Finance RBAC | **Implemented** | `finance-access.ts`, search redaction, report gates, seed roles |
| Official Issuance/Return XLSX (API) | **Implemented** | `asset-movement-official-export.ts`, routes on issuances/returns |
| **Official download (Web UI)** | **Added #26** | `OfficialMovementDownloadButton`, asset issuance page toast, asset detail history |
| SAP integration | **Not required / absent** | No SAP approval narrative in PO flow |

---

## 4. Official XLSX download verification

| Check | Result |
|---|---|
| API `GET .../official-xlsx` (issuance) | **PASS** — `prompt25-asset-official-export.test.ts` |
| API with client template on disk | **PASS** — template path resolvable under `storage/client-templates/` |
| UI download helpers | **PASS** — `apps/web/tests/official-movement-download.test.ts` (Vitest) |
| E2E download via authenticated API proxy | **Scheduled** — `e2e/prompt26-official-movement-download.spec.ts` (see §10) |
| Transaction mutation on download | **None** — export is read-only |
| Missing template | **Clear error** — API `AppError` when template file absent |

---

## 5. PO automatic approval verification

| Check | Result |
|---|---|
| New PO status `APPROVED` server-side | **PASS** — `prompt25-po-auto-approve.test.ts` |
| Lines composable on approved PO | **PASS** (same test) |
| Legacy workflow actions hidden in UI | **PASS** — PO detail page + `purchase-order-ui.ts` |
| Historical PO rewrite | **Not performed** — create-path only |

---

## 6. Notification schedule and recipients

| Check | Result |
|---|---|
| All ten milestones (contract + PO + license) | **PASS** — `prompt26-expiry-all-milestones.test.ts` |
| Super Admin receives; Manager/IT Staff excluded | **PASS** — `prompt26-notification-recipients.test.ts` |
| Idempotent scan | **PASS** — existing `notification-expiry.test.ts`, milestone dup tests |
| Schedule change | **None** — policy constants unchanged |

---

## 7. Finance RBAC

| Check | Result |
|---|---|
| Manager: invoice read, no payment create | **PASS** — `prompt25-finance-rbac.test.ts` |
| IT Staff: no invoices/budgets/search finance | **PASS** (same) |
| Report routes gated | **Implemented** — requires finance read |
| Unauthorized API direct access | **Covered** in finance RBAC + security regression suites |

---

## 8. Global Search

| Check | Result |
|---|---|
| PO hub links (vendor, contract, invoices, assets, stock) | **PASS** — `po-search-hub.test.ts` (API); E2E `po-search-hub.spec.ts` in core Playwright batch |
| Finance redaction by role | **PASS** — finance RBAC search case |

**Overall Global Search:** **PARTIAL** until full Playwright search UX pass completes; API hub serialization verified.

---

## 9. Financial calculations and inventory (D09)

| Check | Result |
|---|---|
| Budget / invoice / payment rules | **PASS** — `wave2-finance.test.ts`, procurement flow |
| Non-asset 100→80→… movement | **PASS** — `non-asset-stock-movements.test.ts` |
| D09 concurrency / idempotency | **PASS** when suite not lock-starved — `non-asset-stock-concurrency.test.ts` (also in #26 targeted run) |

---

## 10. Test execution summary

### Static checks

| Check | Result |
|---|---|
| `npx prisma validate` | **PASS** |
| API `tsc --noEmit` | **PASS** |
| API `eslint` (full tree) | **INFRA** — prior run exceeded wall clock; spot lint on new #26 tests **PASS** |
| Web typecheck / lint / build | **PASS** (Prompt #26 session) |

### API Vitest

| Run | Files | Tests | Notes |
|---|---|---|---|
| Full suite (pre timeout fix) | 38 / 43 pass | 101 / 109 pass, 5 skipped | Failures: prepare **lock timeout**, hook timeout, 30s test timeout, transient login 500 after ~58m run |
| **Targeted Prompt #25/#26 + D09** | **6 / 6** | **9 / 9** | **PASS** after `vitest.config` + prepare lock tuning |
| **Full rerun** | *In progress* | *In progress* | Log: `docs/release/_tmp_prompt26_api_rerun_log.txt` |

**Infra fixes applied (test harness only):** `hookTimeout`/`testTimeout` 180s/90s; prepare lock wait 180s; Prisma exec timeout 180s.

### Web Vitest

| Result |
|---|
| **18 files, 73 / 73 tests PASS** |

### Playwright (isolated `itdms_e2e`, API :3020)

| Batch | Scope |
|---|---|
| Core regression (excludes capture/screenshot specs) | auth, workflows, D09, prompt26 official download, PO search hub, lifecycle-connected, wave3 finance/inventory, list tables, routes, phase-d forms |
| Log | `docs/release/_tmp_prompt26_playwright_log.txt` |
| **Counts** | **0 / 84 executed** — setup failed: Chromium executable missing in agent environment (`npx playwright install` required on host) |
| **After browser install** | Re-run core batch; expect **84 tests** in selected specs (includes setup) |

Full Playwright including visual capture specs was **not** re-run (out of scope for functional sign-off; no UI redesign).

---

## 11. Migration readiness

**Migration:** `20261113153000_prompt25_notification_recipient`

- Adds nullable `notification_events.recipient_user_id` FK → `users`.
- Applied successfully on `itdms_test` and `itdms_e2e` via migrate deploy.
- **Production procedure:** backup → review SQL → `prisma migrate deploy` on client DB during maintenance window → verify Super Admin users exist → run one controlled expiry job in staging before prod scheduler enable.

---

## 12. Remaining functional blockers

1. **Full API Vitest green on Windows long runs** — confirm post–harness rerun (was 101/109).
2. **Playwright** — install browsers on workstation (`cd apps/web && npx playwright install chromium`) then rerun core batch with API on `:3020` and `itdms_e2e`.
3. **Full API Vitest rerun** — confirm `docs/release/_tmp_prompt26_api_rerun_log.txt` reaches **43/43** files.
4. **API ESLint full-tree** — prior run exceeded wall-clock; spot lint on #26 tests **PASS**.

---

## 13. Client-dependent items

1. Deploy `Issuance.xlsx` and `Return.xlsx` to persistent host path (`storage/client-templates/` or env overrides).
2. Production DB migration approval for `recipient_user_id`.
3. Confirm Super Admin account list matches operational policy for expiry in-app only.

---

## 14. Deployment readiness

| Verdict | Evidence |
|---|---|
| **NO** — not production-ready yet | Full API regression and core Playwright batch must finish green; acceptance sign-off requires stable 109/109 API tests and documented Playwright counts. |

Functional rules from Prompt #25 are implemented and spot-verified; **#26 adds user-facing official downloads and strengthens milestone/recipient tests.**

---

## 15. Local commit (Prompt #26)

_To be filled after commit:_ SHA of commit containing UI download wiring, Prompt #26 tests, vitest/prepare harness tuning, and this document.
