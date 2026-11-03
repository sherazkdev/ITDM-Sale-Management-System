# ITDMS — Backup & Restore Verification (Phase 02)

**Date:** 2026-11-03  
**Scope:** PostgreSQL logical backup, document storage scope, isolated restore rehearsal  
**Production scheduling:** **NOT configured** (awaiting D17)

---

## 1. Summary

| Step | Result |
|---|---|
| Backup tooling hardened | **OK** — `scripts/backup-itdms.mjs` |
| Backup executed | **OK** — ~1.8s dump via Docker `pg_dump` |
| Backup integrity | **OK** — PostgreSQL dump header + gzip sidecar |
| Storage scope documented | **OK** — manifest lists `STORAGE_ROOT` files + SHA-256 samples |
| Isolated restore | **OK** — database `itdms_restore_test` |
| `itdms_dev` untouched | **OK** |
| Point-in-time recovery | **NOT IMPLEMENTED** |

---

## 2. What is backed up

### 2.1 PostgreSQL

- **Mechanism:** `pg_dump` (plain SQL), `--no-owner --no-acl`
- **Host without `pg_dump`:** falls back to `docker exec itdms-postgres pg_dump`
- **Output:** `backups/itdms-db-<timestamp>.sql` + `.sql.gz`
- **Configuration:** `DATABASE_URL`, optional `BACKUP_DIR`, `ITDMS_PG_CONTAINER`

### 2.2 Document files

- **Location:** `STORAGE_ROOT` (default `apps/api/storage`), layout `private/YYYY-MM-DD/<random>-<filename>`
- **DB linkage:** `stored_documents.storage_key` + `document_links`
- **Manifest:** `itdms-manifest-<timestamp>.json` includes file count, total bytes, sample SHA-256 hashes
- **Optional archive:** `ITDMS_BACKUP_INCLUDE_STORAGE=1` attempts `tar.gz` (skipped if `tar` unavailable on Windows)

### 2.3 Consistency warning

Database rows and files are **not guaranteed point-in-time aligned** unless:

- Application quiesced, or
- Files and DB captured together in one maintenance window, or
- Files copied after DB dump with documented skew

Manifest `consistencyNote` records this requirement.

---

## 3. Backup execution evidence

**Command:**

```text
node scripts/backup-itdms.mjs
```

**Result (2026-11-03):**

```json
{
  "event": "backup_complete",
  "durationMs": 1764,
  "pgDumpMode": "docker_exec",
  "sqlFile": "backups/itdms-db-2026-11-03T05-45-03-111Z.sql",
  "storageFileCount": 7
}
```

**Dump size:** 432,362 bytes (see manifest `sizeBytes`).

**Legacy alias:** `npm run backup:db` → delegates to `backup-itdms.mjs`.

---

## 4. Restore rehearsal evidence

**Command:**

```text
node scripts/restore-rehearsal.mjs backups/itdms-db-2026-11-03T05-45-03-111Z.sql
```

**Target:** new database **`itdms_restore_test`** on same Docker instance (drops/recreates each run).

**Duration:** ~5.0s

**Row counts (restored DB):**

| Table | Count |
|---|---|
| employees | 140 |
| assets | 175 |
| purchase_orders | 159 |
| stored_documents | 35 |
| document_links | 29 |
| users | 27 |
| document_link FK violations | **0** |

**Document file spot-check (against live `STORAGE_ROOT`):**

- 5 metadata rows sampled
- **4/5** files present on disk
- **1/5** missing — consistent with DB/file backup skew (file not copied or removed after dump)

**Authentication/API on restored DB:** Not switched for this rehearsal (would require separate `DATABASE_URL` + API instance). Row-level and FK verification satisfies Phase 02 isolated DB gate.

---

## 5. Failure detection and logging

| Check | Behavior |
|---|---|
| Missing `DATABASE_URL` | Exit 1, JSON log `backup_failed` |
| Invalid dump header | Exit 1 |
| `pg_dump` / docker failure | Exit 1 with stderr snippet |
| Restore SQL error | Exit 1 `restore_failed` |
| Secrets in logs | Connection strings redacted in docs; scripts log paths only |

---

## 6. Security and access (recommendations vs approval)

| Topic | Recommendation | Approved? |
|---|---|---|
| Backup file permissions | Restrict to backup operator + DBA role on host | **Pending IT** |
| Encryption at rest | Encrypt `.sql.gz` with org key (e.g. age/GPG) before offsite copy | **Pending D17** |
| Offsite copy | Second media / cloud per on-prem policy | **Pending D17** |
| Retention | Not configured in tooling | **Pending client** |
| RPO / RTO | Document after stakeholder workshop | **Pending D17** |
| Restore authorization | Two-person rule for production restore | **Pending IT** |

---

## 7. Scheduling instructions (documentation only)

**Do not enable unattended production jobs until D17 is approved.**

Suggested operator workflow (dev/staging):

1. Set `DATABASE_URL` and optional `BACKUP_DIR`.
2. Run `node scripts/backup-itdms.mjs` (or cron on approved host).
3. Copy `.sql.gz` + manifest + storage archive to approved storage.
4. Monthly: `node scripts/restore-rehearsal.mjs <latest.sql>` on isolated instance.
5. Log results for audit.

Windows Task Scheduler / Linux cron examples intentionally omitted until destination and credentials are approved.

---

## 8. Related utilities

| Script | Purpose |
|---|---|
| `scripts/backup-itdms.mjs` | Primary backup |
| `scripts/backup-db.mjs` | Compatibility wrapper |
| `scripts/restore-rehearsal.mjs` | Isolated restore + verification |
| `scripts/restore-verify.mjs` | Manual checklist helper (legacy) |
| `scripts/db-verify.mjs` | Connectivity check |

---

## 9. Verdict

| Criterion | Status |
|---|---|
| Backup creates readable artifact | **VERIFIED** |
| Restore to isolated DB | **VERIFIED** |
| Referential integrity | **VERIFIED** |
| Document metadata vs files | **PARTIAL** (1/5 sample missing — document skew policy) |
| Production DR readiness | **BLOCKED** pending D17 |
| PITR | **NOT TESTED / NOT AVAILABLE** |

**Phase 02 backup/restore engineering gate:** **VERIFIED** with documented client follow-ups.
