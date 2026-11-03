# Windows Standalone Installation Guide (ITDMS)

**Audience:** IT operator installing on the client PC (Core i5 10th Gen, 16 GB RAM, 1 TB SSD)  
**Scope:** Standalone operation without company LAN; domain/LAN later after approval  
**Status:** Preparation document — **not client acceptance**; **not production-ready**

---

## 1. What you are installing

| Component | Role |
|-----------|------|
| PostgreSQL 15+ | Application database |
| Node.js 20 LTS | Runs API (`@itdms/api`) and Web (`@itdms/web`) |
| ITDMS repository | Application source and scripts |
| File storage | Uploaded documents under configured `STORAGE_ROOT` |

**Not required:** Docker Desktop, continuous internet (after initial dependency install).

**Bundled/provisioned in advance (offline media recommended):**

- Node.js Windows installer (LTS 20.x or 22.x per org policy)
- PostgreSQL Windows installer (15 or 16) + optional Stack Builder tools
- ITDMS release folder (git clone or signed zip from IT)
- NSSM (optional) for Windows services — download separately if services are used

---

## 2. Directory layout (recommended)

```
D:\ITDMS\
  app\              ← git clone or release copy
  data\
    postgres\       ← PGDATA (configured during PostgreSQL install)
    storage\private\  ← STORAGE_ROOT for API
    backups\        ← BACKUP_DIR for scripts
  logs\             ← service stdout/stderr (NSSM or scheduled tasks)
  config\
    api.env         ← copy from deploy/windows/env.api.production.example
    web.env.local   ← copy from deploy/windows/env.web.production.example
```

Keep `config\` out of git; restrict ACLs to IT operators.

---

## 3. PostgreSQL

1. Install PostgreSQL for Windows; note **port** (default `5432` or dedicated e.g. `5433`).
2. Create role and database (example names — use client-approved credentials):

```sql
CREATE USER itdms_app WITH PASSWORD '…';  -- set via secure process, not in repo
CREATE DATABASE itdms_prod OWNER itdms_app;
```

3. Ensure PostgreSQL Windows service **Automatic** start.
4. Firewall: default **block inbound**; PostgreSQL listens on `127.0.0.1` only for standalone phase.

---

## 4. Node.js and application build

From an elevated or IT operator PowerShell:

```powershell
cd D:\ITDMS\app
.\scripts\windows\preflight-check.ps1

# Copy templates → real env files (edit secrets)
Copy-Item deploy\windows\env.api.production.example D:\ITDMS\config\api.env
Copy-Item deploy\windows\env.web.production.example D:\ITDMS\config\web.env.local
# Point STORAGE_ROOT and DATABASE_URL in api.env

Copy-Item D:\ITDMS\config\api.env apps\api\.env
Copy-Item D:\ITDMS\config\web.env.local apps\web\.env.local

.\scripts\windows\build-production.ps1 -RunMigrations -ApiEnvFile apps\api\.env
```

`build-production.ps1` runs `npm ci`, `npm run build`, and **`prisma migrate deploy` only** when `-RunMigrations` is passed — it does **not** reset data.

---

## 5. Initial administrator

1. On **empty** database only: run seed once if approved (`npx prisma db seed` in `apps/api`) with `SEED_ADMIN_USERNAME` / `SEED_ADMIN_PASSWORD` set in the shell — **rotate immediately** after first login.
2. Prefer creating the single full-access user per [`WAVE1_INITIAL_ADMIN_SETUP.md`](../release/WAVE1_INITIAL_ADMIN_SETUP.md) once **D01** is finalized.
3. Do not commit `.env` or share seed passwords in email.

---

## 6. Production startup (manual first; services later)

**API:**

```powershell
cd D:\ITDMS\app\apps\api
$env:NODE_ENV = "production"
node dist\index.js
```

**Web:**

```powershell
cd D:\ITDMS\app\apps\web
$env:PORT = "3011"
npm run start
```

**Operator URL (standalone):** http://127.0.0.1:3011

Verify: `GET http://127.0.0.1:3000/api/v1/health/ready` → `database: up`.

### Windows services (recommended after smoke test)

Use **NSSM** or Windows Service Wrapper:

1. Service: `ITDMS-PostgreSQL` (often installer-managed)
2. Service: `ITDMS-API` → `node.exe` with args `D:\ITDMS\app\apps\api\dist\index.js`, AppDirectory `apps\api`, env from `api.env`
3. Service: `ITDMS-Web` → `node.exe` running `node_modules\next\dist\bin\next` `start` `-p` `3011`, AppDirectory `apps\web`

Configure **Automatic** start and **restart on failure** (NSSM AppExit 1 Restart).

**Binding:** API currently listens on all interfaces (`PORT` only). For standalone, use Windows Firewall to block inbound on 3000/3011 except loopback until LAN phase; document change when **D02**/LAN is approved.

---

## 7. Firewall and security (standalone)

- Block inbound connections on PostgreSQL, API, and Web ports from the network.
- Strong `SESSION_SECRET` (32+ chars); `ITDMS_STAGING_STRICT=1` in production template.
- Do not set `ITDMS_DISABLE_CSRF`.
- Rotate dev seed credentials before go-live.

---

## 8. Weekly backup (operator schedule)

See [`WINDOWS_BACKUP_RESTORE_RUNBOOK.md`](./WINDOWS_BACKUP_RESTORE_RUNBOOK.md).

Task Scheduler example action:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File D:\ITDMS\app\scripts\windows\run-scheduled-backup.ps1 -EnvFile D:\ITDMS\config\api.env -IncludeStorage
```

Client must approve retention (**D17**) before enabling rotation on production paths.

---

## 9. Rollback (application only)

1. Stop API and Web services.
2. Restore PostgreSQL from last known-good backup (see runbook).
3. Restore `STORAGE_ROOT` from backup archive if `ITDMS_BACKUP_INCLUDE_STORAGE=1` was used.
4. Redeploy previous application build folder if code rollback is required (keep previous `app` copy as `app.previous`).

Does **not** automatically uninstall PostgreSQL or Node.

---

## 10. LAN / domain phase (later)

- TLS termination (IIS reverse proxy or nginx on Windows)
- `ITDMS_TRUST_PROXY=1`, `CORS_ORIGIN` if needed
- Active Directory (**D02**)
- Central backup share (**D17**)

---

## 11. Scripts reference

| Script | Purpose |
|--------|---------|
| `scripts/windows/preflight-check.ps1` | Read-only environment checks |
| `scripts/windows/build-production.ps1` | `npm ci`, build, optional migrate deploy |
| `scripts/windows/run-scheduled-backup.ps1` | Invoke `backup-itdms.mjs` with env file |
| `scripts/windows/verify-wave5-report-exports.mjs` | Auth + XLSX smoke for new reports |

**Requires actual Windows machine testing:** NSSM service recovery, Task Scheduler under locked-down user, antivirus interaction with PostgreSQL data dir and storage.
