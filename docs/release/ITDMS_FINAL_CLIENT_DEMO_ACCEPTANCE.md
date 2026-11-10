# ITDMS final client-demo acceptance

**Date:** 2026-11-10  
**Demo status:** **GREEN**  
**Production ready:** **NO**  
**GitHub push:** not done  
**Parent commit:** `981b381abfcdb3b9b2061b004c623df4c00a139c`  
**Closure commit:** the commit that adds this file (child of `981b381` on `main`)

The approved minimal UI was not redesigned. No APIs, financial calculations, stock rules, issuance semantics, D09/D10 rules, or RBAC were changed. No database was reset and no volume was deleted.

## Demo and build

| Item | Value |
|------|--------|
| Client demo | http://127.0.0.1:3011 |
| Demo API | http://127.0.0.1:3000 (`/api/v1/health/ready`, database up) |
| E2E web / API | http://127.0.0.1:3021 / http://127.0.0.1:3020 |
| Web `BUILD_ID` | `TMcbhm4YnPSim5wUD5d6T` |
| CSS | `/_next/static/css/99bc42fc140b72db.css` (disk and the live demo) |
| Signed-in theme | Rose primary `357 93% 62%`. Primary buttons use the supported brand gradient. Amber stays a user preset and a semantic warning color. |

Login as the development admin reaches the dashboard with live figures (registered assets, stock, employees, notifications). Employees, assets, issuance, purchase orders, contracts, invoices, annual budgets, roles, notifications, and the new purchase-order form render real content with no application-error screen and no loading skeleton left in place.

## Visual fixes

| Issue | Result |
|-------|--------|
| Tablet topbar (~768px) | Header tracks are `auto / minmax(0, 1fr) / auto`. Search can shrink. The shortcut hint and the account name stay available from the large breakpoint up; the account button keeps its accessible name. Measured at 768px: search, help, notifications, and account do not overlap and stay inside the viewport. Playwright covers 390, 768, 1024, and 1440. |
| Purchase orders and contracts | Date-only values such as `2026-02-01T00:00:00.000Z` display as `1 Feb 2026` via `formatDateOnly`. The calendar day is taken from the date prefix so midnight UTC does not shift the day. Stored values are unchanged. The same display is used on PO and contract detail, PO/contract search dates, and notification due text. |
| Assets export | The two actions are different reports. Labels are **Export assets** (asset register) and **Export inventory** (inventory). Both remain. At 768px the description, both exports, and Stock entry are visible. |
| Roles on a phone | Settings links stay named and focusable in a horizontal scroller. The role directory list scrolls inside a bounded panel. At 390px the settings nav is about 68px tall. |
| Theme | The signed-in admin theme is the supported rose default, not an accidental yellow primary. No theme was reset. |
| Loading captures | Screenshot helpers wait for a heading and for `main .animate-shimmer` to clear, then check the PNG is at least 512 bytes. Pages were not rewritten to hide a working loader. |
| Dashboard chart accessibility | Recent activity and the expiry watchlist are focusable regions. Pie sectors no longer use an unlabeled image role; each slice has an accessible name, and the chart group is not a tab stop. The legend remains operable. |

At 768px the assets search placeholder still truncates (`Search code, nam`). It does not overlap the topbar.

## Tests

| Gate | Result |
|------|--------|
| Web typecheck | Pass (`tsc --noEmit`, and the production build type check) |
| Web lint | Pass (`next lint`: no warnings or errors; production build lint passed) |
| Web Vitest | **72 passed**, 17 files, 0 failed |
| API typecheck | Pass (`tsc --noEmit`) |
| API lint | Pass (`eslint src tests`) |
| API Vitest | **100 passed**, 37 files, 0 failed, 0 skipped. Includes document security. Duration 1955.43s |
| Production build | Pass. 40/40 static pages. `NODE_ENV=production`. Servers were stopped before the build. |
| Playwright auth and routes | Included in the full suite below (auth setup, login persistence, anonymous redirect, and route shells passed) |
| Workflow regression | Wave 3 finance, Wave 3 inventory, employee create, PO search, invoice filters, help, and the reports notice passed in the full suite |
| Playwright full suite | **309 passed, 1 failed, 216 skipped, 9 did not run** (535 collected, 21.4m) |
| D09 isolated rerun | **12 passed**. The full-suite failure did not reproduce |
| Responsive | Topbar spec passed at 390, 768, 1024, and 1440. Capture overlap checks passed on every captured route at those widths |

The full-suite failure was `d09-inventory-workflow` “issue 20 → available 80”. Confirm stayed open and “stock updated” did not appear within 15s while a screenshot capture and a live browser were also using the machine. The same step passed in 6.5s on the previous full run and again in 6.2s when the spec was rerun alone. The nine tests that did not run are later steps in that serial workflow. Stock logic was not changed.

Dashboard dark-mode axe (serious/critical) passed in 8.1s inside the full suite. Purchase orders and invoices dark-mode axe also passed. The previous multi-minute hang is bounded: axe is raced at 45s and the test timeout is 90s.

Document-security setup no longer hits the 120s hook failure. Test database preparation uses a cross-process lock, a 90s migrate/seed timeout, and retries only for lock or connection errors. The API hook timeout is 90s. The document-security `beforeAll` timeout is 180s. The test database `itdms_test` has `lock_timeout` of 20s. `itdms_dev` was not changed.

Playwright screenshot specs write under `apps/web/test-results/ui-captures/` (gitignored). Original files under `docs/` were not overwritten by this helper and were not committed.

The full Playwright run was against build `mbZaT_6uU-yjtoCxz3KUI`. The later notification due-date display change is in `TMcbhm4YnPSim5wUD5d6T`. That change is display-only and is covered by the screenshot manifest below, not by another full suite.

## Screenshots

**Zip:** `C:\Users\shera\OneDrive\Desktop\ITDMS_CLIENT_DEMO_FINAL_VERIFIED.zip`  
**Size:** 5,293,054 bytes  
**Captured:** 2026-11-10T08:22:55Z from http://127.0.0.1:3011  
**Contents:** 45 PNGs plus `manifest.json` (46 entries)  
**Manifest:** **45 pass, 0 fail**

Each row checks route status, heading, stylesheet, no shimmer, expected content, no `T00:00:00.000Z` text, no topbar overlap, no page error, and a PNG larger than 512 bytes. Widths are 390, 768, 1024, and 1440, plus the login screen. Source PNGs were written outside OneDrive (`%TEMP%\ITDMS_CLIENT_DEMO_FINAL`) and then zipped.

## Remaining notes

- This is a local client demo. It has not been deployed, and production configuration was not certified in this pass.
- The full Playwright run recorded one timing failure that passed when rerun alone.
- Some list placeholders truncate at 768px. They do not cover other controls.
- Dashboard expiry chips still show `YYYY-MM-DD`. Purchase orders, contracts, and notification due dates use the readable date-only format.

## Production readiness

**NO.** Evidence: the running app is a local production build against the development API and local database. There was no production deploy, no production secret rotation, and no clean single-pass Playwright result (one timing failure, then a passing isolated rerun). The client demo itself meets the acceptance rule: login works, major routes show loaded data, the tablet topbar does not overlap, the browser capture recorded no client exception, core finance and inventory workflows passed, and the zip matches this UI.
