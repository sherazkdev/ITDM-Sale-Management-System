# Windows standalone deployment — requirements checklist (Wave 1)

**Client confirmation:** Initial host is **Windows 10/11**, Core i5 (10th gen), **16 GB RAM**, **1 TB SSD**, **standalone** (no company LAN initially); domain/LAN later after approval.

**Scope:** Preparation only — **no deployment to client hardware** in this phase.

## Assumptions

- Docker Desktop is **not** assumed available.
- ITDMS runs as **Node.js** services on localhost or loopback with a reverse proxy optional later.

## Prerequisites

| Item | Notes |
|------|--------|
| Windows 10/11 Pro or Enterprise | 64-bit |
| Node.js LTS (20.x+) | Match repo `.nvmrc` / CI if present |
| PostgreSQL 15+ | Local install or portable bundle; port documented (dev uses **5433** in `.env.example`) |
| Git (optional) | For updates/patches |
| TLS certificate | Localhost: dev HTTP acceptable; production LAN needs IT-approved TLS |
| Antivirus exclusions | Document storage + PostgreSQL data dirs (coordinate with IT policy) |

## Services

| Service | Default | Persistence |
|---------|---------|-------------|
| `@itdms/api` | `PORT=3000` | `.env`, session secret, DB |
| `@itdms/web` | Next `3011` or IIS reverse proxy | `.env.local`, `ITDMS_API_URL` |
| PostgreSQL | `127.0.0.1:5433` | Dedicated data directory on SSD |
| File uploads | `apps/api/storage/private` | Must backup with DB (**D17** pending) |

## Startup strategy (recommended)

1. Windows Service or **NSSM** / Task Scheduler at boot: PostgreSQL (if not Windows service) → API → Web (`next start`).
2. Health check: `GET /api/v1/health` before marking stack up.
3. Log rotation: API stdout + Next logs under `%ProgramData%\ITDMS\logs` (path TBD with client).

## Backup (engineering scripts exist; policy pending D17)

- `npm run backup:itdms` / `backup:db` from repo root — schedule via Task Scheduler once retention/overwrite approved.
- Store copies on **second media** or offline copy when LAN storage approved.

## Security (standalone)

- Bind API to `127.0.0.1` unless LAN access required.
- Strong `SESSION_SECRET`; rotate seed admin password immediately.
- CSRF + session cookies unchanged — do not disable.
- Firewall: block inbound except approved LAN segment later.

## Later LAN/domain integration (out of Wave 1)

- Active Directory / SSO (**D02**).
- Internal DNS name and TLS.
- Central backup share (**D17**).

See: `STAGING_DEPLOYMENT_RUNBOOK.md`, `PHASE05_PRE_UAT_REPORT.md`.
