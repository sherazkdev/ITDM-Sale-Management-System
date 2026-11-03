# Windows Backup & Restore Runbook (ITDMS)

**Policy basis:** Client Wave 2 partial **D17** — weekly backups, retain ≥1 prior set on system; older copies to external media manually.  
**Not approved in ITDMS:** Production RPO/RTO numbers, automatic external-drive deletion.

---

## 1. What is backed up

| Component | Tool | Output |
|-----------|------|--------|
| PostgreSQL database | `pg_dump` via `scripts/backup-itdms.mjs` | `*.sql` + manifest JSON |
| Document files | Optional `ITDMS_BACKUP_INCLUDE_STORAGE=1` | `storage-*.tar.gz` + manifest entries |
| Rotation | `ITDMS_BACKUP_RETAIN_LOCAL` (default **2**) | Deletes **older local** manifest sets only after successful backup |

**Backup directory:** set `BACKUP_DIR` (e.g. `D:\ITDMS\data\backups`).

---

## 2. Pre-backup checklist

- Confirm `DATABASE_URL` points to **production** database intentionally.
- Ensure free disk space on SSD (SQL + storage archive).
- Prefer quiesced app (stop API/Web) for strict filesystem/DB consistency, or accept crash-consistent storage archive if services run.
- Verify `pg_dump` in PATH or set `ITDMS_PG_CONTAINER` for Docker-based dump (not default on standalone Windows).

---

## 3. Manual backup (operator)

```powershell
cd D:\ITDMS\app
powershell -NoProfile -ExecutionPolicy Bypass `
  -File .\scripts\windows\run-scheduled-backup.ps1 `
  -EnvFile D:\ITDMS\config\api.env `
  -IncludeStorage
```

Required keys in env file (or environment):

- `DATABASE_URL`
- Optional: `BACKUP_DIR`, `STORAGE_ROOT`, `ITDMS_BACKUP_RETAIN_LOCAL`

Success: exit code 0 and JSON log event `backup_complete` in console.

---

## 4. Weekly Task Scheduler (template)

Create a task **only after D17 approval**:

| Setting | Value |
|---------|--------|
| Trigger | Weekly, off-hours |
| Action | PowerShell script above |
| Run whether user logged on | Yes (service account with DB + folder ACL) |
| Stop if runs longer than | 2 hours |

**Do not** store passwords in the task action; use `-EnvFile` on a restricted ACL path.

---

## 5. External-drive copy (manual)

After local backup succeeds:

1. Copy the new manifest folder / SQL (+ optional `.tar.gz`) to USB or external disk.
2. ITDMS scripts **never** delete external copies.
3. Label media with date and hostname.

---

## 6. Restore — database (isolated rehearsal first)

**Never** restore over production without change window and verified backup.

Engineering rehearsal pattern (see `scripts/restore-rehearsal.mjs`):

1. Create empty database (e.g. `itdms_restore_test`).
2. `psql` or `pg_restore` equivalent: apply SQL dump.
3. Run `npx prisma migrate deploy` if dump predates migrations (usually dump is sufficient).
4. Point temporary API `DATABASE_URL` at test DB; smoke health and row counts.

**Production restore (operator summary):**

1. Stop ITDMS API and Web.
2. Drop/recreate database **only with written approval** or restore to new DB and swap connection string.
3. Import latest known-good `.sql` from backup manifest.
4. Restore storage tree from `.tar.gz` if used — extract to `STORAGE_ROOT`.
5. Start PostgreSQL → API → Web; verify `/health/ready` and document download sample.

Document integrity script: `npm run verify:documents` (from repo root with correct env).

---

## 7. Restore — documents only

If database intact but files missing:

1. Stop API.
2. Extract storage archive into `STORAGE_ROOT` (merge carefully; do not delete unknown files without policy **D13**).
3. Run `node scripts/verify-document-integrity.mjs`.
4. Start API.

---

## 8. Failure handling

| Symptom | Action |
|---------|--------|
| `backup_failed` / non-zero exit | Do not rotate; fix `pg_dump`/disk/permissions |
| Corrupt SQL header | Use previous manifest generation kept by rotation |
| Restore partial | Stop services; restore again from external copy |

---

## 9. References

- [`../production/WEEKLY_BACKUP_POLICY.md`](../production/WEEKLY_BACKUP_POLICY.md)
- [`../production/BACKUP_RESTORE_VERIFICATION.md`](../production/BACKUP_RESTORE_VERIFICATION.md)
- [`WINDOWS_STANDALONE_INSTALLATION.md`](./WINDOWS_STANDALONE_INSTALLATION.md)

---

## 10. Blockers

Production schedule and RPO/RTO require client sign-off (**D17**). ITDMS provides scripts only until approved.
