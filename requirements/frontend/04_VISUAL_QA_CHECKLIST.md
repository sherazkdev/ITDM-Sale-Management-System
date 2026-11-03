# UI fidelity and functionality QA checklist (per page/phase)

## Freeze baseline
- [ ] Source CRM runs in separate development port, or evidence of inability is recorded.
- [ ] Source screenshot captured for matching shell/form/list/detail patterns at desktop and mobile.
- [ ] Source CSS/tokens, typography, page padding, max-width, spacing, border, radius, shadows captured.
- [ ] Source screenshots and target screenshot use the same viewport width, height, zoom, theme, font and browser.
- [ ] 104 Figma screenshots are either provided separately or marked missing; never claim comparison against absent screenshots.

## Pixel/layout checks
- [ ] Sidebar expanded 240px, collapsed 72px where source defines them.
- [ ] Header height 64px, responsive left/right padding as in source.
- [ ] Same violet active-navigation gradient and actual semantic colors.
- [ ] Same Inter font weights and size hierarchy.
- [ ] Same card spacing/radius/shadows, button/input/badge styles.
- [ ] Same desktop/mobile navigation and animation behavior.
- [ ] No unexpected horizontal page overflow or content under fixed elements.
- [ ] Tables handle many columns; no destructive clipping of key asset codes/amounts/actions.
- [ ] Dark theme readable including charts/tables/dialogs.
- [ ] Screens are compared at 375x812, 390x844, 768x1024, 1024x768, 1440x900 (or recorded equivalents).

## Shared interaction checks
- [ ] Collapsible desktop sidebar toggles and persists as intended.
- [ ] Mobile drawer opens/closes, focus handled, closes on navigation.
- [ ] Keyboard navigation and focus visible; modals accessible.
- [ ] Forms show real backend validation and field errors.
- [ ] Empty/loading/error states follow original UI system.
- [ ] Search/filter/pagination use actual endpoint semantics (not sorting only current page when the backend is paginated).
- [ ] Buttons only present implemented, approved actions.

## ITDMS integration checks
- [ ] Session cookies + CSRF function with Express API; no CRM auth copied.
- [ ] Permission-based navigation AND real 403 handling.
- [ ] Users cannot read protected invoices, costs, license secrets through frontend state.
- [ ] Every KPI/chart has an actual authorized API source; no fabricated or synthetic metrics.
- [ ] Real asset issue/return with invalid and concurrent operation error states.
- [ ] PO line items/totals shown as backend-derived, not recomputed with unsafe floats.
- [ ] Invoice payment ledger/outstanding values backend-derived.
- [ ] Budget amounts labeled as provisional where policy is not approved.
- [ ] Document upload/download and nonofficial export disclaimers accurate.
- [ ] License renewal, PO approval, dept issuance and bulk inventory reflect verified backend availability.
- [ ] No unused CRM sales/leads/deals/workspace/billing navigation left.

## Signoff per feature
Requirement ID: ___  Target route: ___  Reused source component: ___  Express endpoint(s): ___
Desktop visual: PASS/FAIL/UNVERIFIED  Mobile: PASS/FAIL/UNVERIFIED
API integration: PASS/FAIL/BLOCKED  Auth/RBAC: PASS/FAIL/BLOCKED
Errors: PASS/FAIL  Test ID(s): ___  Screenshots: ___
Changes vs original design: ___  Reason: ___
