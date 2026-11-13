# ITDMS — Final Business Functionality Implementation (Prompt #25)

## Git safety

| Item | Value |
|---|---|
| Verified starting SHA | `21d53bf` (`fix(web): close client-demo layout and test harness gaps`) |
| Recovery tag | `itdms-pre-prompt25-2026-11-13` (local) |
| GitHub push | **NOT DONE** (unauthorized) |
| Production deploy | **NOT DONE** (unauthorized) |

## Approved business decisions recorded

| Topic | Rule |
|---|---|
| **D03 superseded** | No manual/SAP PO approval — new POs are **APPROVED** on creation in ITDMS |
| **D14 superseded** | Expiry reminders at **60, 30, 15, 7, 5, 4, 3, 2, 1, 0** days; **in-app only** |
| **Recipients** | **Super Admin** (`admin` role users only) |
| **Finance RBAC** | Super Admin: full finance; Manager: read-only; IT Staff: no finance modules |
| **D12** | Client `Issuance.xlsx` / `Return.xlsx` drive official movement exports (not committed to Git) |

Full register: `docs/release/CLIENT_DECISION_REGISTER.md`.

## Implementation summary

### PO automatic approval

- `PurchaseOrderService.createDraft` persists `APPROVED` and audits `purchase_order.create_approved`.
- Line/header edits allowed while status is `DRAFT` (legacy) or `APPROVED` via `isPoComposable`.
- Submit/approve/cancel endpoints remain **403** (no separate workflow engine).
- UI copy updated (`purchase-order-ui.ts`, PO detail/new pages).

### Notification schedule

- `expiry-reminder-policy.ts` defines milestones; `NotificationService.runExpiryScan` creates **one event per entity × expiry date × milestone × Super Admin user**.
- `notification_events.recipient_user_id` added (migration `20261113153000_prompt25_notification_recipient`).
- List/unread/mark-read scoped to recipient (legacy null-recipient rows still visible to matching admin).

### Finance access

- `finance-access.ts` helpers; search hub redacts invoices, budgets, and asset purchase costs by permission.
- Report routes: `/invoices` and `/budget-utilization` require finance read permissions.
- Seed adds `manager` (finance read-only) and `it_staff` (no finance) roles via `seed-client-roles.ts`.

### Issuance / return documents

- `AssetMovementOfficialExportService` loads client templates from `storage/client-templates/` (or env `ITDMS_*_TEMPLATE_PATH`).
- Routes: `GET /api/v1/asset-issuances/:id/official-xlsx`, `GET /api/v1/asset-returns/:id/official-xlsx`.
- Return sheet keeps template labels; **return date** populated in the issuance-date value cell.

## Client requirements coverage (summary)

| Area | Status |
|---|---|
| PO auto approve | **PASS** |
| PO expiry (valid_until) | **PASS** (when field set) |
| Notifications milestones | **PASS** (implemented + tested) |
| Super Admin recipient | **PASS** |
| Finance RBAC | **PASS** (core API + search; UI nav unchanged permission-driven) |
| Issuance template | **PASS** (with local template files) |
| Return template | **PASS** (same) |
| Global search finance redaction | **PASS** |
| Playwright full regression | **NOT RUN** this session (DB/docker brought up late) |

## Tests executed this session

| Suite | Result |
|---|---|
| API `npm run typecheck` | **PASS** (after fixes) |
| API Vitest (full) | **IN PROGRESS** at doc write — see `docs/release/_tmp_prompt25_api_full_log.txt` |
| API Prompt #25 targeted | **PASS** (PO auto-approve, milestones, finance RBAC, notifications) |
| Official XLSX test | **PASS** (content-length check) |
| Web `npm run typecheck` | **PASS** |
| Web Vitest | **72 / 72 PASS** |
| Web `npm run lint` | **NOT RUN** (typecheck + vitest completed) |
| Web production build | **NOT RUN** |
| Playwright | **NOT RUN** |

## Remaining issues

1. Run full API Vitest to completion and capture final count in this doc.
2. Run Playwright regression (incl. D09 concurrency, finance permission E2E).
3. Production build + staging smoke.
4. Ten-milestone exhaustive matrix test (all 10 days in one spec) — optional hardening.
5. Legacy `DRAFT` POs unchanged (by design); only **new** POs auto-approved.

## Deployment readiness

**NO** — engineering rules implemented and partially verified; full regression and client UAT sign-off still required.

## Local commit

To be recorded after `git commit` (see final agent response for SHA).
