# Phase 05 — Pre-UAT Engineering Closure & Client Decision Preparation

**Date:** 2026-11-03  
**Scope:** Close safe engineering gaps, verify staging persistence, prepare client decision package and release gate  
**Out of scope:** Client LAN deploy, production deploy, client UAT execution, ORLEN theme implementation  

---

## 1. Executive summary

Phase 05 addressed the **staging UI authorization gap** (read-only users could open some create URLs while the API correctly returned 403), added **centralized write-route guards** using existing permission keys, prepared **client-facing decision materials**, and added a **staging document persistence** verification script. Release remains **blocked** on client decisions **D01, D03, D06–D08, D12, D17** and on **UAT sign-off**.

| Verdict | Result |
|---|---|
| **Engineering pre-UAT gate (local)** | **READY FOR CLIENT UAT PREPARATION** — not production |
| **Production go-live** | **NOT AUTHORIZED** |

---

## 2. Bugs fixed (Phase 05)

| ID | Issue | Root cause | Fix |
|---|---|---|---|
| PF-01 | `uat.reader` could open `/employees/new` and similar create URLs | `RouteAccessGuard` used nav list permission (`employees.read`) via longest-prefix match | Added `getWritePermissionForPath()` in `apps/web/src/config/route-write-permissions.ts`; guard checks write/manage keys before render |
| PF-01b | Inconsistent access-denied presentation on blocked routes | Denial UI inline only on some pages | Shared `AccessDeniedView` component used by `RouteAccessGuard` |

**Unchanged (by design):** API `requirePermission` enforcement; list pages already hide “New” actions when write permission missing.

---

## 3. Document persistence verification

### 3.1 Engineering tooling

| Script | Purpose |
|---|---|
| `scripts/staging-document-persistence.mjs` | Upload → DB row + disk file → Postgres container restart → download SHA-256 match; storage isolation vs `storage/` and `storage-test/` |
| `npm run staging:document-persistence` | Wrapper |
| Optional `ITDMS_RUN_STAGING_BACKUP_CHECK=1` | Runs `backup-itdms.mjs` against staging DB + `storage-staging` with manifest |

### 3.2 Expected evidence (run when staging API is up)

Prerequisites: `itdms-postgres-staging`, API with `apps/api/.env.staging`, `STORAGE_ROOT=./storage-staging`.

```powershell
npm run staging:document-persistence
# Optional full backup scope check:
$env:ITDMS_RUN_STAGING_BACKUP_CHECK="1"; npm run staging:document-persistence
```

**Note:** Document **files** survive API process restarts because they are on disk under `STORAGE_ROOT`; Phase 05 verifies **Postgres restart** + download round-trip. Production still requires **D17-approved** scheduled backup including **both SQL and storage tree** (`ITDMS_BACKUP_INCLUDE_STORAGE=1`).

### 3.3 Phase 04B baseline

Vendor count persistence after Postgres restart was already verified (`staging-persistence.mjs`) — see `STAGING_FINAL_VERIFICATION.md`.

---

## 4. Client decision package

| Deliverable | Location |
|---|---|
| Short client-friendly questions (Priority A–C) | [`CLIENT_APPROVAL_QUESTIONS.md`](./CLIENT_APPROVAL_QUESTIONS.md) |
| Full register D01–D24 | [`CLIENT_DECISION_REGISTER.md`](./CLIENT_DECISION_REGISTER.md) |
| Release checklist | [`FINAL_RELEASE_CHECKLIST.md`](./FINAL_RELEASE_CHECKLIST.md) |

**Release-blocking decisions (unchanged):** D01, D03, D06–D08, D12, D17.

---

## 5. UAT scope readiness (18 cases)

**Status:** Plan prepared — **no UAT executed**, **no sign-off claimed.**

| Case | Title | Classification | Notes |
|---|---|---|---|
| UAT-01 | Sign-in and permissions | **Requires client decision** | D01, D02; use PROPOSED UAT accounts until matrix approved |
| UAT-02 | Employee lifecycle | **Ready for testing** | After D01 roles provisioned |
| UAT-03 | Vendor and contract | **Requires client decision** | D13 attachments optional policy |
| UAT-04 | Draft PO with lines | **Ready for testing** | Draft only; approval out of scope until D03 |
| UAT-05 | PO approval | **Requires client decision** | **Blocked** — D03 workflow disabled |
| UAT-06 | Register asset and issue | **Requires client decision** | D10 if department issue required |
| UAT-07 | Return asset | **Ready for testing** | |
| UAT-08 | Invoice and partial payment | **Requires client decision** | D05 payment rules |
| UAT-09 | Budget view | **Requires client decision** | D06–D08 semantics PROPOSED |
| UAT-10 | Global PO search hub | **Ready for testing** | |
| UAT-11 | Upload and download document | **Requires client decision** | D13; engineering path verified on staging script |
| UAT-12 | Reports export | **Requires official template** | D12 — CSV/JSON only today |
| UAT-13 | Maintenance record | **Ready for testing** | |
| UAT-14 | Software license register | **Requires client decision** | D21 secrets policy |
| UAT-15 | Notifications | **Requires client decision** | D14 lead times/channels |
| UAT-16 | Audit trail review | **Ready for testing** | Reader lacks `audit.read` by PROPOSED design |
| UAT-17 | Connected procurement workflow | **Requires client decision** | D03/D06–D08 for full business meaning |
| UAT-18 | Backup restore (IT) | **Requires infrastructure** + **D17** | Tooling proven locally; client schedule/destination TBD |

### Summary counts

| Classification | Count |
|---|---|
| Ready for testing (once roles provisioned) | 6 |
| Requires client decision | 10 |
| Requires official template | 1 (UAT-12) |
| Requires infrastructure | 1 (UAT-18) |
| Blocked by engineering defect | 0 |

---

## 6. LAN deployment prerequisites

See **Section 4** of [`FINAL_RELEASE_CHECKLIST.md`](./FINAL_RELEASE_CHECKLIST.md) and [`STAGING_DEPLOYMENT_RUNBOOK.md`](./STAGING_DEPLOYMENT_RUNBOOK.md).

**Phase 05 action:** Document only — **no LAN deployment performed.**

---

## 7. ORLEN branding (recorded, not implemented)

| Direction | Status |
|---|---|
| ORLEN company logo | Approved direction recorded in `CLIENT_APPROVAL_QUESTIONS.md` |
| Red-tone theme | Recorded — **no CSS/theme changes in Phase 05** |
| CRM-derived layout preserved | Required constraint for future branding phase |

Branding must be completed and **visually verified before final client UAT sign-off.**

---

## 8. Verification performed (Phase 05)

Run after pulling Phase 05 changes:

| Check | Command / artifact | Result |
|---|---|---|
| Web unit — nav + write routes | `npm run test --workspace=@itdms/web` (includes `auth-nav.test.ts`) | *See §8.1 below* |
| Web typecheck / lint / build | `npm run typecheck/lint/build --workspace=@itdms/web` | *See §8.1* |
| Staging Playwright | `npm run staging:e2e` (staging web + API running) | Reader `/employees/new` expects **Access denied** heading |
| Staging smoke | `npm run staging:smoke` | When stack up |
| Document persistence | `npm run staging:document-persistence` | When stack up |
| API regression (subset) | `npm run test --workspace=@itdms/api` | When DB available |

### 8.1 Execution log (2026-11-03, local)

| Check | Result |
|---|---|
| Web typecheck | **PASS** |
| Web lint | **PASS** |
| Web production build | **PASS** |
| Web vitest `auth-nav.test.ts` | **4/4 PASS** (includes `getWritePermissionForPath`) |
| Staging smoke `staging-smoke.mjs` | **7/7 PASS** |
| Staging document persistence | **PASS** — upload, disk + DB, Postgres restart, download SHA-256; optional backup manifest **PASS** with `ITDMS_RUN_STAGING_BACKUP_CHECK=1` |
| Staging Playwright | **2/2 PASS** on fresh `next start -p 3012` after Phase 05 build (reader sees **Access denied** on `/employees/new` + API **403**) |
| Full API test suite | Not re-run in Phase 05 closure (unchanged from prior phases) |

---

## 9. Pending client decisions (summary)

| Priority | IDs |
|---|---|
| **Release-blocking** | D01, D03, D06–D08, D12, D17 |
| **UAT / policy** | D02, D04, D05, D13, D14, D16, D21, D22 |
| **Scope** | D09–D11, D15, D18–D20, D23–D24 |

---

## 10. Remaining production infrastructure requirements

- Client LAN host, TLS, and reverse proxy (`OPS-01`–`OPS-06` in `RELEASE_BLOCKERS.md`)
- Production PostgreSQL and isolated `STORAGE_ROOT`
- D17-approved backup schedule with offsite copy and restore ownership
- Scheduled expiry scan job
- ORLEN branding deployment before final UAT sign-off
- Optional: formal penetration test (not done)

---

## 11. Final engineering readiness verdict

| Layer | Status |
|---|---|
| Application feature delivery | **Advanced** — P00–P19, UI00–UI08 |
| Security baseline | **Verified** (Phase 01) |
| Staging integration | **Verified** (Phase 04B) + Phase 05 UI guard |
| Client business rules | **Not approved** |
| UAT | **Not started** |
| Production | **Not ready** |

**Phase 05 engineering closure:** **COMPLETE** (documentation + UI authorization fix + persistence tooling).  
**Stop line respected:** No LAN/production deploy, no client UAT execution, no ORLEN theme implementation.

---

## Related documents

- [`STAGING_FINAL_VERIFICATION.md`](./STAGING_FINAL_VERIFICATION.md)  
- [`PHASE03_READINESS_REPORT.md`](./PHASE03_READINESS_REPORT.md)  
- [`RELEASE_BLOCKERS.md`](./RELEASE_BLOCKERS.md)  
- [`requirements/IMPLEMENTATION_STATUS.md`](../../requirements/IMPLEMENTATION_STATUS.md)
