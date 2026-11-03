# ITDMS — Performance & Reliability Report (Production Hardening Phase 02)

**Date:** 2026-11-03  
**Scope:** PostgreSQL query paths, API latency baseline, concurrency integrity, operational reliability  
**Environment:** Docker Postgres `127.0.0.1:5433` / `itdms_dev`, API on `localhost:3000`, ~175 assets / ~159 POs in dev DB  
**Deployment:** **NOT performed**

---

## 1. Executive summary

Phase 02 audited existing implementation (P00–P19, Phase 01 security), added **evidence-based B-tree indexes**, hardened **backup tooling**, executed an **isolated restore rehearsal**, captured **EXPLAIN ANALYZE** plans and a **local API latency baseline**, and extended regression tests. Security Phase 01 controls were **not weakened**.

**Phase 02 engineering verdict:** **VERIFIED** for performance/reliability work in scope.  
**Production DR readiness:** **PARTIAL** — restore drill succeeded on isolated DB; **RPO/RTO, retention, schedule, and offsite copy remain client decisions (D17)**. Point-in-time recovery **NOT IMPLEMENTED**.

---

## 2. Initial risk inventory (audit)

| ID | Area | Risk | Severity | Phase 02 action |
|---|---|---|---|---|
| R-P02-01 | Reports API | `ReportService` loads full `assets`, `invoices`, etc. without pagination | Medium at scale | Documented; no business change |
| R-P02-02 | PO/asset search | `ILIKE '%term%'` cannot use B-tree; planner scans via PK on small data | Medium at scale | Recommend `pg_trgm` when row counts grow |
| R-P02-03 | Expiry scan | Range filters on `contracts.expiry_date`, `valid_until` | Medium | **Indexes added** |
| R-P02-04 | Notifications | Unread filter `read_at IS NULL` | Low–Med | **Index on `read_at`** — Index Only Scan verified |
| R-P02-05 | Dashboard | Multiple `groupBy` on status fields | Low | **Indexes on status columns** |
| R-P02-06 | Search by PO | Deep `include` graph (by design) | Low on single PO | Bounded sub-queries (500/200 caps) already present |
| R-P02-07 | Connection pool | Default Prisma pool; no custom limit in code | Low | Document; tune via `DATABASE_URL` params in prod |
| R-P02-08 | Backup | Minimal `backup-db.mjs`; no manifest or file scope | High ops | **`backup-itdms.mjs` + restore rehearsal** |
| R-P02-09 | Docker volume | Not a substitute for logical backup | High ops | Documented in backup manifest |
| R-P02-10 | Rate limits | Shared LAN IP | Low | Unchanged; noted in Phase 01 |

---

## 3. Database optimizations

### 3.1 Migration applied

`20261103104500_phase02_query_indexes` — indexes on:

- `contracts(expiry_date)`
- `purchase_orders(status)`, `purchase_orders(valid_until)`
- `assets(asset_status)`
- `maintenance_records(status)`
- `notification_events(read_at)`
- `audit_logs(actor_user_id)`
- `invoices(payment_status)`

Command: `cd apps/api && npx prisma migrate deploy` — **OK**

### 3.2 EXPLAIN evidence

Full output: [`phase02-explain-plans.txt`](./phase02-explain-plans.txt)

| Query | After migration | Notes |
|---|---|---|
| Unread notification count | **Index Only Scan** on `notification_events_read_at_idx` | Clear win |
| Audit recent | **Index Scan** on `audit_logs_occurred_at_idx` | Already optimal |
| Contract expiry window | Seq Scan | Table ~89 rows; index present but planner prefers seq scan |
| Asset status groupBy | Seq Scan | Small table; index helps selective filters at scale |
| PO/asset ILIKE | Index Scan on PK + filter | Needs trigram at large scale |

Capture command: `npm run perf:explain`

---

## 4. API performance baseline (local, measured)

**Script:** `npm run perf:baseline`  
**Raw JSON:** [`phase02-perf-baseline.json`](./phase02-perf-baseline.json)  
**Conditions:** Authenticated session (`admin.dev`), CSRF header on requests, 25 iterations per endpoint, mixed read 12s @ concurrency 4.

| Endpoint | p50 (ms) | p95 (ms) | Errors |
|---|---|---|---|
| `/api/v1/health/ready` | 15.4 | 22.7 | 0 |
| `/api/v1/dashboard/summary` | 50.2 | 117.8 | 0 |
| `/api/v1/assets?page=1&pageSize=20` | 31.6 | 65.4 | 0 |
| `/api/v1/purchase-orders?page=1&pageSize=20` | 32.1 | 44.3 | 0 |
| `/api/v1/invoices?page=1&pageSize=20` | 31.1 | 38.8 | 0 |
| `/api/v1/notifications/unread-count` | 30.7 | 33.2 | 0 |

**Mixed read workload:** 472 requests / 12s ≈ **39.3 req/s**, p50 **46.5 ms**, p95 **75.0 ms**, **0 errors**.

**Limitations:** Single developer machine, warm local DB, not production hardware or dataset. **Do not extrapolate to company-server capacity.**

CPU/memory were not instrumented in this gate (no APM). Bottleneck on dashboard is likely multiple aggregate queries + audit fetch — acceptable at current scale.

---

## 5. Load and concurrency testing

| Test | Tool / location | Result |
|---|---|---|
| Mixed read load | `scripts/perf-baseline.mjs` | See §4 |
| Concurrent asset issue | `finance-and-concurrency.test.ts` | **Pass** (existing) |
| Payment idempotency / overpay | Same | **Pass** |
| Duplicate return | `phase02-reliability.test.ts` | **Pass** (409/422) |
| CSRF / rate limit regression | `phase02-security-regression.test.ts` | **Pass** |

No uncontrolled stress test; no financial mutation flood. Rate limits remained enabled.

---

## 6. Reliability and operational behavior

| Capability | Status | Evidence |
|---|---|---|
| DB readiness | Implemented | `GET /api/v1/health/ready` |
| Liveness | Implemented | `GET /api/v1/health/live` |
| Graceful shutdown | Implemented | `server.ts` SIGINT/SIGTERM → `server.close` → `disconnectPrisma` |
| Expiry scan idempotency | Implemented | `dedupeKey` unique + try/catch in `NotificationService` |
| Session/CSRF/rate limits | Unchanged | Phase 02 security tests |
| Structured logging | pino + redaction | Unchanged from Phase 01 |

**NOT TESTED in this gate:** deliberate Postgres outage while API running (would return 503 on `/ready` — code path reviewed, not live chaos test).

---

## 7. Security regression (Phase 01 preserved)

See `apps/api/tests/integration/phase02-security-regression.test.ts`:

- Cookie mutations without CSRF → **403**
- `NODE_ENV=test` does **not** disable CSRF
- Cross-origin mutation with session → **403**
- Login rate-limit headers present

---

## 8. Verification commands and results (2026-11-03)

| Command | Result |
|---|---|
| `npx prisma migrate deploy` | OK (5 migrations) |
| `npm run typecheck` | Pass |
| `npm run lint` | Pass |
| `npm run test --workspace=@itdms/api` | **56/56 pass** |
| `npm run test --workspace=@itdms/web` | **42/42 pass** |
| `npm run build:web` | Pass |
| Playwright `auth.spec.ts` + `workflows.spec.ts` | **7/7 pass** |
| `npm run perf:explain` | `phase02-explain-plans.txt` |
| `npm run perf:baseline` | `phase02-perf-baseline.json` |

---

## 9. Remaining risks and recommendations

1. **Report exports** — unbounded `findMany`; add pagination or streaming when row counts exceed low thousands (requires product approval).
2. **Text search** — add PostgreSQL `pg_trgm` GIN indexes when `ILIKE` search latency exceeds SLO.
3. **Dashboard p95 spikes** — monitor audit sub-query; consider capped `take` (already limited in service) and caching post-UAT.
4. **Prisma pool** — set connection limit for production via datasource URL.
5. **DR policy** — client must approve D17 (frequency, retention, offsite, RPO/RTO).

---

## 10. Client decisions (not invented)

| Decision | Status |
|---|---|
| D17 backup/restore policy | **PENDING** |
| Backup retention duration | **NOT SET** |
| Unattended production backup jobs | **NOT CONFIGURED** (by design this phase) |
| PITR / WAL archiving | **NOT IMPLEMENTED** |

---

## 11. Phase 02 readiness verdict

| Gate | Status |
|---|---|
| Query/index evidence | **VERIFIED** |
| Local performance baseline | **VERIFIED** (measured) |
| Concurrency / integrity tests | **VERIFIED** |
| Security regression | **VERIFIED** |
| Backup/restore drill | **VERIFIED** (see companion doc) |
| Production DR sign-off | **BLOCKED** on D17 |
| **Phase 02 overall** | **VERIFIED** (engineering) |

**Stop gate:** No deployment, no UAT Phase 03, no UI redesign.

---

## 12. References

- [`BACKUP_RESTORE_VERIFICATION.md`](./BACKUP_RESTORE_VERIFICATION.md)
- [`SECURITY_HARDENING_REPORT.md`](./SECURITY_HARDENING_REPORT.md)
- Scripts: `scripts/backup-itdms.mjs`, `scripts/restore-rehearsal.mjs`, `scripts/perf-baseline.mjs`, `scripts/explain-phase02.mjs`
