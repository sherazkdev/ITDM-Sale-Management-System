# UI08 — Remaining Issues & Follow-ups

**Status:** UI08 automated gate **VERIFIED** (2026-11-02). Items below are **post-gate** follow-ups only.

---

## Closed in gate pass

| Item | Evidence |
|---|---|
| Responsive **6** viewports | `responsive.spec.ts` **156/156** |
| Dark mode shell | `dark-mode.spec.ts` **18/18** route renders |
| Dark axe sample | **3/3** on dashboard, POs, invoices |
| Axe serious/critical | `a11y.spec.ts` **5/5** |
| Connected lifecycle E2E | **14/14** (prior checkpoint) |
| typecheck / lint / build / vitest / API tests | Logs under `docs/frontend/ui08-gate-*.log` |
| smoke-ui07 + API auth smoke | `ui08-gate-smoke-ui07.log`, `ui08-gate-smoke-auth.log` |

---

## Visual verification (optional)

| Gap | Priority | Notes |
|---|---|---|
| Full **6-viewport × light/dark** PNG matrix | Low | Automated responsive E2E supersedes overflow QA; run `CAPTURE_UI08_SCREENSHOTS=1` if PNG artifacts required |
| Legacy PNGs | Info | 28 files — **1440** + **390** light only |
| Detail routes with rich data | Medium | Lifecycle E2E covers mutations; static screenshots of detail states not captured |

---

## E2E coverage (follow-up)

| Item | Status |
|---|---|
| Permission-negative **read-only** persona | **Open** — only anonymous redirect tested today |
| Admin role multi-select | UI single-role picker (backend replaces full set) |

---

## Accessibility (follow-up)

| Gap | Notes |
|---|---|
| `color-contrast` at CRM token values | Excluded in automated axe gate; login decorative panel now `aria-hidden` |
| Chart / KPI text alternatives | Dashboard Recharts — not systematically audited |
| Mobile drawer focus order | Not tested at all breakpoints |

---

## Backend / client decisions (BLOCKED — unchanged)

D01/D02 RBAC final, D03 PO approval, D04/D14 expiry, D06–D08 finance, D09 quantity inventory, D10 department issuance, D12 official templates, D17 restore drill, license/contract renew policies.

---

## Before production hardening (UI09+)

1. CI job: build → Playwright UI08 gates + `smoke:ui08`.
2. Read-only Playwright project.
3. Optional PNG capture or stakeholder sign-off on automated responsive gate only.
