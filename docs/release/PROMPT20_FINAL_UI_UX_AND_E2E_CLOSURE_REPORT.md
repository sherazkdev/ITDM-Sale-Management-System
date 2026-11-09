# Prompt #20 — Final premium UI/UX closure & E2E recovery

**Date:** 2026-11-10  
**Production-ready:** **NO**

## 1. Verified Git baseline

| Item | Value |
|------|--------|
| Pre-redesign checkpoint | `90543bb` |
| Recovery tag | `itdms-pre-redesign-2026-11-09` → `90543bb` |
| Prompt #19 commit | `ac8385e` |
| Prompt #20 closure commit | *(see §15)* |
| Branch | `main` (ahead of `origin/main`; **no push**) |
| Dirty tree (excluded from commit) | Doc screenshot PNGs, `e2e/.auth/admin.json`, Desktop capture artifacts |

## 2. E2E authentication — root cause & fix

**Symptom:** `auth.setup.ts` timed out on `toHaveURL(/\/dashboard/)`; page stayed on `/login` with Next.js client error (`__next_error__`).

**Evidence:**

- API login **succeeded** (`POST /api/v1/auth/login` on `:3020` → 200).
- Browser console: `ChunkLoadError` for `app/(app)/layout-*.js`; static assets returned `text/html` (stale/mismatched production build on **:3021**).
- Playwright default `webServer` used `npm run start` (**port 3011**) while `WEB_ORIGIN` targeted **3021** with `reuseExistingServer: true`.

**Fix (no security bypass):**

1. `next build` then serve on **:3021** with `ITDMS_API_URL=http://127.0.0.1:3020`.
2. `playwright.config.ts`: derive `next start -p <port>` from `WEB_ORIGIN`; default `ITDMS_API_URL` to `http://127.0.0.1:3020` for spawned web server.

**Re-verify:** `auth.setup.ts` **PASS**; `routes.spec.ts` **28/28 PASS**.

## 3. UI modules completed in Prompt #20

| Module | Change |
|--------|--------|
| Maintenance list | `ListToolbar`, status filter chips, reset (no API list search) |
| Software licenses list | `ListToolbar`, expiry window presets + date filter, chips, reset |
| `ListToolbar` | Optional `showSearch={false}` for API lists without search |
| Asset issuance | Employee/department icons; `FORM_HINTS` on department snapshot |
| Assets `/new` | `FORM_HINTS` on asset code / serial |
| `form-field-hints.ts` | Maintenance, license, department snapshot hints |
| Playwright harness | Port-aligned web server for E2E |

**Already aligned (Prompt #19 / prior):** Major list identity cells, detail pages using `DetailRecordLayout` (e.g. vendor, maintenance), budgets forms, dashboard shell.

**Not expanded (API / scope):** List search on maintenance (no backend filter); license status filter on list (only `before` date).

## 4. Test results (this session)

| Check | Result |
|-------|--------|
| Prisma validate | **PASS** |
| Web TypeScript | **PASS** |
| Web Vitest | **68 / 68 PASS** |
| Next production build | **PASS** |
| API Vitest | **100 / 100 PASS** (see `apps/api` test run) |
| Playwright auth setup | **PASS** |
| Playwright route smoke | **28 / 28 PASS** |
| Playwright `responsive.spec.ts` | **163 / 163 PASS** (viewports **375, 390, 768, 1024, 1280, 1440** × static routes) |
| Full Playwright `npm run test:e2e` | **286 PASS / 15 FAIL / 216 SKIP / 14 did not run** (~18.3m, `itdms_e2e` @ `:3020`/`:3021`) |

**Failure themes (not auth-related):**

- Screenshot capture specs writing under `docs/frontend/screenshots` (wave4/4b, orlen, crm-layout)
- `list-server-tables.spec.ts` URL persistence (2× timeout)
- `lifecycle-connected` vendor→contract→PO (cascade skip)
- D10 issuance UI column assertion
- Wave 3 stock entry UI selection
- `workflows.spec.ts` invoice filter UI

## 5. Responsive audit

- **Playwright:** `e2e/responsive.spec.ts` — horizontal overflow check on all `STATIC_APP_ROUTES` at **375, 390, 768, 1024, 1280, 1440**.
- **Screenshot pack:** **390, 768, 1024, 1440, 1920** on 12 module routes (authenticated @ `:3021`).

## 6. Screenshot pack

| Asset | Path |
|-------|------|
| Folder | `C:\Users\shera\OneDrive\Desktop\ITDMS_UI_AUDIT_AFTER_PROMPT20` |
| ZIP | `C:\Users\shera\OneDrive\Desktop\ITDMS_FINAL_PREMIUM_UI_AFTER_PROMPT20.zip` |
| Manifest | `manifest.json` (60 captures, 60 OK in capture run) |
| Regenerate | `node apps/web/scripts/prompt20-desktop-capture.mjs` with E2E web up |

## 7. Demo readiness

| Environment | URL | DB | Status |
|-------------|-----|-----|--------|
| **Client meeting (recommended)** | `http://127.0.0.1:3011` | `itdms_dev` | **GREEN** — login 200, API `:3000` ready |
| **E2E / regression** | `http://127.0.0.1:3021` | `itdms_e2e` | **GREEN** — auth + route smoke verified; full suite see §4 |

Use **:3011** for DEMO walkthrough data; **:3021** for automated regression.

## 8. Remaining issues

1. Complete full Playwright tally and triage capture/lifecycle/D10 UI failures (non-auth).
2. Wire `FORM_HINTS` into remaining `/new` forms (PO, contract, invoice, maintenance, license) incrementally.
3. Optional list search on maintenance when API adds query support.
4. Restart **:3021** after each `next build` to avoid chunk mismatch.
5. Doc PNG churn under `docs/frontend/screenshots` — keep out of git commits.
6. **Production-ready: NO**

## 9. Git

- **Push:** **NOT DONE**
- **Commit:** Prompt #20 source + docs only (no auth JSON, no audit PNGs, no Desktop ZIP)
