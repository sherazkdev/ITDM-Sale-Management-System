# UI00 — Implementation Plan (Phases UI01–UI08)

Derived from `requirements/frontend/02_PHASED_UI_MIGRATION_PLAN.md`, aligned with ITDMS backend reality and this audit.

**Prerequisite (UI00):** Complete — see deliverables in `docs/frontend/UI00_*.md`.

---

## Target architecture

| Layer | Location |
|---|---|
| Frontend | `apps/web` (Next.js App Router) — **to be created UI01** |
| API | Existing `apps/api` — **no breaking changes without approval** |
| Monorepo | Add `"apps/web"` to root `package.json` workspaces |

---

## Phase UI01 — Design tokens + shared shell

**Goal:** ITDMS-branded BizCRM shell with no feature modules.

| Task | Source | Target |
|---|---|---|
| Create Next app | CRM versions | `apps/web` |
| Copy globals + tailwind + ui primitives | See `UI00_COMPONENT_REUSE_MAP.md` | `apps/web/src/...` |
| Port Sidebar/Topbar/MobileSidebar/App layout | Layout files | Replace nav config |
| Remove UpgradeCard | — | Delete usage |
| ITDMS wordmark | `Logo.tsx` | Rebrand text |
| Placeholder home route | — | `/dashboard` stub “Overview coming UI03” |

**Gate:** Visual shell sign-off at 1440/1024/768/390/375; no horizontal overflow; collapse + mobile drawer work.

**Tests:** Lint/typecheck; optional Playwright smoke for shell only.

---

## Phase UI02 — Auth + API client + permissions

| Task | Detail |
|---|---|
| API client | `fetch`, base URL env, `credentials: 'include'`, parse envelope |
| Login page | Adapt CRM `AuthShell` + form; POST `/api/v1/auth/login`; no OAuth |
| Session | `GET /auth/me`; route guards in middleware or layout |
| Permission hook | `usePermissions()` from me payload |
| Error states | 401 redirect login; 403 page; `POLICY_NOT_APPROVED` banner component |

**Gate:** Real login against dev API (`admin.dev` seed); logout clears cookie.

---

## Phase UI03 — Overview dashboard

| Task | Detail |
|---|---|
| Reuse | `KpiCard`, `SectionCard`, Recharts layout from CRM dashboard |
| Data | Only wired endpoints (notifications unread, optional list totals) |
| Empty | Explicit “aggregate API not available” where needed |

**Gate:** No synthetic revenue/leads charts.

---

## Phase UI04 — Master data UI

Modules: employees, vendors, asset categories, assets (list/detail/history).

| Pattern | CRM reference |
|---|---|
| Lists | `customers/page.tsx` + `DataTable` |
| Detail | `customers/[id]/page.tsx` |
| Forms | CRM form field spacing + `PageHeader` |

**Gate:** CRUD E2E against API; pagination uses `meta.total`.

---

## Phase UI05 — Procurement + movements

Contracts, POs (+ lines, `validUntil`), issuance/return wizards.

| Blocked UX | PO submit/approve — show policy block from API |
|---|---|
| Patterns | `deals/[id]` lines; multi-select assets |

**Gate:** Integration tests mirror `procurement-flow` + `asset-issuance` backend tests.

---

## Phase UI06 — Financial + supporting

Invoices, payments list, budgets (provisional labels), maintenance, licenses, documents upload, notifications.

| Special | Export disclaimer UI; budget semantics copy; license renew hidden |

**Gate:** Permission tests; financial fields respect API redaction.

---

## Phase UI07 — Search, reports, admin

| Module | API |
|---|---|
| PO search hub | `GET /search/purchase-orders/:poNumber` — tabbed sections matching response |
| Reports | Download blobs; detect disclaimer header |
| Users/audit | `/users`, `/audit-events` |

**Gate:** Every action maps to row in `UI00_BACKEND_API_MAPPING.md`.

---

## Phase UI08 — Visual QA + integration

Execute `04_VISUAL_QA_CHECKLIST.md`; complete screenshot matrix; `visual-diff-report.md`, `integration-report.md`, `acceptance-matrix.md`.

---

## Documentation maintenance

| Doc | Update when |
|---|---|
| `UI00_BACKEND_API_MAPPING.md` | API changes |
| `UI00_COMPONENT_REUSE_MAP.md` | New shared components |
| `requirements/IMPLEMENTATION_STATUS.md` | Phase gates passed |

---

## Out of scope (all phases until client decides)

- Separate Admin vs Software Manager **apps**
- PO approval business rules (D03)
- Official PDF templates (D12)
- Consumable quantity stock (D09)
- Department issuance (D10)
- CRM marketing/onboarding/email client

---

## UI00 completion checklist

- [x] `UI00_SOURCE_AUDIT.md`
- [x] `UI00_COMPONENT_REUSE_MAP.md`
- [x] `UI00_DESIGN_TOKENS.md`
- [x] `UI00_BACKEND_API_MAPPING.md`
- [x] `UI00_VISUAL_BASELINE.md`
- [x] `UI00_IMPLEMENTATION_PLAN.md`
- [x] No `apps/web` feature code
- [ ] **Stakeholder review** — approve before UI01

**Next step:** UI01 — scaffold `apps/web` and port shell per reuse map.
