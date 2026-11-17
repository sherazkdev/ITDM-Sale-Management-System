# Free tier limitations (client expectations)

## Render Free (API)

- **Sleep after ~15 min inactivity** — first request after idle may take 30–90+ seconds.
- **Ephemeral disk** — `STORAGE_ROOT` uploads and temp exports **do not persist** across deploys/restarts.
- **No always-on worker** — expiry notification scan is **not** scheduled automatically.
- **Memory/CPU caps** — large Excel generation or heavy dashboards may timeout; demo with modest data sets.

**Do not** use aggressive uptime pings to defeat sleep (violates provider intent).

## Neon Free

- Connection limits and storage caps — use Prisma pool-friendly URL.
- Branch/project must be **dedicated demo** — not shared with LAN production.

## Netlify Free

- Build minutes and bandwidth limits.
- Next.js SSR supported via official plugin — not static export.
- Serverless function limits apply to API route proxy; heavy file uploads may hit payload limits (12 MB proxy cap in route handler).

## Feature status on free demo

| Capability | Demo status |
|------------|-------------|
| Core CRUD workflows | **Expected READY** after deploy |
| Session auth via proxy | **READY** (architecture validated locally) |
| Official client XLSX | **READY only if** Secret Files provisioned — else **BLOCKED** |
| Scheduled expiry notifications | **LIMITED** — manual `POST /api/v1/internal/jobs/expiry/run` |
| Persistent document uploads | **LIMITED** — ephemeral disk |
| 24/7 availability | **NOT GUARANTEED** |
| LAN-only client requirement | **Differs** — cloud demo is temporary UAT, not approved internal hosting |

## vs client LAN deployment

Original client target: internal Windows + PostgreSQL on LAN. Cloud demo validates **application behavior** for UAT feedback; **production** still requires client PC checklist, backups, and local templates.