# Staging Final Verification (Phase 04B)

**Date:** 2026-11-03  
**Scope:** Local isolated staging only (`itdms_staging`, `:5434`, API `:3002`, web `:3011`, `storage-staging/`)  
**Client UAT / LAN deploy:** **NOT executed**

---

## 1. Verdict

| Area | Status |
|---|---|
| Full stack (Next production + Express strict API) | **VERIFIED** |
| Module navigation (26 static routes) | **VERIFIED** (Playwright) |
| Security (CSRF, session, read-only API RBAC) | **VERIFIED** |
| Postgres persistence across container restart | **VERIFIED** |
| Readiness when DB down | **VERIFIED** (HTTP **503**) |
| Document upload persistence across DB restart | **NOT TESTED** (no staging upload in this gate) |
| Real LAN nginx + TLS | **NOT TESTED** (config review only) |
| Client UAT (18 cases) | **NOT EXECUTED** |

**Final local staging readiness:** **VERIFIED** for UAT **preparation**.  
**Production / client LAN:** **BLOCKED** (D17, D01, UAT sign-off).

---

## 2. Commands executed

```text
Remove-Item apps/web/.next -Recurse -Force
$env:ITDMS_API_URL="http://127.0.0.1:3002"; npm run build:web
# API: node dist/index.js with apps/api/.env.staging (port 3002)
# Web: npm run start with ITDMS_API_URL=http://127.0.0.1:3002 (port 3011)
$env:STAGING_E2E_SKIP_WEBSERVER="1"; npx playwright test --config playwright.config.staging.ts
node scripts/staging-persistence.mjs
node scripts/staging-smoke.mjs
docker stop itdms-postgres-staging → GET /health/ready → 503 → docker start
```

---

## 3. Browser / integration results

**Playwright:** `apps/web/e2e/staging-verification.spec.ts` — **2/2 pass**

| Test | Result |
|---|---|
| `uat.admin` login, all `STATIC_APP_ROUTES`, reload session, sign out | **Pass** (~9s) |
| `uat.reader` POST `/api/v1/employees` via proxy | **403 Pass** |

Routes exercised include: dashboard, employees, vendors, assets, contracts, POs, issuance, invoices, budgets, maintenance, licenses, search, documents, reports, notifications, admin, audit.

**Note:** Read-only user can still **navigate** to some write URLs in the UI; **API correctly denies** mutations. Treat as **PARTIAL** UI guard until D01 role UX is approved (not changed in 04B).

Screenshots on failure: `apps/web/test-results/` (Playwright default).

---

## 4. Security verification

| Check | Evidence |
|---|---|
| `ITDMS_STAGING_STRICT=1` | `.env.staging` |
| CSRF on mutations | Smoke + Playwright proxy POST includes header; smoke 403 without |
| Cookie session | Login / me / logout in Playwright |
| Read-only role | `uat.reader` → **403** on employee create |
| PROPOSED roles | `uat_*_proposed` — **not** client-approved (D01) |
| CSRF disable | Blocked at startup (`env-staging.test.ts` from Phase 04) |

Cross-origin browser attack: **NOT re-tested** in browser (CORS set to `http://127.0.0.1:3011` for direct API calls; app uses same-origin `/api/v1` proxy).

---

## 5. Persistence verification

```json
{
  "ok": true,
  "vendorCountBefore": 1,
  "vendorCountAfterRestart": 2,
  "postgresRestart": "itdms-postgres-staging"
}
```

- Docker volume **not** removed.
- API reconnected after Postgres restart (`/health/ready` **200** after smoke retry).

---

## 6. Credential safety

- **`STAGING_CREDENTIAL_ROTATION.md`** added; UAT checklist no longer lists literal passwords.
- `.env.staging` gitignored; seed defaults in code documented as **local fixtures only**.

---

## 7. Nginx configuration review (NOT TESTED on LAN)

File: `deploy/nginx.staging.example.conf`

| Item | Assessment |
|---|---|
| API upstream `:3002` | OK |
| Web upstream `:3011` | OK (updated in 04B) |
| `client_max_body_size 12m` | Aligns with proxy/API limits |
| `X-Forwarded-*` / `X-Real-IP` | Present for `ITDMS_TRUST_PROXY=1` |
| TLS + cookies | Requires `Secure` cookies when `NODE_ENV=production` — **verify on real HTTPS host** |
| Timeouts | **NOT SET** — recommend IT defaults (e.g. 60s read) |
| Host/Origin validation | **NOT in nginx** — relies on app CSRF/CORS |

---

## 8. Bugs found and fixed (04B)

| Issue | Fix |
|---|---|
| Playwright reader test expected UI route block | Test API **403** via Next proxy + CSRF header |
| CORS example pointed to `:3012` | Updated to `:3011` |
| nginx upstream port mismatch | Updated to `:3011` |
| UAT checklist contained default passwords | Moved to rotation doc |

---

## 9. Remaining client-dependent blockers

Unchanged from `RELEASE_BLOCKERS.md`: D01, D03, D06–D08, D12, D17, UAT sign-off, LAN deployment.

---

## 10. Recommended next steps

1. Deploy staging on company LAN per `STAGING_DEPLOYMENT_RUNBOOK.md`.  
2. Rotate UAT credentials (`STAGING_CREDENTIAL_ROTATION.md`).  
3. Run coordinated backup including `storage-staging` before UAT.  
4. Execute `UAT_EXECUTION_CHECKLIST.md` with client users.

**Stop gate:** Phase 04B complete.
