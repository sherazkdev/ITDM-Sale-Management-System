# ITDMS — Production Security Hardening Report (Phase 01)

**Date:** 2026-11-03 (verification gate)  
**Scope:** `apps/api`, `apps/web` proxy, session/RBAC, uploads, operational config  
**Deployment:** **NOT performed**

---

## 1. Executive summary

Phase 01 implemented cookie-session hardening (HMAC sessions, CSRF, rate limits, cookie parity, upload/download guards). **Verification gate (2026-11-03)** ran against **live PostgreSQL** (`docker compose`, `127.0.0.1:5433`), full API integration tests, frontend gates, smoke scripts, and Playwright auth/workflow/lifecycle regression.

**Additional verification fixes (same gate, not weakening security):**

- CSRF **always enforced** unless `ITDMS_DISABLE_CSRF=1` (removed `NODE_ENV=test` bypass).
- **Origin** check on cookie mutations when `Origin` header is present.
- **Bearer + cookie** on same request no longer bypasses CSRF (cookie path wins).
- Integration tests use `sessionRequestHeaders()` (cookie + CSRF header).
- Smoke scripts (`smoke-web-auth.mjs`, `smoke-ui07.mjs`) send CSRF on mutations.
- E2E lifecycle notifications assert **level-1** heading (strict-mode safe).

**Security readiness verdict:** **SECURITY VERIFIED (Phase 01)** for engineering scope — production deploy still blocked by client/release items in `docs/release-report.md` (D01–D17, formal pen test sign-off).

---

## 2. Infrastructure (verification gate)

| Step | Result |
|---|---|
| `docker compose up -d` (repo root) | **OK** — `itdms-postgres` healthy |
| DB endpoint | `127.0.0.1:5433` / `itdms_dev` (isolated dev volume) |
| `npx prisma migrate deploy` | **OK** — no pending migrations |
| Production/shared data | **Not touched** — dev compose credentials only |

---

## 3. Confirmed weaknesses addressed (Phase 01 implementation)

| ID | Area | Severity | Fix |
|---|---|---|---|
| S-01 | CSRF | High | Custom header + Origin check; browser client + proxy forward |
| S-02 | Session hash | Medium | HMAC-SHA256 with `SESSION_SECRET`; legacy hash fallback |
| S-03 | Logout cookie | Low | `sessionCookieOptions()` on set/clear |
| S-04 | API abuse | Medium | Global rate limit on `/api/v1` (health skipped) |
| S-05 | Secrets | Medium | Production `SESSION_SECRET` ≥ 32 chars |
| S-06 | Upload size | Low | Schema max base64 + 10MB storage cap |
| S-07 | Download filename | Low | Sanitized `Content-Disposition` |
| S-08 | Next proxy | Low | CSRF forward + 12MB body cap |
| S-09 | Smoke/CLI | Medium | Smoke scripts updated for CSRF on POST |

---

## 4. CSRF verification evidence

| Check | Method | Result |
|---|---|---|
| Cookie POST without header | `security-verification-gate.test.ts` | **403 FORBIDDEN** |
| Cookie POST with header + same-origin | Integration test creates employee | **201** |
| Cross-origin `Origin: https://evil.example.com` + cookie + header | Integration test | **403** |
| Bearer + session cookie without CSRF | Integration test | **403** |
| Bearer only (no cookie) | `security-hardening.test.ts` | **Allowed** (API clients) |
| Login POST (no session yet) | Smoke + integration | **200** (exempt) |
| Browser mutations | `client.ts` sets `X-ITDMS-Requested-With: itdms` | Playwright **20/20** pass |
| CORS | Only explicit `CORS_ORIGIN` gets `Access-Control-Allow-Origin` | No wildcard with credentials |
| Disable in prod | Only `ITDMS_DISABLE_CSRF=1` | **Not set** in verification |

**Note:** Simple presence of a custom header is **not** sufficient alone; **Origin** validation blocks attacker origins even if a header were forged from a non-browser client.

---

## 5. Session & rate limit verification

| Check | Evidence |
|---|---|
| `SESSION_SECRET` production length | `security-hardening.test.ts` rejects &lt; 32 in `NODE_ENV=production` |
| Session tamper | Invalid cookie → **401** on `/auth/me` |
| Logout invalidation | `security-verification-gate.test.ts` — post-logout **401** |
| Cookie flags | `httpOnly`, `sameSite: lax`, `secure` when `NODE_ENV=production`, `path: /` |
| Legacy sessions | `legacyHashSessionToken` lookup until sessions rotate |
| Test bypass in prod | CSRF not tied to `NODE_ENV=test`; only explicit `ITDMS_DISABLE_CSRF` |
| Login rate limit | `RateLimit-*` headers on login (`security-verification-gate.test.ts`) |
| Global API limit | 600 req / 15 min / IP (production) — shared LAN may share IP; tune if needed |

---

## 6. Documents & sensitive data

| Check | Evidence |
|---|---|
| Executable MIME upload | `document-security.test.ts` → **422** |
| Oversized base64 | Schema max + storage 10MB (existing + schema) |
| Path traversal storage | `file-storage.test.ts` |
| RBAC on modules | `rbac-isolation.test.ts`, finance/license tests in full suite |
| Logs | pino redacts `cookie`, `authorization` (unchanged) |

---

## 7. Commands executed & results (2026-11-03)

| Command | Result |
|---|---|
| `docker compose up -d` | Postgres healthy `:5433` |
| `cd apps/api && npx prisma migrate deploy` | OK |
| `npm run typecheck` | **Pass** |
| `npm run lint` | **Pass** |
| `npm run build:web` | **Pass** (32 routes) |
| `npm run test --workspace=@itdms/api` | **49/49 pass** — log: `docs/production/phase01-api-vitest.log` |
| `npm run test --workspace=@itdms/web` | **42/42 pass** |
| `node scripts/smoke-web-auth.mjs` | **Pass** (after CSRF on logout) |
| `node scripts/smoke-ui07.mjs` | **Pass** |
| `npx playwright test e2e/auth.spec.ts e2e/workflows.spec.ts e2e/lifecycle-connected.spec.ts` | **20/20 pass** — log: `docs/production/phase01-playwright.log` |

**New/updated tests:** `security-hardening.test.ts` (5), `security-verification-gate.test.ts` (6); integration suites use `sessionRequestHeaders`.

---

## 8. Remaining risks

| Risk | Notes |
|---|---|
| Client policy blockers D01–D17 | Unchanged — not security implementation gaps |
| Formal penetration test | Not executed in this gate |
| `ITDMS_DISABLE_CSRF=1` | Must never be set in production |
| Shared LAN rate limits | Single public IP may throttle many users — adjust limits if needed |
| License encryption at rest (D21) | Redaction only in API |

---

## 9. Required production configuration

See Phase 01 §7 in prior revision — unchanged:

- `NODE_ENV=production`, `SESSION_SECRET` ≥ 32, HTTPS, private `STORAGE_ROOT`, optional `CORS_ORIGIN`, reverse proxy trust.

**Web:** mutations require `X-ITDMS-Requested-With: itdms` (automatic in `lib/api/client.ts`).

---

## 10. Final Phase 01 readiness verdict

| Gate | Status |
|---|---|
| Implementation | **Complete** |
| DB-backed regression | **VERIFIED** (49 API tests) |
| Frontend regression | **VERIFIED** (42 vitest + build) |
| Browser E2E regression | **VERIFIED** (20 Playwright tests) |
| CSRF / session smoke | **VERIFIED** |
| **Phase 01 security** | **SECURITY VERIFIED** |
| Production deployment | **NOT APPROVED** — release report + stakeholder sign-off |

**Stop gate:** Performance, backup, and deployment phases **not started**.

---

## 11. References

- `docs/release-report.md`
- `docs/frontend/UI08_FINAL_QA_REPORT.md`
- `apps/api/.env.example`, `apps/web/.env.example`
