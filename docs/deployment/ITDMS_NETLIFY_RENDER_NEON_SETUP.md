# Netlify + Render + Neon — manual setup (USER ACTIONS)

Use placeholders below; never paste real secrets into tickets or chat.

---

## A. GitHub (private)

1. **USER:** Create **Private** repository (empty or mirror).
2. **USER:** Verify **Settings → Danger Zone** — repository visibility **Private**.
3. Locally: ensure clean commit on `main` (Prompt #29 deploy prep).
4. **USER:** `git push -u origin main` (first push only after checklist).

---

## B. Neon (PostgreSQL demo)

1. **USER:** Create Neon project (Free), region near Render/Netlify users.
2. Create database e.g. `itdms_demo` (any name — **not** dev/test/e2e).
3. Copy:
   - **Pooled** connection string → Render `DATABASE_URL` (runtime).
   - **Direct** connection string → one-shot migrations (if Neon advises).
4. Append `?sslmode=require` if not present.
5. From operator machine (or Render shell **once**):

```bash
export DATABASE_URL='<NEON_DIRECT_OR_POOLED_URL>'
bash scripts/cloud/neon-migrate-deploy.sh
```

6. Seed (optional, synthetic only):

```bash
export ITDMS_DEMO_DB_CONFIRM=1
export DATABASE_URL='<NEON_URL>'
export SEED_ADMIN_USERNAME=demo.admin
export SEED_ADMIN_PASSWORD='<STRONG_DEMO_PASSWORD>'
export SEED_ADMIN_USERNAME=demo.admin  # seed.ts uses env
bash scripts/cloud/seed-neon-demo.sh
```

7. Verify: `npx prisma migrate status` (all applied, including `20261113153000_prompt25_notification_recipient`).

---

## C. Render (API Free Web Service)

1. **USER:** Render Dashboard → **New → Web Service** → connect **private GitHub** repo.
2. **Settings derived from repo:**

| Field | Value |
|-------|--------|
| Root Directory | `.` (repository root) |
| Runtime | Node |
| Build Command | `npm ci && npm run build --workspace=@itdms/api && npm exec -w @itdms/api -- prisma generate` |
| Start Command | `cd apps/api && node dist/index.js` |
| Health Check Path | `/api/v1/health/live` |
| Instance type | Free |

3. **Environment variables:** copy from `deploy/free-tier/env.api.demo.example` (fill secrets in dashboard).
4. **Secret Files (USER):** upload `Issuance.xlsx`, `Return.xlsx` → map paths in `ITDMS_ISSUANCE_TEMPLATE_PATH` / `ITDMS_RETURN_TEMPLATE_PATH`.
5. Deploy; open **Logs** — expect `ITDMS API listening`, no Prisma errors.
6. Curl (USER): `https://<render-host>/api/v1/health/ready` → 200 when DB up.

**Do not** enable cron/background workers on Free for expiry scan.

---

## D. Netlify (Next.js)

1. **USER:** Netlify → **Add site** → Import from Git (private repo).
2. Netlify reads `netlify.toml` at repo root:
   - Build: `npm ci && npm run build --workspace=@itdms/web`
   - Plugin: `@netlify/plugin-nextjs`
   - `NODE_VERSION=20`
3. **Site environment** (`deploy/free-tier/env.web.demo.example`):
   - `ITDMS_API_URL=https://<your-render-service>.onrender.com`
4. Deploy; open site `/login`.
5. **Smoke:** login → dashboard → one module page; check browser Network — API calls stay on **Netlify** `/api/v1/...`.

---

## Post-deploy order

1. Neon migrate ✓  
2. Neon seed (optional) ✓  
3. Render API ✓  
4. Netlify web with `ITDMS_API_URL` ✓  
5. Run `docs/deployment/ITDMS_HOSTED_UAT_SMOKE_TEST.md` (hosted — not local).