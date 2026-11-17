# Hosted UAT smoke test (execute on deployed URLs only)

Mark each item **PASS / FAIL / BLOCKED** only after testing the **live** Netlify + Render + Neon stack.

| # | Check |
|---|--------|
| 1 | Frontend HTTPS responds |
| 2 | Backend `/api/v1/health/live` returns 200 |
| 3 | Backend `/api/v1/health/ready` returns 200 (DB) |
| 4 | Login with demo account |
| 5 | Logout |
| 6 | Role restrictions (Manager / IT Staff if configured) |
| 7 | Dashboard loads |
| 8 | Employees list |
| 9 | Vendors list |
| 10 | PO create → **Approved** status |
| 11 | Contracts |
| 12 | Invoice + partial payment math |
| 13 | Budget summary |
| 14 | Asset registration |
| 15 | Issuance |
| 16 | Return |
| 17 | Non-asset stock quantities |
| 18 | Global Search from known PO |
| 19 | Finance RBAC (no leakage for IT Staff) |
| 20 | Software licenses |
| 21 | Notifications list (pre-seeded or manual scan) |
| 22 | Official Issuance/Return XLSX (**BLOCKED** if templates not on Render) |
| 23 | Hard refresh on deep link (e.g. `/purchase-orders`) |
| 24 | No critical CORS/cookie errors in console |
| 25 | No fatal SSR errors |
| 26 | Mobile navigation (one critical flow) |
| 27 | Render cold start acknowledged (first request slow) |
| 28 | Demo data isolated (no real client names) |
| 29 | Secrets not visible in browser source |
| 30 | Production LAN DB unreachable from cloud (by design) |

**Automation:** After deploy, optional spot-check with Playwright against `WEB_ORIGIN` env — not a substitute for this checklist on the hosted URL.