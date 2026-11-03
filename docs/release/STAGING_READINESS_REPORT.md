# Staging Readiness Report (Phase 04)

**Date:** 2026-11-03  
**Scope:** Local staging infrastructure rehearsal — **not** client server deployment  
**UAT / production:** **NOT executed**

---

## 1. Executive summary

Phase 04 prepared an **isolated local staging stack** (Postgres `:5434`, `itdms_staging`, `storage-staging`, production-like API env with `ITDMS_STAGING_STRICT`), runbooks, UAT execution checklist, and verification smoke tests. Phase 01 security controls are preserved; CSRF bypass **fails startup** in staging-strict mode.

**Staging readiness verdict (local engineering):** **VERIFIED** for UAT preparation (Phase 04 + **04B**).  
**Client LAN staging / production:** **BLOCKED** on D17 infrastructure decisions and client UAT.

**Phase 04B addendum:** Full Next.js production build on **:3011**, Playwright staging suite **2/2**, Postgres restart persistence, readiness **503** when DB stopped — see `STAGING_FINAL_VERIFICATION.md`.

---

## 2. Architecture delivered

| Artifact | Purpose |
|---|---|
| `docker-compose.staging.yml` | Dedicated Postgres + volume `itdms_staging_pg_data` |
| `apps/api/.env.staging.example` | Single `STORAGE_ROOT`, strict secrets, staging DB URL |
| `apps/web/.env.staging.example` | API URL for staging web |
| `deploy/nginx.staging.example.conf` | TLS reverse proxy pattern |
| `prisma/seed-staging-uat.ts` | PROPOSED UAT users (not dev seed) |
| `scripts/staging-init.mjs` | Compose, backup, migrate, optional UAT seed |
| `scripts/staging-smoke.mjs` | Health, auth, CSRF, workflow checks |

### Environment isolation

| Environment | Database | Storage |
|---|---|---|
| Development | `itdms_dev` :5433 | `./storage` |
| Automated tests | `itdms_test` :5433 | `./storage-test` |
| **Staging (local)** | **`itdms_staging` :5434** | **`./storage-staging`** |

Orphan `itdms_dev` document rows were **not** deleted (Phase 03 rule).

---

## 3. Security (Phase 01 preserved)

| Control | Staging configuration | Verified |
|---|---|---|
| `ITDMS_STAGING_STRICT=1` | `.env.staging.example` | Yes |
| `ITDMS_DISABLE_CSRF=1` | Startup **rejected** | `env-staging.test.ts` |
| `SESSION_SECRET` ≥ 32 | Required in strict mode | Yes |
| CSRF on mutations | Smoke: 403 without header | **Pass** |
| Rate limits | Unchanged middleware | Not re-benchmarked |
| `ITDMS_TRUST_PROXY` | Optional for nginx example | Documented |
| Cookie / secure flag | `NODE_ENV=production` on staging API | Active when HTTPS fronted |

---

## 4. Database & migrations

| Step | Result (2026-11-03) |
|---|---|
| `npm run staging:init` | **OK** |
| Migrations applied | 5/5 on `itdms_staging` |
| Dev `prisma db seed` on staging | **Not run** (by design) |
| UAT fixtures | `seed-staging-uat.ts` when `ITDMS_STAGING_SEED_UAT=1` |
| Pre-migrate backup | `backups/staging/itdms-db-*.sql` |

Rollback: see `STAGING_DEPLOYMENT_RUNBOOK.md` §9.

---

## 5. Backup / restore (staging)

| Check | Status |
|---|---|
| Staging backup during init | **VERIFIED** |
| Coordinated file backup | Script supports `ITDMS_BACKUP_INCLUDE_STORAGE=1` — **NOT RUN** in gate (empty storage) |
| D17 retention/RPO/RTO | **BLOCKED** — not invented |
| Unattended production jobs | **NOT enabled** |

---

## 6. Staging verification evidence

### 6.1 Commands

| Command | Result |
|---|---|
| `npm run staging:init` | OK |
| `npm run build:api` | OK |
| Staging API `node dist/index.js` + `.env.staging` | Listening **:3002**, `nodeEnv=production` |
| `npm run staging:smoke` | **7/7 checks pass** (see JSON below) |
| `verify-document-integrity.mjs` (staging) | **0 docs / 0 missing** (clean staging) |
| `tests/unit/env-staging.test.ts` | **2/2 pass** |
| `npm run typecheck` | **Pass** (incl. `env-staging.test.ts`; pg test shim) |

### 6.2 Staging smoke summary

```json
{ "ok": true, "base": "http://127.0.0.1:3002" }
```

Checks: health live/ready, login `uat.admin`, `/auth/me`, CSRF 403, vendor create 201, invalid document owner rejected.

### 6.3 Not tested in this gate

| Item | Status |
|---|---|
| Full Next.js staging stack end-to-end | **NOT TESTED** (API smoke only; web start documented in runbook) |
| Postgres persistence across container restart | **NOT TESTED** |
| nginx TLS on real LAN host | **NOT TESTED** |
| Client UAT 18 cases | **NOT EXECUTED** |

---

## 7. UAT readiness

| Deliverable | Location |
|---|---|
| 18 test cases | `CLIENT_UAT_TEST_PLAN.md` |
| Execution checklist + sign-off template | `UAT_EXECUTION_CHECKLIST.md` |
| PROPOSED accounts | `uat.admin`, `uat.reader` (rotate before UAT) |

**Client acceptance:** **NOT CLAIMED**

---

## 8. Unresolved infrastructure decisions

| Topic | Owner |
|---|---|
| Production/staging hostname & DNS | Client IT (D17) |
| TLS certificate source | Client IT |
| Final OS / hardware | Client IT |
| Backup destination & schedule | Client (D17) |
| LDAP/SSO (D02) | Client |

---

## 9. Client decision boundaries

No unapproved PO approval, budget posting, official templates, department issuance, consumable inventory, or final role matrix was implemented (unchanged from Phase 03).

---

## 10. Release blockers (unchanged)

See `RELEASE_BLOCKERS.md` — production release remains **NOT APPROVED**.

---

## 11. Phase 04 stop gate

Phase 04 **complete**. Phase **04B** final integration verification **complete** — see `STAGING_FINAL_VERIFICATION.md`.

**Recommended next steps:**

1. IT deploy staging on LAN using runbook + nginx example.  
2. Client workshop on D01, D03, D06–D08, D12, D17.  
3. Execute UAT checklist with rotated credentials.  
4. Coordinated backup drill on staging with `ITDMS_BACKUP_INCLUDE_STORAGE=1`.

---

## 12. References

- `STAGING_DEPLOYMENT_RUNBOOK.md`
- `UAT_EXECUTION_CHECKLIST.md`
- `PHASE03_READINESS_REPORT.md`
- `STAGING_FINAL_VERIFICATION.md`
- `STAGING_CREDENTIAL_ROTATION.md`
