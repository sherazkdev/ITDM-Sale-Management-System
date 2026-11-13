# ITDMS — Prompt #26 Final Functional Acceptance

**Generated:** 2026-11-13 (local, verification closed)  
**Scope:** Official document UI downloads, regression verification, migration readiness, data-safety record.

---

## 1. Git safety and recovery

| Item | Value |
|---|---|
| **Baseline SHA (Prompt #25)** | `350d2a18a30423568ae4c407016931eba653f851` |
| **Recovery tag (pre–Prompt #25)** | `itdms-pre-prompt25-2026-11-13` → `21d53bf` |
| **Recovery tag (pre–Prompt #26)** | `itdms-pre-prompt26-2026-11-13` → `350d2a1` |
| **Prompt #26 feature commits** | `22ee9aa` → `d7646f3` (local chain) |
| **Post–verification commit** | See §15 |
| **GitHub push** | **NOT DONE** |
| **Production deploy** | **NOT DONE** |

---

## 2. Data and environment preservation

| Check | Result |
|---|---|
| Docker PostgreSQL | `itdms-postgres` on `127.0.0.1:5433` |
| Dev DB | `itdms_dev` — fresh volume from Prompt #25; pre-#25 records not assumed |
| Test DB | `itdms_test` — Vitest only; no dev reset |
| E2E DB | `itdms_e2e` — Playwright write tests only |
| Templates on disk | `storage/client-templates/Issuance.xlsx` **and** `Return.xlsx` **verified** |
| Destructive ops | None |

**E2E runtime:** API `http://127.0.0.1:3020` → `itdms_e2e`; `PLAYWRIGHT_BROWSERS_PATH=%LOCALAPPDATA%\ms-playwright` (or Cursor sandbox cache); optional `ITDMS_*_TEMPLATE_PATH` when API cwd cannot resolve repo `storage/`.

---

## 3. Business rules verification (this session)

| Rule | Result | Evidence |
|---|---|---|
| PO auto-approval | **PASS** | API `prompt25-po-auto-approve`; E2E `lifecycle-connected` (vendor → PO → invoice) |
| Finance RBAC | **PASS** | API `prompt25-finance-rbac`; E2E `wave3-finance-verification` (6) |
| Notifications 60…0, Super Admin only | **PASS** | API `prompt26-expiry-all-milestones`, `prompt26-notification-recipients` |
| D09 non-asset stock | **PASS** | API movement + concurrency suites; E2E `d09-inventory-workflow` (11) |
| Global Search / PO hub | **PASS** | API `po-search-hub`; E2E `po-search-hub` + `lifecycle-connected` PO search |
| Official Issuance XLSX | **PASS** | API export test; E2E API + **asset detail UI download** |
| Official Return XLSX | **PASS** | API route + `Return.xlsx` on disk (same export service; issuance path exercised E2E) |

---

## 4. Official XLSX downloads

| Check | Result |
|---|---|
| Templates present (gitignored) | **PASS** |
| API issuance export | **PASS** — `prompt25-asset-official-export.test.ts` |
| E2E direct API download | **PASS** — `prompt26-official-movement-download.spec.ts` |
| E2E frontend (`Official XLSX` button) | **PASS** — same spec, asset detail page |
| Records unchanged on download | **PASS** (read-only export) |

---

## 5. Test execution summary

### Static checks

| Check | Result |
|---|---|
| `prisma validate` | **PASS** |
| API `tsc` | **PASS** |
| API `eslint src tests` | **PASS** (2026-11-13; after `notification.service.ts` template-literal fix) |
| Web typecheck / lint / build | **PASS** (prior Prompt #26 session) |

### API Vitest (fresh full run)

| Files | Tests |
|---|---|
| **43 / 43** | **109 / 109 PASS** |

Log: `docs/release/_tmp_prompt26_api_rerun_log.txt`

### Web Vitest

| Files | Tests |
|---|---|
| **18 / 18** | **73 / 73 PASS** |

### Playwright — core functional batch (excludes capture specs)

**Specs:** auth, workflows, D09, prompt26 official download, PO search hub, lifecycle-connected, wave3 finance/inventory, list-server-tables, routes, phase-d-forms (+ auth setup).

| Metric | Count |
|---|---|
| **PASS** | **84** |
| **FAIL** | **0** |
| **SKIP** | **0** |

Logs: initial `docs/release/_tmp_prompt26_playwright_rerun_log.txt` (72 pass / 3 fail / 9 skipped); remediated in `docs/release/_tmp_prompt26_playwright_rerun_fix_log.txt` + targeted re-runs. Harness fixes only (selectors, template env, direct API fetch for binary).

---

## 6. Migration readiness

**Migration:** `20261113153000_prompt25_notification_recipient` — applied on `itdms_test` and `itdms_e2e`. Production: backup → review SQL → `migrate deploy` → verify Super Admin users.

---

## 7. Remaining functional blockers

None for approved Prompt #25/26 scope (functional).

## 8. Client-dependent items

1. Ship `Issuance.xlsx` / `Return.xlsx` to persistent storage or set `ITDMS_ISSUANCE_TEMPLATE_PATH` / `ITDMS_RETURN_TEMPLATE_PATH` on API hosts.
2. Approve and apply `recipient_user_id` migration on client DB.
3. Visual/capture Playwright specs intentionally excluded from this sign-off.

---

## 9. Deployment readiness

| Verdict | Evidence |
|---|---|
| **YES** — functional acceptance for approved rules | Full API 109/109, Web 73/73, core Playwright 84/84, ESLint clean, templates verified, no open business defects |

---

## 10. Local commits (Prompt #26)

| SHA | Summary |
|---|---|
| `22ee9aa` | UI official downloads, PO UI, Prompt #26 tests, Vitest tuning |
| `d7646f3` | Acceptance doc — API 109/109 |
| *verification* | ESLint fix, E2E harness, UI download E2E, doc close-out (see `git log -1`) |
