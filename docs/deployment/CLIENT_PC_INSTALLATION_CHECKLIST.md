# Client PC Installation Checklist (IT Staff)

**Use on the authorized client desktop only.**  
**Not production-ready until UAT and client sign-off.**

## Before arrival

- [ ] Offline USB: Node.js LTS Windows x64 installer  
- [ ] Offline USB: PostgreSQL 15+ Windows x64 installer  
- [ ] Offline USB: ITDMS package zip (or git tag) + `PACKAGE-MANIFEST.json` SHA-256 verified  
- [ ] Offline USB: NSSM zip (if using documented service approach)  
- [ ] Printed: `WINDOWS_STANDALONE_INSTALLATION.md`, `WINDOWS_BACKUP_RESTORE_RUNBOOK.md`, `WINDOWS_PRODUCTION_HANDOVER.md`  
- [ ] Client-approved DB name, app user password, `SESSION_SECRET` (32+ chars) — **not** dev passwords  
- [ ] D17 backup retention approval  

## Installation day

- [ ] Create `C:\ITDMS\` layout (app, config, data, logs, backups)  
- [ ] Install PostgreSQL — localhost only, Windows service automatic  
- [ ] Create least-privilege DB user + `itdms_prod` database  
- [ ] Install Node.js LTS  
- [ ] Extract application to `C:\ITDMS\app`  
- [ ] Copy `deploy/windows/env.api.production.example` → `C:\ITDMS\config\api.env` (edit all placeholders)  
- [ ] Copy web env template → `config\web.env.local`  
- [ ] Set `STORAGE_ROOT` and `BACKUP_DIR` under `C:\ITDMS\data\`  
- [ ] Run `preflight-check.ps1`  
- [ ] Run `build-production.ps1 -RunMigrations -ApiEnvFile` (or use pre-built package)  
- [ ] Initial admin per `WAVE1_INITIAL_ADMIN_SETUP.md` — rotate password immediately  
- [ ] Manual start: `start-itdms-production.ps1` (or register NSSM example after smoke)  
- [ ] Browser: `http://127.0.0.1:3011` (or configured port)  
- [ ] Smoke: health, login, one Excel export from Reports  
- [ ] Configure weekly backup example script (after D17)  
- [ ] Reboot test: PostgreSQL + services start automatically  
- [ ] Document handover credentials custody  

## Must not do (standalone phase)

- [ ] Do **not** expose API/PostgreSQL to LAN  
- [ ] Do **not** use `itdms_dev_password` or seed defaults in production  
- [ ] Do **not** skip backup verification  

## Rollback

- [ ] Stop services  
- [ ] Restore DB from last good backup (see runbook)  
- [ ] Restore storage archive if used  
- [ ] Keep previous `app` folder as `app.previous` before upgrade  

## Sign-off

| Role | Name | Date | Notes |
|------|------|------|-------|
| IT installer | | | |
| Client sponsor | | | UAT separate |
