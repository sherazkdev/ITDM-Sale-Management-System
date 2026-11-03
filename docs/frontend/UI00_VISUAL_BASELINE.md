# UI00 — Visual Baseline

**Purpose:** Record evidence for comparing ITDMS `apps/web` (future) against BizCRM source design.

---

## 1. Runtime verification status

| Check | Result |
|---|---|
| CRM `npm run dev` on port **3010** | **Success** (2026-11-02) — Next 15.1.3 Turbopack, read-only source tree |
| CRM `.env` | Present on disk — **not read, not copied** |
| MongoDB / CRM data | **Not modified** (no login POST attempted in audit) |
| Full viewport screenshot matrix | **Incomplete** |
| Authenticated app shell screenshots | **Not captured** (no test credentials documented in audit) |
| Dark mode screenshot pass | **Not captured** |
| Figma PNG comparison | **Not possible** — 104 files listed in `figma-manifest.txt` only |

---

## 2. Captured evidence

| File | Viewport | Route | Notes |
|---|---|---|---|
| `docs/frontend/screenshots/ui00-crm-login-1440.png` | ~desktop (browser default) | `/login` | Split auth layout: form + marketing/KPI preview panel; dark theme in capture (system/theme default) |

---

## 3. Source-derived expectations (UNVERIFIED at listed widths)

Use **`04_VISUAL_QA_CHECKLIST.md`** viewports during UI08. Expected from **source classes** (not screenshot-measured):

| Width | Expected shell behavior |
|---|---|
| **1440×900** | Sidebar expanded 240px; topbar search visible; main `max-w-[1600px]` centered |
| **1024×768** | Same as desktop shell (`md+` breakpoint) |
| **768×1024** | Sidebar hidden; hamburger opens `MobileSidebar` drawer |
| **390×844** / **375×812** | Mobile drawer; main full width `p-4`; tables scroll horizontally |

### Login (`/login`)

- `AuthShell` two-column layout on large screens; form column with Inter typography
- Primary CTA uses brand gradient / primary button styles
- CRM includes OAuth buttons — **omit in ITDMS**

### Dashboard (`/dashboard`) — static code review only

- Grid of `KpiCard` components
- Recharts line/bar areas
- Section cards for activity lists
- **Not screenshot-verified**

---

## 4. Comparison workflow (UI08)

1. Start CRM dev (disposable) + ITDMS web dev side by side.
2. Same browser, zoom 100%, theme light/dark paired.
3. Capture source + target at 375, 390, 768, 1024, 1440 widths.
4. Store under `docs/frontend/screenshots/ui08-*/`.
5. Log diffs in `docs/frontend/visual-diff-report.md` (future phase).

---

## 5. Limitations (explicit)

- Cannot claim **pixel-perfect** parity with missing Figma PNGs.
- Single login screenshot does **not** verify dashboard, tables, or light theme.
- CRM login marketing panel shows **synthetic KPI numbers** — ITDMS auth marketing must **not** copy fake metrics; use static IT copy or ITDMS-specific illustration only.

---

## 6. UI00 gate

| Requirement | Met? |
|---|---|
| Document whether CRM ran | Yes |
| At least one real screenshot OR explicit inability | Yes — one login screenshot |
| Breakpoint checklist documented | Yes — expectations table |
| No fabricated multi-page screenshot set | Yes — incomplete matrix acknowledged |

**Proceed to UI01** with code-based token/shell fidelity; schedule full baseline capture in UI08 or before UI03 if stakeholders require earlier sign-off.
