# Wave 4 — Premium Enterprise UI/UX Redesign

**Date:** 2026-11-03 (Wave 4 + **Wave 4B fidelity pass**)  
**Scope:** Frontend visual transformation only (ORLEN red identity preserved)  
**Wave 3 functional baseline:** Preserved  
**Reference mockups:** Client PNGs were **not present in the repository** at fidelity time. Comparison used live captures (`wave4-premium-ui/` vs `wave4b-premium-ui/`), the Wave 4 brief, and inspected browser output. Place files under `docs/frontend/references/wave4-premium-mockups/` when available for pixel diff.

---

## Wave 4B — Visual fidelity pass (2026-11-03)

### Reference vs actual (inspected)

| Priority screen | Confirmed gaps (Wave 4 → 4B) | Corrections |
|-----------------|------------------------------|-------------|
| **Overview** | Heavy hero bottom red bar; loud KPI section titles; hero radius larger than list cards | Softer hero glow only; KPI section labels → uppercase muted; `rounded-xl` aligned with cards; warmer page background |
| **Employees** | Split table/pagination cards; KPI row taller than mockup density | Single `SectionCard` (table + pagination); compact KPI band; pagination active page ORLEN gradient |
| **Issuance & returns** | Generic “Section A/B/C”; underline tabs; mobile horizontal overflow @ 375px | **Step 1/2/3** labels; pill tab group; checkbox labels wrap; `main` `overflow-x-hidden`; stacked clear-selection row |

### Final screenshots (Wave 4B)

**Directory:** `docs/frontend/screenshots/wave4b-premium-ui/` — 12 PNGs (dashboard, employees, asset-issuance × 1440/390 × light/dark).

### Responsive (automated)

Playwright `wave4b-fidelity-capture.spec.ts` — **no horizontal overflow** on priority routes @ **1366, 1280, 1024, 768, 375** (after issuance fixes).

### Accessibility (this pass)

`e2e/a11y.spec.ts` — **5/5 PASS** (login + `/dashboard`, `/employees`, `/purchase-orders`, `/asset-issuance`); serious/critical axe (color-contrast rule disabled as in existing gate).

### Regression (Wave 4B session — newly executed)

| Check | Result |
|-------|--------|
| Web typecheck / lint / Vitest | **PASS** / **PASS** / **43/43** |
| Web production build | **PASS** |
| Playwright Wave 4B capture + overflow | **4/4 PASS** |
| Playwright Wave 3 finance + inventory | **13/13 PASS** |
| Playwright a11y (sample routes) | **5/5 PASS** |
| API full suite (`itdms_test`) | **66/66 PASS** |

```powershell
cd apps\web
npm run build
$env:ITDMS_API_URL="http://127.0.0.1:3000"
npx playwright test e2e/wave4b-fidelity-capture.spec.ts e2e/a11y.spec.ts e2e/wave3-finance-verification.spec.ts e2e/wave3-inventory.spec.ts --project=chromium-desktop
```

**Visual review status:** **COMPLETE** for priority pages (browser PNG inspection + automated overflow/a11y/regression). **Not pixel-matched** to unattached mockup files.

---

## 1. Design system improvements

| Area | Change |
|------|--------|
| **Tokens** | `globals.css` — refined radius, `--surface-muted`, component utilities `.page-stack`, `.list-toolbar-panel`, `.panel-muted`; stronger `shadow-soft` / `shadow-card` in Tailwind |
| **Page headers** | `PageHeader` — default **premium** variant (hero card, eyebrow, gradient accent); **standard** variant for compact/detail use |
| **KPI** | `KpiCard` — full labels (`line-clamp-2`), larger values, optional `href` navigation, hover elevation |
| **Tables** | `DataTable` — stronger header row, row padding, hover states |
| **Lists** | `ListToolbar` — elevated panel wrapper |
| **Shell** | Sidebar subtle edge shadow; topbar backdrop + border shadow |
| **Workflow** | New `WorkflowSection`, `DashboardHero` under `components/premium/` |
| **Audit copy** | `formatAuditActivityLine()` — humanizes API `action` + `targetType` (no invented events) |
| **Logo** | Unchanged typographic ORLEN / ITDMS fallback — no unofficial logo art |

---

## 2. Overview (`/dashboard`)

- **DashboardHero** — time-aware greeting, refresh + first permitted quick action, ORLEN accent band  
- **KPI bands** — grouped: Asset operations / People & contracts / Operations; full labels; links only where RBAC allows  
- **Charts** — dynamic min-heights (no fixed `h-72` dead space); compact donut option; PO + maintenance bars scale to row count  
- **Recent activity** — actor + formatted action/target type + relative time  
- **Budget messaging** — `BudgetProvisionalNotice` with Wave 2 posting/payment context + existing provisional USD/FX text (not removed)  
- **Removed** — duplicate second-row asset donut when PO chart already shown; emoji in title  

**Screenshots:** `dashboard-1440-light.png`, `dashboard-1440-dark.png`, `dashboard-390-light.png`, `dashboard-390-dark.png`

---

## 3. Employees (`/employees`)

- Premium header with eyebrow **Directory**  
- Existing three API `meta.total` KPIs unchanged  
- Search/filters in elevated toolbar panel  
- Table + pagination in one **SectionCard**; compact KPI band  

**Screenshots:** `wave4b-premium-ui/employees-*` (supersedes wave4 captures for fidelity evidence)

---

## 4. Issuance & returns (`/asset-issuance`)

- Premium operational header  
- Tabs: Issue assets / Return assets  
- **Step 1 / 2 / 3** workflow sections — employee + reference; asset list; submit  
- Atomic issue/return behavior unchanged  

**Screenshots:** `asset-issuance-1440-light.png`, `asset-issuance-1440-dark.png`, `asset-issuance-390-light.png`, `asset-issuance-390-dark.png`

---

## 5. Other routes (shared system)

All list/ module pages below use **premium `PageHeader`** (default) and **`page-stack`** rhythm unless noted.

| Route | Visual status | Screenshot evidence |
|-------|-----------------|---------------------|
| `/dashboard` | Redesigned (priority) | Yes (4) |
| `/employees` | Redesigned (priority) | Yes (4) |
| `/asset-issuance` | Redesigned (priority) | Yes (4) |
| `/vendors` | Premium header + tokens | Yes (`vendors-1440-light.png`) |
| `/assets` | Premium header + tokens | Yes (`assets-1440-light.png`) |
| `/purchase-orders` | Premium header + tokens | Yes (`purchase-orders-1440-light.png`) |
| `/invoices` | Premium header + tokens | Yes (`invoices-1440-light.png`) |
| `/budgets` | Premium header + tokens | Yes (`budgets-1440-light.png`) |
| `/contracts` | Premium header + tokens | Browser — same system |
| `/maintenance` | Premium header + tokens | Browser — same system |
| `/software-licenses` | Premium header + tokens | Browser — same system |
| `/asset-categories` | Premium header + tokens | Browser — same system |
| `/asset-history` | Premium header + tokens | Browser — same system |
| `/documents` | Premium header + tokens | Browser — same system |
| `/notifications` | Premium header + tokens | Browser — same system |
| `/reports` | Premium header + tokens | Browser — same system |
| `/search` | Premium header + tokens | Browser — same system |
| `/admin`, `/admin/audit` | Premium header + tokens | Browser — same system |
| `/login` | Existing auth shell + tokens | Yes (`login-1440-light/dark.png`) |
| `/*/new`, `/*/[id]` | CRM detail/create layouts + standard or premium header | Not re-captured this wave (layout unchanged from CRM correction) |
| `/assets/non-asset/[id]` | Detail layout | Not re-captured |

---

## 6. Components created or modified

**New:** `DashboardHero.tsx`, `WorkflowSection.tsx`, `audit-display.ts`  
**Modified (4B):** `Pagination` (active page gradient), `Checkbox` (wrapping labels), `ListPageKpiBand` (`density`), `AuthenticatedAppShell` (width + overflow), issuance/dashboard hero refinements, `wave4b-fidelity-capture.spec.ts`  
**API (copy only):** `dashboard.service.ts` — updated `budgetNotice` string to reflect Wave 2 posting vs provisional USD summaries (no calculation change)

---

## 7. Light / dark mode

Priority pages captured in **light and dark** at 1440 and 390. Login captured 1440 light/dark. Dark tokens unchanged in semantics; premium headers use translucent primary glow compatible with `.dark`.

---

## 8. Responsive verification

| Width | Method |
|-------|--------|
| 1440 | Playwright PNGs (priority + representative) |
| 390 | Playwright PNGs (priority pages) |
| 1366, 1280, 1024, 768, 375 | **Overflow check PASS** on priority routes (Wave 4B Playwright) |
| 1440, 390 | PNG capture in `wave4b-premium-ui/` |

---

## 9. Visual reference comparison

**Baseline:** `docs/frontend/screenshots/orlen-branding/before-dashboard-1440-light.png`, `before-employees-1440-light.png`, and CRM layout correction asset-issuance captures.

**Observed alignment with intended mockup direction (not pixel-perfect):**

| Element | Before | After |
|---------|--------|-------|
| Dashboard header | Flat title row | Hero card + accent + grouped KPI sections |
| KPI labels | Often truncated | Two-line clamp, full wording |
| Chart panels | Fixed tall empty areas | Content-height bars / compact donut |
| Employees | Plain header + table | Hero header + toolbar panel + refined table |
| Issuance | Single card form | Tabbed workflow sections A/B/C |

**Gaps vs ideal mockups:** Official ORLEN logo still absent; detail/create routes not fully re-shot; no automated pixel diff (mockup PNGs not in repo).

---

## 10. Testing results (this session — newly executed)

| Check | Result |
|-------|--------|
| Web `npm run typecheck` | **PASS** |
| Web `npm run lint` | **PASS** |
| Web `npm run test` (Vitest) | **43/43 PASS** |
| Web `npm run build` | **PASS** |
| Playwright Wave 3 finance + inventory | **13/13 PASS** |
| Playwright Wave 4 capture | **5/5 PASS** (19 PNG files written) |
| API `npm run typecheck` / `lint` | **PASS** (after notice copy change) |
| Full API suite 66/66 | **Not re-run this session** (Wave 3 gate baseline still valid) |
| UI08 axe / full responsive matrix | **Not re-run** |

**Capture command:**

```powershell
cd apps\web
$env:ITDMS_API_URL="http://127.0.0.1:3000"
npx playwright test e2e/wave4-premium-ui-capture.spec.ts --project=chromium-desktop
```

---

## 11. Remaining UI issues

1. **Mockup PNGs not in repo** — add to `docs/frontend/references/wave4-premium-mockups/` for pixel diff vs `wave4b-premium-ui/`.  
2. **Detail/create routes** — premium header may feel heavy; consider `variant="standard"` selectively.  
3. **List pages** — employees unified table card pattern not yet applied to every module list.  
4. **Color-contrast axe** — still excluded in automated gate; manual contrast review on ORLEN red buttons recommended.  
5. **Official ORLEN logo** — still typographic fallback only.

---

## 12. Release stance

**Production-ready:** **NO** — visual refresh only; client UAT not started.  
**Wave 3 VERIFIED baseline:** Functional regressions (Wave 3 Playwright + web Vitest) **passed** after this redesign.

**Screenshot directories:** `docs/frontend/screenshots/wave4-premium-ui/`, **`docs/frontend/screenshots/wave4b-premium-ui/`** (fidelity evidence)
