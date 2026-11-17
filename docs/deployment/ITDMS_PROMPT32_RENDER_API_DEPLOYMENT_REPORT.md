# ITDMS Prompt #32 — Render API deployment report

**Date:** 2026-11-17  
**Repository remote HEAD:** `3d68e2d` (public GitHub — Render deploy commit pushed)  
**Neon demo DB:** `itdms_demo` @ `itdms-client-demo` (Prompt #31 — unchanged, no reseed)

---

## FINAL STATUS

| Field | Status |
|-------|--------|
| **RENDER API DEPLOYMENT** | **PARTIAL** — deploy commit `3d68e2d` on GitHub; **service not created in agent session** (complete dashboard steps locally) |
| **FREE PLAN** | **CONFIRMED** in `render.yaml` (`plan: free`) — pending user selection in dashboard |
| **API HTTPS URL** | **NOT CREATED** |
| **HEALTH CHECK** | **NOT RUN** (hosted) |
| **NEON CONNECTION** | **PASS** locally via pooled URL in prepared bundle (not exposed here) |
| **AUTHENTICATION** | **PARTIAL** — smoke script ready; hosted login **not run** |
| **FINANCE RBAC** | **NOT RUN** (hosted) |
| **OFFICIAL XLSX** | **BLOCKED** until Render **Secret File** upload (templates ~55 KB each; too large for env Base64) |
| **NOTIFICATION SCHEDULER** | **MANUAL DEMO** — `POST /api/v1/internal/jobs/expiry/run` + `jobs.run` |
| **PERSISTENT FILE UPLOADS** | **LIMITED** (`STORAGE_ROOT=/tmp/itdms-storage`) |
| **CLIENT DATA IMPORTED** | **NO** |
| **NETLIFY DEPLOYMENT** | **NOT DONE** |
| **PRODUCTION DEPLOYMENT** | **NOT DONE** |
| **NEXT STEP** | Prompt #33 — Netlify; operator steps in `ITDMS_PROMPT32_RENDER_DASHBOARD_STEPS.md` |

---

## Render

| Item | Value |
|------|--------|
| Service created | **NO** — dashboard reached login wall |
| Service plan (target) | Free |
| Region (blueprint default) | Oregon |
| Public API URL | Not created |
| Build command (verified from repo) | `npm ci && npm run build --workspace=@itdms/api && npm exec -w @itdms/api -- prisma generate` |
| Start command | `cd apps/api && node dist/index.js` |
| Health check path | `/api/v1/health/live` |
| Root directory | `.` (monorepo workspaces + root `package-lock.json`) |
| Node | `>=20` (root `package.json` engines) |
| Build result (local) | **PASS** — `npm run build --workspace=@itdms/api` |
| Startup result (hosted) | Not run |
| Health result (hosted) | Not run |

### Blueprint / stability

- `render.yaml` updated: `itdms-demo-api`, public GitHub repo URL, `autoDeploy: false` for UAT stability.
- Disable auto-deploy in UI until secrets + Secret Files are configured.

---

## Neon

| Item | Value |
|------|--------|
| Existing database connected | Prepared in `deploy/free-tier/.env.render.local` (pooled URL) |
| Database name | `itdms_demo` |
| Migrations intact | **YES** (14/14 — not rerun on startup) |
| Demo records preserved | **YES** — no reset/reseed in this prompt |
| SSL / pool | Pooled URL for runtime; Prisma 6.8.2 single `DATABASE_URL` (no `directUrl`) |

---

## Security

| Item | Assessment |
|------|------------|
| Session configuration | `SESSION_SECRET` ≥ 32 chars with `ITDMS_STAGING_STRICT=1`; new secret generated into **gitignored** `.env.render.local` only |
| Cookies | HttpOnly, `SameSite=Lax`, `Secure` when `NODE_ENV=production`; `ITDMS_TRUST_PROXY=1` on Render |
| CORS | **Not enabled** unless `CORS_ORIGIN` set — correct for Netlify same-origin proxy |
| RBAC | Unchanged application code |
| Scheduler | Authenticated + `jobs.run` — not exposed anonymously |
| Secret exposure | No URLs/passwords in this report or git |
| Official XLSX | **Secret Files** required; SHA-256 metadata in `deploy/free-tier/render-template-hashes.json` (gitignored) |
| Template bootstrap | Optional `ITDMS_*_TEMPLATE_B64` + path verify at startup (`official-templates-bootstrap.ts`) — Secret Files preferred |

### Environment variable matrix (Render)

| Variable | Required | Secret | Notes |
|----------|----------|--------|-------|
| `DATABASE_URL` | Yes | Yes | Neon **pooled**, `itdms_demo` |
| `SESSION_SECRET` | Yes | Yes | Demo-only, ≥ 32 chars |
| `NODE_ENV` | Yes | No | `production` |
| `ITDMS_STAGING_STRICT` | Yes | No | `1` |
| `ITDMS_TRUST_PROXY` | Yes | No | `1` |
| `HOST` | Yes | No | `0.0.0.0` |
| `PORT` | Auto | No | Injected by Render |
| `STORAGE_ROOT` | Yes | No | `/tmp/itdms-storage` |
| `ITDMS_ISSUANCE_TEMPLATE_PATH` | For official XLSX | Path | `/etc/secrets/Issuance.xlsx` |
| `ITDMS_RETURN_TEMPLATE_PATH` | For official XLSX | Path | `/etc/secrets/Return.xlsx` |
| `LOG_LEVEL` | No | No | `info` |
| `NOTIFICATION_LEAD_DAYS` | No | No | `60` |
| `CORS_ORIGIN` | No | No | Omit when using Netlify proxy |

---

## Verification

| Test | Result |
|------|--------|
| Local API TypeScript build | **PASS** |
| `render-prompt32-prepare.ps1` | **PASS** — `.env.render.local` + template hashes |
| Hosted HTTPS `/health/live` | **NOT RUN** |
| Hosted `/health/ready` | **NOT RUN** |
| Hosted login + module smoke | **NOT RUN** — use `scripts/cloud/render-api-smoke.mjs` after deploy |
| Browser cookie / UI flows | **BLOCKED** until Netlify (Prompt #33) |
| Cold start | Documented — Render Free sleep (~15 min idle) |

---

## Official XLSX (Phase 6)

| File | Size | SHA-256 (integrity check after upload) |
|------|-----:|----------------------------------------|
| `Issuance.xlsx` | 55,286 | `ffc26c2f62b6fb8539f86b16517ea33bab458e9c9d73bd7b0ed894da19caeda4` |
| `Return.xlsx` | 55,273 | `d1dc5237d54fbd070d4073c340090849069dba6f3c54fe8942d9552093f7750d` |

Local source (not in git): `storage/client-templates/`. Upload via Render **Secret Files** — do not commit or Base64 in GitHub.

---

## Git

### Uncommitted work classification (preserved)

| Category | Examples |
|----------|----------|
| **Required for Render (candidate commit)** | `render.yaml`, `apps/api/src/server.ts`, `apps/api/src/shared/bootstrap/official-templates-bootstrap.ts`, `deploy/free-tier/env.api.demo.example`, `scripts/cloud/render-api-smoke.mjs`, `scripts/windows/render-prompt32-prepare.ps1`, `docs/deployment/ITDMS_PROMPT32_*` |
| **Local-only DB tools (Prompt #31)** | `scripts/windows/neon-prompt31-*.ps1`, `apps/api/prisma/verify-neon-demo.ts`, `seed-neon-demo-tail.ts`, `seed-client-walkthrough.ts` demo guard |
| **Documentation** | `ITDMS_PROMPT31_NEON_DATABASE_REPORT.md`, Prompt #32 docs |
| **Credentials / sensitive** | `.env.neon.local`, `.env.render.local`, `neon-project-create.json`, template hashes bundle |
| **Unrelated** | Screenshot PNGs, `_tmp_*` logs, client PDFs |

| Item | Value |
|------|--------|
| Reviewed local commit | **`3d68e2d`** — `chore(deploy): add Render Free API bootstrap and smoke tooling` |
| Remote HEAD | `3d68e2d` |
| Additional GitHub push | **Done** (focused Render artifacts only) |

---

## Next stage — Netlify readiness

After Render service exists:

1. Copy **HTTPS origin** (e.g. `https://itdms-demo-api.onrender.com`) into Netlify `ITDMS_API_URL` (Prompt #33).
2. Keep demo admin credentials in operator vault only (`demo.admin` + password from `.env.neon.local`).
3. Re-run smoke: `RENDER_API_URL` + `render-api-smoke.mjs`.

---

## Operator blocker

**Render Dashboard authentication required.** Sign in at [dashboard.render.com](https://dashboard.render.com/) (GitHub recommended), then follow `ITDMS_PROMPT32_RENDER_DASHBOARD_STEPS.md`.

After login, create the Free Web Service and manual deploy. Reply when the service URL exists to run hosted verification in a follow-up.