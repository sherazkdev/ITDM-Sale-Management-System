# Weekly Backup Policy — Client Wave 2 (D17 partial)

**Effective engineering policy:** 2026-11-03  
**Client confirmation:** Weekly backups; retain at least one previous valid backup on the system; older backups may be copied to external drives manually.

**Not configured by ITDMS in Wave 2:** Windows Task Scheduler entries on production host, external-drive automation, RPO/RTO numbers.

---

## 1. Objectives

- Coordinate PostgreSQL logical dump and document storage manifest (optional storage archive).
- Keep **latest successful backup** and **at least one prior valid local set** before deleting older local sets.
- Allow operators to copy superseded sets to external media without the script touching external paths.

---

## 2. Script

**Entry point:** `node scripts/backup-itdms.mjs` (from repo root)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Required — PostgreSQL connection |
| `BACKUP_DIR` | Output directory (default `./backups`) |
| `STORAGE_ROOT` | Document files (default `apps/api/storage`) |
| `ITDMS_BACKUP_INCLUDE_STORAGE=1` | Optional `tar.gz` of storage tree |
| `ITDMS_BACKUP_RETAIN_LOCAL` | Number of manifest generations to keep locally (default **2**) |
| `ITDMS_PG_CONTAINER` | Docker postgres name when host lacks `pg_dump` |

**Rotation:** After a **successful** backup (dump header verified, manifest written), the script deletes older manifest/SQL/storage siblings beyond the retain count. It does **not** delete files on external drives.

**Integrity:** Non-zero exit and JSON log `backup_failed` on dump failure or missing PostgreSQL header.

---

## 3. Weekly schedule (operator — Windows)

1. Choose a maintenance window (application quiesced if strict DB/file consistency required — see `BACKUP_RESTORE_VERIFICATION.md`).
2. Open PowerShell as a user with DB and `BACKUP_DIR` write access.
3. Set environment (example):

```powershell
cd D:\ITDM-Sale-Management
$env:DATABASE_URL = "postgresql://..."
$env:BACKUP_DIR = "D:\ITDMS-Backups"
$env:ITDMS_BACKUP_RETAIN_LOCAL = "2"
node scripts\backup-itdms.mjs
```

4. Confirm console event `backup_complete`.
5. Optionally copy older manifest/SQL sets to external drive (manual copy — robocopy or Explorer).
6. On failure, investigate before relying on rotation; prior local sets remain until a new successful backup prunes them.

**Task Scheduler (not created by Wave 2):** Client IT may register a weekly task pointing at the same command; document service account and `BACKUP_DIR` ACLs separately.

---

## 4. Retention model

| Location | Policy |
|---|---|
| System (`BACKUP_DIR`) | Keep **N ≥ 2** most recent successful manifest generations (default 2) |
| External drive | Manual copy of older sets; **never** auto-deleted by script |
| Application storage | Not a backup; manifest lists files for restore reconciliation |

---

## 5. Recovery (summary)

1. Restore PostgreSQL from `itdms-db-<timestamp>.sql` into a **test** database first when possible (`BACKUP_RESTORE_VERIFICATION.md`).
2. Restore or reconcile `STORAGE_ROOT` using manifest paths and optional `itdms-storage-*.tar.gz`.
3. Point staging `DATABASE_URL` / `STORAGE_ROOT` at restored assets; run smoke tests.
4. Production cutover requires client-approved restore authority (D17 open).

---

## 6. Access control

- Restrict `BACKUP_DIR` to backup operators and DB admins.
- Treat dumps as **confidential** (full DB contents).
- Do not commit backup files to git.

---

## 7. Wave 2 verification

- Rotation logic present in `backup-itdms.mjs`
- Phase 02 isolated restore evidence remains in `BACKUP_RESTORE_VERIFICATION.md`
- **New automated rotation test:** optional; manual verification: run backup twice with `ITDMS_BACKUP_RETAIN_LOCAL=2` and confirm only two manifest timestamps remain
