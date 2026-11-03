# Phase 03 — Client Requirements & Release Readiness Report

**Date:** 2026-11-03  
**Scope:** Traceability, decision preparation, document recovery investigation, release gate  
**UAT / deploy:** **NOT performed**

---

## 1. Executive summary

Phase 03 mapped client PDF requirements (BO + DB) to implemented modules, expanded the **client decision register** with plain-language questions, audited release blockers, and prepared a **UAT test plan**. A **document recovery discrepancy** from Phase 02 was investigated; root cause is **not** a failed pg_dump but **environment separation** and **backup scope**.

**Release readiness verdict:** **NOT READY FOR PRODUCTION** — engineering delivery is advanced, but **client decisions (especially D01, D03, D06–D08, D12, D17), UAT, official templates, and signed DR policy** block handover.

**Phase 03 engineering gate:** **COMPLETE** (documentation + safe test DB isolation + storage key normalization).

---

## 2. Document recovery investigation

### 2.1 Phase 02 observation

Restore rehearsal reported **4/5** sampled `stored_documents` files on disk under `apps/api/storage`.

### 2.2 Root cause (verified)

| Finding | Evidence |
|---|---|
| Missing sample **id 31** (`84f82932…-note.txt`) | **Present** in `apps/api/storage-test/private/2026-11-03/…` |
| Same row in restored DB from backup | Metadata restored correctly |
| Full scan `itdms_dev` vs `storage/` only | **7 present / 30 missing** (37 total) |
| Pattern | Integration tests used **`DATABASE_URL=itdms_dev`** + **`STORAGE_ROOT=./storage-test`** while manual/UI uploads used `./storage` |

**Conclusion:** Primary cause = **stale/misaligned storage location (test vs dev)**, not FK corruption or restore SQL failure. Secondary = Phase 02 spot-check did not include `storage-test`. Tertiary = **DB backup without simultaneous file bundle** leaves files recoverable only if `storage-test`/`storage` copied separately.

**Not the cause:** Path traversal bug (ruled out for id 31 — file exists in test storage). Windows backslash keys — **mitigated** by normalizing new keys to forward slashes.

### 2.3 Fixes applied (Phase 03)

| Change | Purpose |
|---|---|
| Vitest default DB → **`itdms_test`** | Stop polluting shared `itdms_dev` |
| `prepare-test-database.ts` creates `itdms_test` | Isolated test migrations/seed |
| `file-storage.ts` forward-slash `storageKey` | Consistent cross-platform paths |
| `scripts/verify-document-integrity.mjs` | Operational integrity check |
| `restore-rehearsal.mjs` checks **both** `storage` and `storage-test`; full file counts | Accurate DR rehearsal reporting |

**Original `itdms_dev` rows not deleted** (per instructions).

### 2.4 Document recovery status

| Criterion | Status |
|---|---|
| DB restore + FK integrity | **VERIFIED** |
| 100% file recovery from backup alone | **PARTIAL** — requires **coordinated DB + file backup**; dev DB contains historical test orphans |
| Production readiness for documents | **BLOCKED** until D13/D17 + clean prod DB + backup includes `STORAGE_ROOT` |

### 2.5 Re-verification

Re-run after Phase 03 script update (checks `storage` + `storage-test`):

```json
{"documentFilesPresent":35,"documentFilesMissing":0,"storageFilesResolved":5,"storageFilesMissing":0}
```

For the **2026-11-03 backup snapshot**, all restored document keys resolve when both dev storage roots are considered. Production still requires **single canonical `STORAGE_ROOT`** included in backup jobs.

---

## 3. Requirements coverage summary

See [`CLIENT_REQUIREMENTS_TRACEABILITY.md`](./CLIENT_REQUIREMENTS_TRACEABILITY.md).

| Status | Count (domains 1–20) |
|---|---|
| VERIFIED | 9 |
| PARTIAL | 9 |
| IMPLEMENTED BUT NOT VERIFIED | 1 (LAN deploy) |
| MISSING (within partial domains) | Consumables (D09), official templates (D12) |

---

## 4. Client decisions

See [`CLIENT_DECISION_REGISTER.md`](./CLIENT_DECISION_REGISTER.md) — all D01–D24 remain **OPEN** unless noted in `requirements/reference/DECISION_REGISTER.md`.

**Release-critical:** D01, D03, D06–D08, D12, D17.

---

## 5. Release blockers

See [`RELEASE_BLOCKERS.md`](./RELEASE_BLOCKERS.md) — **7 critical**, document recovery **HIGH (HG-01)**.

---

## 6. UAT

[`CLIENT_UAT_TEST_PLAN.md`](./CLIENT_UAT_TEST_PLAN.md) — **18 cases** prepared; **UAT-05** explicitly blocked on D03; **UAT-18** for IT restore.

**Client acceptance:** **NOT CLAIMED**

---

## 7. ORLEN branding (deferred)

Record only: ORLEN logo, red-tone scheme, **keep CRM layout and logic**. Final branding phase — **no Phase 03 UI changes**.

---

## 8. Verification (Phase 03 code changes)

| Check | Result |
|---|---|
| `tests/unit/file-storage.test.ts` | **3/3 pass** |
| `npm run test --workspace=@itdms/api` (isolated `itdms_test`) | **57/57 pass** |
| Restore rehearsal (dual storage roots) | **35/35** document files resolved for backup snapshot |

---

## 9. Recommended order of remaining work

1. **Client workshop** — close D01, D03, D06–D08, D12, D17 (minimum).  
2. **Deliver approved templates** → implement P14/P18 renderers.  
3. **Staging deploy** on LAN (OPS items) with **production-only DB** and single `STORAGE_ROOT`.  
4. **Coordinated backup** (DB + files) + IT restore UAT-18.  
5. **Execute client UAT** → sign-off.  
6. **ORLEN branding phase** (visual only).  
7. Production cutover (out of scope until above complete).

---

## 10. Phase 03 stop gate

Phase 03 **complete**. Do **not** auto-start deployment or branding implementation.
