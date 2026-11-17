# ITDMS hosted demo — security checklist

## Repository & secrets

- [ ] GitHub repository **Private**
- [ ] No `.env` committed; no Neon/Render tokens in git
- [ ] Client XLSX **not** in git (use Render Secret Files)
- [ ] `SESSION_SECRET` ≥ 32 chars, generated per environment
- [ ] Demo admin password set via env only — rotate after sharing with client
- [ ] No real employee/finance/client attachments on demo DB

## Transport & cookies

- [ ] HTTPS on Netlify and Render
- [ ] `ITDMS_TRUST_PROXY=1` on Render API
- [ ] Browser uses Netlify `/api/v1` proxy (no credentialed wildcard CORS)
- [ ] `SESSION_SECRET` never exposed via `NEXT_PUBLIC_*`

## Access control

- [ ] RBAC unchanged — demo users have least privilege roles
- [ ] Manager / IT Staff test accounts for finance RBAC demo (optional)
- [ ] `robots.txt` / noindex for demo site (Netlify headers) — **supplement**, not replace login
- [ ] No public listing of demo URL in README

## API hardening

- [ ] `ITDMS_STAGING_STRICT=1` on Render
- [ ] CSRF header required on mutations (default)
- [ ] Rate limiting active (default API middleware)
- [ ] Internal job routes require auth + `jobs.run` (expiry scan)

## Data isolation

- [ ] Neon DB dedicated to demo — never pointed at `itdms_dev`, `itdms_test`, `itdms_e2e`, or client LAN DB
- [ ] Seed only with `ITDMS_DEMO_DB_CONFIRM=1` script guard

## Environment variable matrix

| Variable | Service | Required | Purpose | Secret? | Placeholder | Provision |
|----------|---------|----------|---------|---------|-------------|-----------|
| `DATABASE_URL` | Render | Yes | Postgres | Yes | `postgresql://...@ep-xxx.neon.tech/itdms_demo?sslmode=require` | Neon dashboard |
| `SESSION_SECRET` | Render | Yes | Cookie signing | Yes | `<48-char base64>` | `openssl rand -base64 48` |
| `ITDMS_API_URL` | Netlify | Yes | SSR proxy target | No* | `https://xxx.onrender.com` | Render service URL |
| `NODE_ENV` | Render | Yes | production mode | No | `production` | Fixed |
| `ITDMS_STAGING_STRICT` | Render | Yes | strict secrets/CSRF | No | `1` | Fixed |
| `ITDMS_TRUST_PROXY` | Render | Yes | trust Render proxy | No | `1` | Fixed |
| `HOST` | Render | Yes | bind address | No | `0.0.0.0` | Fixed |
| `PORT` | Render | Auto | listen port | No | (Render injects) | Platform |
| `STORAGE_ROOT` | Render | Yes | uploads | No | `/tmp/itdms-storage` | Fixed path |
| `ITDMS_ISSUANCE_TEMPLATE_PATH` | Render | For XLSX | issuance template | File | `/etc/secrets/Issuance.xlsx` | Secret File |
| `ITDMS_RETURN_TEMPLATE_PATH` | Render | For XLSX | return template | File | `/etc/secrets/Return.xlsx` | Secret File |
| `SEED_ADMIN_PASSWORD` | Local/Neon seed | Seed only | bootstrap user | Yes | (not stored) | Operator |
| `CORS_ORIGIN` | Render | Optional | direct browser→API | No | Netlify URL | Only if skipping proxy |

\* `ITDMS_API_URL` is server-side on Netlify — not public env prefix; still do not log in client bundles.

## Logging

- [ ] Do not enable debug logging of cookies/headers in production
- [ ] Redaction remains in API pino config (default)