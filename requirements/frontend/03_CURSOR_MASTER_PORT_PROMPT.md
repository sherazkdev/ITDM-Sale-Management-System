# Cursor Agent — ITDMS frontend port from existing BizCRM design source

## Paths (replace placeholders with real absolute local paths)
- SOURCE_CRM_ROOT: `<ABSOLUTE_PATH_TO_EXISTING_CRM_PROJECT>`
- TARGET_ITDMS_ROOT: `<ABSOLUTE_PATH_TO_ITDMS_PROJECT>`

## Mandate
You are a senior Next.js frontend engineer and UI fidelity auditor. Implement the client-required ITDMS web frontend using the **actual existing source code and visual design** in SOURCE_CRM_ROOT as the read-only canonical visual reference. Do not recreate the UI from Figma screenshots or invent a different dashboard theme.

First read:
- TARGET_ITDMS_ROOT/requirements/Background and Objective.pdf
- TARGET_ITDMS_ROOT/requirements/Database structure.pdf
- TARGET_ITDMS_ROOT/docs/CLIENT_REQUIREMENTS_VS_ACTUAL_BACKEND_AUDIT.md
- TARGET_ITDMS_ROOT/docs/BACKEND_FINAL_ACCEPTANCE_MATRIX.md
- TARGET_ITDMS_ROOT/requirements/reference/DECISION_REGISTER.md
- TARGET_ITDMS_ROOT/apps/api source/routes/validators/permissions/auth code
- This kit's `01_SOURCE_DESIGN_AUDIT.md`, `02_PHASED_UI_MIGRATION_PLAN.md`, `04_VISUAL_QA_CHECKLIST.md`

Read source CRM:
- `src/app/globals.css`, `tailwind.config.ts`, `src/app/layout.tsx`
- `src/app/(app)/layout.tsx`
- `src/components/layout/{Sidebar,Topbar,MobileSidebar,UserMenu}.tsx`
- `src/config/navigation.ts`
- `src/components/common/*`, `src/components/ui/*`
- `src/app/(app)/dashboard/page.tsx`, representative list/detail/forms
- `src/app/(auth)/login/page.tsx`, `src/components/auth/*`
- dependency graph and providers

### Non-negotiable migration rules
1. **Reference source is READ-ONLY.** Never edit/delete/migrate it.
2. **Target is ITDMS `apps/web`.** Preserve existing Express, PostgreSQL, Prisma migrations and auth implementation.
3. Reuse real JSX/TSX, classes, CSS tokens and UI primitives with minimal compatible adaptation. Avoid screenshot-driven AI redesign and avoid new palette, spacing, card radii or visual style.
4. DO NOT copy `src/app/api`, `src/server/models`, Mongoose/MongoDB, JWT/OAuth/session logic, SaaS billing/workspaces, marketing flows, leads/deals business behavior, CRM `.env`, private uploads or production data.
5. `Topbar`, `UserMenu`, `NotificationBell`, `BrandThemeProvider`, `AuthProvider` likely depend on CRM APIs. Retain visual markup but replace business/data/auth logic with real ITDMS endpoints and permission checks.
6. Keep **one shared frontend** with dynamic permission-based navigation and overview. Do not create redundant Admin and Software Manager frontend apps; final role matrix requires approval.
7. Do not invent API endpoints, statuses, filters, financial KPIs or summary trends. Audit backend contracts and implement only supported capabilities; document needed endpoints.
8. Use actual backend cookie/session settings and CSRF protections, not copied CRM JWT flows. Ensure server authorization remains the security boundary.
9. Preserve responsive behavior at 375,390,768,1024,1440; inspect overflow, dialog clipping, mobile nav, large tables, accessibility focus and keyboard use.
10. No hardcoded demo data presented as real. No synthetic budget/revenue/series calculations. No placeholder actions that claim success.
11. Do not bypass `POLICY_NOT_APPROVED`; make blocked workflows clearly unavailable with accurate explanations. Provisional exports must retain nonofficial disclaimer.
12. Do not run destructive operations, expose `.env`, commit secrets, or change live DB.

### Autonomous execution with gates
Work through UI00–UI08 in `02_PHASED_UI_MIGRATION_PLAN.md`. Within a phase proceed autonomously; for each phase save implementation report and verify code, UI screenshot/fidelity, responsive behavior and API connections. Continue between safe engineering phases but do not claim success without results. Pause for unresolved client policy, deployment approval, data exposure risk or destructive operation.

### Phase-specific deliverables
- `docs/frontend/ui-reference-inventory.md`: exact reused component paths and version compatibility.
- `docs/frontend/api-capability-map.md`: every screen/action -> actual Express endpoint + permission + status.
- `docs/frontend/visual-baseline.md`: screenshots or explicitly unavailable reason, dimensions and source/target comparison.
- `docs/frontend/ui-implementation-status.md`: completion gates.
- `docs/frontend/acceptance-matrix.md`: requirement -> screen -> API -> manual/E2E test.
- `docs/frontend/visual-diff-report.md`: layout, text, tokens and deviations.
- `docs/frontend/integration-report.md`: real verification and remaining blocked workflows.

### Initial execution (do this first)
- Verify both roots exist and inspect git status of target.
- Read all original PDFs, code, docs and this migration kit.
- Check source dependencies and ability to safely run it; if source cannot be launched record that. Do not call source UI pixel-perfect verified without screenshot evidence.
- Identify exactly which CRM components are visual-only, dependent on CRM business data, or not reusable.
- Inspect all existing ITDMS Express endpoints and frontend baseline.
- Begin UI00, then UI01 when its prerequisites are met; do not start all feature screens in a single uncontrolled batch.
- At session end report actual implemented components, verified screenshots/test results, unmet requirements, technical blockers and next phase.

**Desired outcome:** preserve the BizCRM UI's actual style and responsive shell with high fidelity while making each ITDMS module genuinely functional against the current Express APIs and the client's original PDFs.
