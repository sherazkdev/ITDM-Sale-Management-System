# Render Free API — operator dashboard steps (Prompt #32)

Use after local `render-prompt32-prepare.ps1` creates `deploy/free-tier/.env.render.local` (gitignored).

## 1. Git (public repo)

Remote `main` is at `bb667ce` until you approve a **focused deploy commit** (see Prompt #32 report). Either:

- Deploy from current `main` (no template bootstrap log), or
- Push approved commit containing `render.yaml`, template bootstrap, and smoke script first.

**Auto-deploy:** disable until env + secrets are set (`render.yaml` sets `autoDeploy: false` when using Blueprint).

## 2. Create Web Service

1. [Render Dashboard](https://dashboard.render.com/) → **New +** → **Web Service**.
2. Connect GitHub → `sherazkdev/ITDM-Sale-Management-System`.
3. **Branch:** `main`
4. **Name:** `itdms-demo-api`
5. **Region:** Oregon (or nearest free region)
6. **Instance type:** **Free**
7. **Root directory:** `.` (repository root)

### Build & start (from repo)

| Setting | Value |
|---------|--------|
| Build Command | `npm ci && npm run build --workspace=@itdms/api && npm exec -w @itdms/api -- prisma generate` |
| Start Command | `cd apps/api && node dist/index.js` |
| Health Check Path | `/api/v1/health/live` |

## 3. Environment variables

Copy key/value pairs from `deploy/free-tier/.env.render.local` into Render **Environment** (do not paste in chat).

Required (see `deploy/free-tier/env.api.demo.example`):

- `DATABASE_URL` — Neon **pooled** URL (`itdms_demo` only)
- `SESSION_SECRET` — new 48+ char secret (generated in `.env.render.local`)
- `NODE_ENV=production`
- `ITDMS_STAGING_STRICT=1`
- `ITDMS_TRUST_PROXY=1`
- `HOST=0.0.0.0`
- `STORAGE_ROOT=/tmp/itdms-storage`
- `LOG_LEVEL=info` (optional)
- `NOTIFICATION_LEAD_DAYS=60` (optional)

Do **not** set `CORS_ORIGIN` unless testing direct browser→API (Netlify proxy is preferred).

`PORT` is set by Render automatically.

## 4. Secret Files (official XLSX)

Upload from local paths (not in git):

- `storage/client-templates/Issuance.xlsx` (55,286 bytes, SHA-256 `ffc26c2f62b6fb8539f86b16517ea33bab458e9c9d73bd7b0ed894da19caeda4`)
- `storage/client-templates/Return.xlsx` (55,273 bytes, SHA-256 `d1dc5237d54fbd070d4073c340090849069dba6f3c54fe8942d9552093f7750d`)

Map in environment:

- `ITDMS_ISSUANCE_TEMPLATE_PATH=/etc/secrets/Issuance.xlsx`
- `ITDMS_RETURN_TEMPLATE_PATH=/etc/secrets/Return.xlsx`

Base64 env vars are **not** recommended (files exceed typical per-var size limits).

## 5. Deploy

1. Save environment → **Manual Deploy**.
2. Open **Logs** — expect `ITDMS API listening`.
3. Visit `https://<service>.onrender.com/api/v1/health/live` → 200.
4. Visit `.../api/v1/health/ready` → 200 with database healthy (Neon may wake on first hit).

## 6. Smoke test (local)

```powershell
$env:RENDER_API_URL = "https://<service>.onrender.com"
# Load admin password from deploy/free-tier/.env.neon.local (not committed)
$env:SEED_ADMIN_USERNAME = "demo.admin"
node scripts/cloud/render-api-smoke.mjs
```

## 7. Limitations (demo)

- Free tier **sleeps** after inactivity; first request may be slow.
- **No cron** — expiry job: `POST /api/v1/internal/jobs/expiry/run` with session + `jobs.run`.
- **Ephemeral disk** — uploads may not survive restart.
- Cookie/UI flows with HttpOnly session are **fully validated after Netlify** (Prompt #33).