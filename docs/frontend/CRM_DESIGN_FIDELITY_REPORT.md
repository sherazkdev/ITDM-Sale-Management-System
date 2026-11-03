# CRM Design Fidelity Report (Post-UI08)

**Date:** 2026-11-02  
**Reference (read-only):** `D:\employee-management-system` (BizCRM)  
**Target:** `apps/web` (ITDMS)  
**Phase:** Visual refinement only — no backend or business-logic changes  

---

## 1. Original CRM visual specifications (authoritative)

Derived from CRM source + `UI00_DESIGN_TOKENS.md` (byte-aligned where noted):

| Area | Specification |
|---|---|
| **Tokens** | HSL variables in `globals.css`; primary `245 78% 62%`; page bg `230 25% 98%`; `--radius: 0.75rem` |
| **Typography** | Inter 400–700; nav `text-sm font-medium`; section labels `text-[10px] uppercase tracking-wider` |
| **Sidebar** | `240px` / `72px` collapsed; header `h-[64px]`; active nav `bg-brand-gradient` + `shadow-pop` |
| **Topbar** | `h-16`, `bg-background/80`, `backdrop-blur`, search `max-w-xl` |
| **Main** | `p-4 md:p-6 lg:p-8`, `max-w-[1600px]` |
| **Cards / tables** | `rounded-xl`, `shadow-card`; DataTable wrapper `rounded-xl border` |
| **Charts** | Recharts; donut `innerRadius 56` / `outerRadius 80`; horizontal bars `w-20` label + value + `%` columns |
| **Notifications** | Destructive count badge on bell; dropdown `360px`, icon discs, `hover:bg-muted/60` rows |

**Evidence:** CRM files were diffed against ITDMS; tokens and Tailwind config are **identical** to CRM (see §2).

---

## 2. Initial mismatch inventory (source-level audit)

| # | Area | Finding | Type |
|---|---|---|---|
| 1 | Design tokens / UI primitives | **No drift** — `globals.css`, `tailwind.config.ts`, `button`, `input`, `card`, `PageHeader`, `KpiCard`, `DataTable`, `StatusPill` match CRM classes | — |
| 2 | Sidebar footer | CRM `UpgradeCard` (SaaS CTA) absent in ITDMS | **Intentional** (UI00 SKIP) |
| 3 | Mobile sidebar | ITDMS showed section titles; CRM mobile nav does not | **Mismatch** |
| 4 | Mobile active nav | Missing `shadow-pop` on active item | **Mismatch** |
| 5 | Topbar notifications | Dot-only indicator + plain list vs CRM `NotificationBell` | **Mismatch** |
| 6 | Topbar search | Extra `cursor-pointer` on Input | **Minor** |
| 7 | Dashboard bar charts | Label column `w-24`, no `%` column; donut center used full number not compact | **Mismatch** |
| 8 | Dashboard composition | CRM sales area chart + funnel not in ITDMS (different metrics/API) | **Product scope**, not token drift |
| 9 | Authenticated CRM screenshots | No live CRM dashboard capture in repo (login reference only) | **Evidence gap** |

Subjective “doesn’t feel like CRM” reports prior to this pass were largely **chrome composition** (notifications, mobile nav, chart row metrics), not token or primitive drift.

---

## 3. Shared components corrected

| Component | Change |
|---|---|
| **`NotificationBell.tsx`** (new) | Ported CRM dropdown structure: destructive count badge, header badges, icon tone rows, skeleton/empty states, footer link — wired to ITDMS `/notifications` API |
| **`Topbar.tsx`** | Uses `NotificationBell`; removed inline dot/list UI; search Input matches CRM (no extra cursor class) |
| **`MobileSidebar.tsx`** | Removed mobile section title rows; active link adds `shadow-pop` (CRM desktop parity) |
| **`DashboardCharts.tsx`** | `HorizontalBarList`: `w-20` labels, `formatCompact` values, `%` column; donut center uses `formatCompact(total)` |

**Not restored:** `UpgradeCard` — would reintroduce SaaS marketing inconsistent with ITDMS scope.

---

## 4. Page-level visual corrections

No per-route class rewrites required beyond shared components above. ITDMS module pages already consume shared `PageHeader`, `DataTable`, `SectionCard`, and UI primitives copied in UI01.

**Login:** Decorative `LoginItdmsIllo` retained (ITDMS copy); structure matches CRM `AuthShell` (unchanged this pass).

---

## 5. Before / after screenshot evidence

**Directory:** `docs/frontend/screenshots/crm-fidelity/`

| File | Description |
|---|---|
| `crm-login-1440-reference.png` | CRM login (UI00 capture, read-only reference) |
| `itdms-login-1440-light.png` | ITDMS login after fidelity pass |
| `itdms-login-1440-dark.png` | ITDMS login dark |
| `itdms-dashboard-1440-light.png` | ITDMS dashboard (shell + KPI grid) |
| `itdms-dashboard-1440-dark.png` | ITDMS dashboard dark |
| `itdms-employees-1440-light.png` | List/table pattern |
| `itdms-employees-1440-dark.png` | Same, dark |
| `itdms-purchase-orders-1440-light.png` | PO list |
| `itdms-purchase-orders-1440-dark.png` | Same, dark |

**Capture command:** `npx playwright test e2e/crm-fidelity-capture.spec.ts` (production web + API).

**Comparison note:** Side-by-side login reference vs `itdms-login-1440-light.png` shows aligned split layout, wordmark, and showcase panel geometry. **Authenticated CRM dashboard PNG was not available** for pixel diff; dashboard comparison relies on source parity + ITDMS captures.

---

## 6. Responsive verification

| Check | Result |
|---|---|
| `responsive.spec.ts` — 26 routes × 6 widths (1440, 1280, 1024, 768, 390, 375) | **156/156 pass** (post-change run in `crm-fidelity-regression.log`) |
| Horizontal overflow | **None** detected |
| Light / dark | Fidelity captures at **1440** light+dark; full dark-mode E2E suite not re-run (cosmetic-only delta) |

---

## 7. Accessibility findings

| Item | Status |
|---|---|
| Automated axe (login + 4 routes, serious/critical, contrast rule policy per UI08) | **5/5 pass** (same regression run) |
| `NotificationBell` | Preserves CRM `aria-label` on trigger; unread dot `aria-label` on rows |
| CRM `muted-foreground` vs WCAG 2 AA contrast | **Known edge** (~4.46:1 on login subtitle) — same token as CRM; axe gate excludes `color-contrast` by documented policy |
| Keyboard / focus | No regressions introduced; no shell focus-order refactor in this pass |

---

## 8. Regression results

| Command | Result |
|---|---|
| `npm run typecheck` | **Pass** |
| `npm run lint --workspace=@itdms/web` | **Pass** (after unused import fix) |
| `npm run build:web` | **Pass** — 32 routes |
| `npm run test --workspace=@itdms/web` | **42/42** |
| Playwright `responsive` + `a11y` + `crm-fidelity-capture` | **172/172 pass** (~4.1 min) |
| `lifecycle-connected` E2E | **Not re-run** (cosmetic-only changes) |
| API Vitest | **Not re-run** (no API changes) |

Log: `docs/frontend/crm-fidelity-regression.log`

---

## 9. Remaining visual limitations

| Limitation | Reason |
|---|---|
| No CRM **UpgradeCard** in sidebar | SaaS CTA — excluded by product scope |
| ITDMS dashboard lacks CRM **sales area chart** and **lead funnel** | Different backend metrics; adding fake CRM widgets would misrepresent ITDMS data |
| No authenticated **CRM** screenshots for table/form/dialog diff | CRM credentials/runtime not used in this pass |
| **Mark all read** in notification dropdown | CRM API feature; ITDMS links to `/notifications` (“Manage”) — no bulk-read endpoint |
| Pixel-perfect parity | **Not claimed** — evidence is source diff + partial PNG set |

---

## 10. Final fidelity verdict

| Criterion | Verdict |
|---|---|
| Token / primitive parity with CRM source | **VERIFIED** (already true pre-pass; reconfirmed) |
| Shell chrome (sidebar/topbar/notifications/mobile nav) | **IMPROVED** — aligned to CRM patterns |
| Dashboard chart micro-layout (bars/donut) | **IMPROVED** — aligned to CRM dashboard markup |
| Module functionality (32 routes, API integration) | **PRESERVED** — regression green |
| Overall visual fidelity | **HIGH** — faithful CRM presentation layer with documented intentional deltas (UpgradeCard, dashboard data widgets) |

**Phase status:** **COMPLETE** — visual verification and targeted regression done; production hardening **not started**.

---

## Appendix — Files touched (ITDMS only)

- `apps/web/src/components/layout/NotificationBell.tsx` (new)
- `apps/web/src/components/layout/Topbar.tsx`
- `apps/web/src/components/layout/MobileSidebar.tsx`
- `apps/web/src/components/dashboard/DashboardCharts.tsx`
- `apps/web/e2e/crm-fidelity-capture.spec.ts` (capture helper)
