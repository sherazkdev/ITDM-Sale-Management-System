# ITDMS free-tier client demo architecture

**Purpose:** Temporary, access-controlled UAT — not production LAN deployment.

## Topology

| Layer | Provider | Role |
|-------|----------|------|
| Source | **GitHub (private)** | Monorepo `itdms` — `apps/api`, `apps/web` |
| Web | **Netlify Free** | Next.js 15 App Router, SSR, middleware auth |
| API | **Render Free Web Service** | Express `@itdms/api`, Prisma, PostgreSQL client |
| Database | **Neon Free** | Isolated `itdms_demo` (name arbitrary; never dev/test/e2e) |

## Request flow

1. Browser loads `https://<netlify-site>/...` (HTTPS).
2. Browser JavaScript calls **same-origin** `/api/v1/*` (see `apps/web/src/lib/api/client.ts`).
3. Next.js route handler `apps/web/src/app/api/v1/[...path]/route.ts` proxies to `ITDMS_API_URL` (Render).
4. Session cookie is **HttpOnly**, set on the **Netlify host** via proxied `Set-Cookie` from API.
5. Next **middleware** validates session by server-side `fetch` to Render `/api/v1/auth/me` with forwarded cookies (`ITDMS_API_URL`).

**Implication:** You normally **do not** need `CORS_ORIGIN` on Render when the browser only talks to Netlify. Do **not** point the browser at Render directly.

## Monorepo layout

- **Root:** `package.json` workspaces `apps/*`, Node **≥20**, `package-lock.json`.
- **API entry:** `apps/api/dist/index.js` ← `npm run build --workspace=@itdms/api`.
- **Web entry:** `apps/web` ← `npm run build --workspace=@itdms/web`.
- **Prisma:** `apps/api/prisma/schema.prisma`, migrations under `apps/api/prisma/migrations/` (includes `20261113153000_prompt25_notification_recipient`).

## Authentication

- HttpOnly session cookie (`SESSION_COOKIE_NAME`, default `itdms_session`).
- CSRF header `X-ITDMS-Requested-With: itdms` on mutations.
- Production strict mode: `ITDMS_STAGING_STRICT=1`, `SESSION_SECRET` ≥ 32 chars.
- Render: `ITDMS_TRUST_PROXY=1` for correct HTTPS/cookie behavior behind Render proxy.

## Filesystem (Render ephemeral)

- `STORAGE_ROOT` — uploads and generated exports (lost on cold start unless re-uploaded).
- Official XLSX — **not in git**; Render **Secret Files** → `ITDMS_*_TEMPLATE_PATH` (see security checklist).

## Notifications

- No background worker on free tier.
- Expiry scan: authenticated `POST /api/v1/internal/jobs/expiry/run` (`jobs.run` permission) — **manual** for demo (see limitations doc).

## Config artifacts (repo)

- `netlify.toml` — root install + web build + Next plugin.
- `render.yaml` — reference blueprint for API service.
- `deploy/free-tier/env.*.demo.example` — placeholder env matrix.
- `scripts/cloud/neon-migrate-deploy.sh`, `seed-neon-demo.sh` — isolated DB only.