# Prompt #28 defect ledger

| ID | Severity | Module | Symptom | Root cause | Fix | Status |
|----|----------|--------|---------|------------|-----|--------|
| P28-001 | P2 | E2E harness | 243 Playwright failures, connection refused | Playwright `webServer` lost :3011 during 17m run | External stack on :3021, `ITDMS_E2E_EXTERNAL_STACK`, `ensure-e2e-stack.ps1` | **Fixed** |
| P28-002 | P2 | API Vitest | `prompt25-po-auto-approve` hook timeout / skip | Concurrent Prisma migrate while suite running | `tests/global-setup.ts` prepares DB once; sequential `run-prompt28-regression.ps1` | **Fixed** |
| P28-003 | P2 | E2E D10 | Issuance HTTP 500 at test #7 in full suite only | PostgreSQL contention with overlapping API Vitest | No parallel full suites; API warm login in `e2e/global-setup.ts` | **Fixed** (stability 6/6) |
| P28-004 | P2 | E2E finance | `wave3-finance` UI assert on `/600/` | Locator matched invoice id substring containing `600` | Assert on `Outstanding` `dd` sibling | **Fixed** |
| P28-005 | P3 | Docs | Misleading “draft PO” in UI | Copy drift (Prompt #27) | Already corrected in #27; verified no `draft` in PO routes | **Closed** |

**Open P0:** 0  
**Open P1:** 0  
**Open P2:** 0  
**Open P3:** 0