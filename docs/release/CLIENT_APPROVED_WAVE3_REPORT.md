# Client-Approved Wave 3 — Final Verification Gate

**Date:** 2026-11-03  
**Scope:** Wave 2 financial verification closure; D09 non-asset inventory (Wave 1 + Wave 3 metadata)  
**Gate status:** **Wave 3 VERIFIED** (evidence below)  
**UAT / production deploy:** **NOT STARTED**

---

## 0. Verification summary

| Gate | Result |
|---|---|
| Prisma migrations (`migrate deploy` / status) | **8 migrations, schema up to date** on `itdms_dev@127.0.0.1:5433` |
| API build + single instance | **Rebuilt** (`npm run build`); health `GET /api/v1/health/ready` → `database: up` |
| Isolated API test database | **`itdms_test`** on same host/port — set in `apps/api/tests/setup.ts`; suite uses `prisma migrate deploy`, does **not** reset `itdms_dev` |
| API regression | **lint, typecheck, build PASS**; **66/66** tests, **24** files (2026-11-03 ~16:08 UTC+5) |
| Web regression | **typecheck, lint PASS**; **Vitest 43/43** (9 files); **Next.js build PASS** |
| Playwright Wave 3 finance | **6/6 scenarios + setup** — **7 passed** in `wave3-finance-verification.spec.ts` |
| Playwright Wave 3 inventory | **6/6 passed** in `wave3-inventory.spec.ts` |
| Playwright total (gate run) | **13 passed** (1 setup + 12 chromium-desktop), ~33s, `CI=1`, `ITDMS_API_URL=http://127.0.0.1:3000` |
| Backup rotation (isolated dir) | **`ok: true`**, `manifestsAfterSecond: 2`, `ITDMS_BACKUP_RETAIN_LOCAL=2` |
| Restore rehearsal (isolated DB) | **`itdms_restore_test`**; **`non_asset_stock_items`: 14**; **`itdms_dev` untouched** |
| Financial rules changed | **None** |
| Provisional budget notices (Wave 2) | **Retained** (`remainingUsd`, credits, FX, etc.) |
| New consumption policies (D09) | **None implemented** |

---

## 1. Database and API (commands and evidence)

**Isolated test DB (API Vitest only):**

```text
postgresql://itdms:itdms_dev_password@127.0.0.1:5433/itdms_test?schema=public
```

Configured via `apps/api/tests/setup.ts` before migrations/tests. Development data remains on `itdms_dev`.

**Migrations (dev):**

```powershell
cd apps\api
npx prisma migrate status
# → 8 migrations found; Database schema is up to date!
```

**API rebuild and health:**

```powershell
cd apps\api
npm run build
# Start one API (example — match apps/api/.env DATABASE_URL to 5433/itdms_dev):
$env:PORT="3000"
$env:NODE_ENV="development"
$env:DATABASE_URL="postgresql://itdms:itdms_dev_password@127.0.0.1:5433/itdms_dev?schema=public"
node dist/server.js

Invoke-RestMethod http://127.0.0.1:3000/api/v1/health/ready
# success: true, checks.database: "up"
```

Stale listeners on ports **3000 / 3002 / 3012** were stopped before verification so Playwright hit the latest build.

---

## 2. Financial Playwright (`e2e/wave3-finance-verification.spec.ts`)

```powershell
cd apps\web
$env:CI="1"
$env:ITDMS_API_URL="http://127.0.0.1:3000"
npx playwright test e2e/wave3-finance-verification.spec.ts --project=chromium-desktop --retries=0
```

| Scenario | Assertion focus | Result |
|---|---|---|
| Setup budget, vendor, PO | API seed | **PASS** |
| Two invoices on one PO | Multiple invoices under same PO | **PASS** |
| Payment before post | UI blocked + API **409** pay-before-post | **PASS** (invoice posting before payment) |
| Post, partial pay, balance | UI partial payment; outstanding **600** / paid **400** matches API | **PASS** |
| Second invoice + budget | `committedUsd` on setup budget after two posted invoices; PO invoice list ≥ 2 | **PASS** |
| Payment idempotency | Duplicate payment request rejected / no double-apply | **PASS** |

Posting for committed-budget scenario uses **explicit `budgetId` via API** so allocation is deterministic in a shared dev database; UI still validates post-before-pay messaging on invoice A.

---

## 3. Inventory Playwright (`e2e/wave3-inventory.spec.ts`)

```powershell
npx playwright test e2e/wave3-inventory.spec.ts --project=chromium-desktop --retries=0
```

| Check | Result |
|---|---|
| Asset vs non-asset selection on `/assets/new` | **PASS** |
| Non-asset creation (API + UI form with `stockReceivedDate`) | **PASS** |
| Measurement units (e.g. FEET) | **PASS** |
| Quantity persistence on detail | **PASS** |
| Purchase-order association on detail | **PASS** |
| Stock received date on detail | **PASS** |
| Detail page rendering | **PASS** |
| Non-asset in inventory list | **PASS** |
| Serialized asset tab still available | **PASS** |

Frontend proxy: `apps/web/.env.local` → `ITDMS_API_URL=http://127.0.0.1:3000` (latest API build).

---

## 4. Backup and restore

**Rotation (does not modify production/staging naming; uses isolated directory):**

```powershell
cd D:\ITDM-Sale-Management
$env:DATABASE_URL="postgresql://itdms:itdms_dev_password@127.0.0.1:5433/itdms_dev?schema=public"
$env:ITDMS_BACKUP_RETAIN_LOCAL="2"
node scripts/verify-backup-rotation.mjs
```

Result (2026-11-03):

```json
{"event":"rotation_verify_complete","retainLocal":2,"manifestsAfterFirst":2,"manifestsAfterSecond":2,"ok":true}
```

Observed: second backup emitted `backup_rotation_pruned` for older manifest; **two** manifest generations retained. SQL dumps written under `backups-rotation-test/` (`pgDumpMode: docker_exec`). Manifest includes database dump metadata; `storageFileCount: 0` for this run (document files on disk may still be verified separately on restore).

**Isolated restore:**

```powershell
node scripts/restore-rehearsal.mjs backups-rotation-test/itdms-db-2026-11-03T11-12-00-673Z.sql
```

Result:

```json
{
  "event": "restore_rehearsal_complete",
  "restoreDatabase": "itdms_restore_test",
  "sourceDevDatabaseUntouched": "itdms_dev",
  "rowCounts": { "non_asset_stock_items": 14, "...": "..." },
  "documentFilesMissing": 7,
  "note": "Missing files: often test uploads in storage-test while backup omits files, or pre-existing orphan metadata in shared itdms_dev"
}
```

Rotation runs only after successful backup (`backup_complete` before `backup_rotation_pruned`). Source **`itdms_dev`** and primary storage were not replaced by restore.

---

## 5. Full regression (2026-11-03 gate)

| Command / suite | Count / outcome |
|---|---|
| `apps/api` — `npm run lint` | PASS |
| `apps/api` — `npm run typecheck` | PASS |
| `apps/api` — `npm run build` | PASS |
| `apps/api` — `npm test` (`itdms_test`) | **66 passed**, 24 files |
| `apps/web` — typecheck, lint | PASS |
| `apps/web` — `npm test` (Vitest) | **43 passed**, 9 files |
| `apps/web` — `npm run build` | PASS |
| Playwright Wave 3 finance + inventory | **13 passed** (see §2–3) |
| Security-related API tests | Included in suite — e.g. `security-hardening.test.ts`, `document-security.test.ts`, `rbac-isolation.test.ts` — **PASS** |
| `lifecycle-connected.spec.ts` (Wave 2 fix) | Post-before-pay — retained in repo; not re-run in this gate slice |

CSRF, sessions, RBAC, financial invariants, CRM layouts, and ORLEN branding: **no weakening** in this wave; changes limited to verification harnesses and non-asset metadata.

---

## 6. Wave 2 verification (Phase A) — superseded by gate

Earlier session notes (5/6 finance before budget-allocation fix) are **superseded** by §2 results above.

---

## 7. Asset inventory (preserved)

- Serialized assets: unique manual `asset_code`, lifecycle, PO lines, issuance/return — **unchanged**
- Register flow on `/assets/new` → **Serialized asset** tab unchanged

---

## 8. Non-asset inventory (Wave 3 enhancements)

**Migration:** `20261103170000_wave3_non_asset_inventory`

| Field | Purpose |
|---|---|
| `item_type` | Client classification (optional) |
| `purchase_order_id` | Optional PO link |
| `stock_received_date` | Stock entry date (defaults from create; backfilled from `created_at`) |

**API behavior:**

- `quantityAvailable` = `quantityOnHand` — **no consumption/withdrawal** (D09)
- Units: `EACH`, `FEET`, `KILOGRAM`, `METER`, `LITER`, `BOX`, `PACK`, `OTHER`
- GET list/detail includes PO summary when linked

**Frontend:**

- `/assets/new` — Asset vs Non-asset tabs; PO, item type, received date
- `/assets` — non-asset list with links to detail
- `/assets/non-asset/[id]` — detail with quantities, PO link, metadata

**API integration:** `apps/api/tests/http/non-asset-stock.test.ts` — **3/3** (includes optional PO link case).

---

## 9. Remaining client-dependent work

**Finance (from Wave 2):**

- Final `remainingUsd` formula (committed vs actual vs manual ledger)
- Non-USD commitment/allocation USD without manual rates
- Credits, reversals, FX revaluation

**Inventory (D09):**

- Consumption, withdrawal, replenishment, department issue of non-asset qty
- Whether `available` should diverge from on-hand after movements

**Operations:**

- D17 weekly Task Scheduler on client host, RPO/RTO sign-off
- Official report templates (D12)
- Backup manifest currently emphasizes DB dump in local gate runs; full document archive parity for production RPO still client-owned

---

## 10. Release stance

Wave 3 adds **verification harnesses** and **non-asset metadata/detail** without inventing movement or finance policies.

**Production-ready: NO** — client UAT not started; provisional financial notices remain.

---

## 11. Related documents

- [`CLIENT_APPROVED_WAVE2_REPORT.md`](./CLIENT_APPROVED_WAVE2_REPORT.md)
- [`../production/FINANCIAL_RULES_VERIFICATION.md`](../production/FINANCIAL_RULES_VERIFICATION.md)
- [`../production/WEEKLY_BACKUP_POLICY.md`](../production/WEEKLY_BACKUP_POLICY.md)
