# Windows Production Handover (ITDMS)

**Audience:** Client IT and ITDMS engineering  
**Status:** Engineering handover pack — **not client acceptance**

## 1. What is delivered

- Browser-based ITDMS (existing Next.js + Express stack — **not** a desktop wrapper app)  
- Operational Excel exports (`NON-OFFICIAL-D12` until client templates)  
- Local document storage and weekly backup scripts  
- RBAC and session security unchanged  

## 2. Production layout

```
C:\ITDMS\
  app\           Application binaries (replace on upgrade; do not delete data\)
  config\        api.env, web.env.local (restricted ACL)
  data\
    storage\     Uploaded files (STORAGE_ROOT)
    backups\     Rotated SQL/manifest sets
  logs\          Service and script logs (no secrets in logs by policy)
  install\       Copied scripts from release
```

## 3. URLs (standalone)

| Service | Default URL |
|---------|-------------|
| Web UI | http://127.0.0.1:3011 |
| API health | http://127.0.0.1:3000/api/v1/health/ready |

Rehearsal used ports **3010/3012** to avoid dev conflicts — production template uses **3000/3011** unless IT changes consistently in env and firewall rules.

## 4. Credentials custody

- One initial full-access user (**D01** matrix pending)  
- No default passwords in repository  
- `SESSION_SECRET` and DB password stored in client secret store  

## 5. Operations

| Task | Reference |
|------|-----------|
| Start/stop (manual) | `scripts/windows/start-itdms-production.ps1`, `stop-itdms-production.ps1` |
| Services | `deploy/windows/nssm-services.example.ps1` |
| Weekly backup | `scripts/windows/run-scheduled-backup.ps1`, `register-weekly-backup.example.ps1` |
| Restore | `WINDOWS_BACKUP_RESTORE_RUNBOOK.md` |
| Reports verify | `scripts/windows/verify-wave5-report-exports.mjs` |

## 6. Known limitations (client-dependent)

- Official PDF/Excel company layouts (**D12**)  
- Budget `remainingUsd` provisional semantics  
- Non-asset quantity consumption (**D09**)  
- LAN/domain/AD (**D02**) — separate security review before exposure  

## 7. Support contacts

*(Fill at handover — not in repo.)*

## 8. Evidence bundle

- `WAVE6_OFFLINE_INSTALLATION_REHEARSAL.md`  
- `WINDOWS_DEPLOYMENT_READINESS_REPORT.md`  
- Git commits for Wave 5–6 (local; push per client policy)  

**Production-ready:** **NO** until UAT and blocker closure in `PRE_DEPLOYMENT_GAP_LIST.md`.
