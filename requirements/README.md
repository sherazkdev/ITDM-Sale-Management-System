# ITDMS Backend Implementation Kit — START HERE

This is the **backend-first implementation specification**, derived from two supplied PDFs and supplemented with explicitly labeled engineering proposals. It is **not** a claim that all proposals were specified by the client.

## Source of truth and hierarchy
1. `Background and Objective.pdf` (BO): stated functional/nonfunctional requirements.
2. `Database structure.pdf` (DB): initial **13 tables** and stated relationship decisions; not complete schema.
3. Approved answers recorded in `reference/DECISION_REGISTER.md`.
4. These markdown files: **implementation proposals**. Do not override BO/DB or approved decisions with assumptions.

If these disagree, document the conflict and stop the affected feature until resolved. A source requirement is not automatically an approved technical implementation detail.

## Recommended target
- Internal browser-based system, hosted on dedicated on-premises server, accessible from internal LAN.
- Backend-first modular monolith: **Node.js, Express, TypeScript strict, PostgreSQL, Prisma, Zod, Vitest/Supertest, Docker Compose**. Versions pinned after checking compatibility during P01; these technologies are **proposed**, not specified in PDFs.
- Frontend is separate application in the same monorepo, e.g. `apps/web`; **NO DASHBOARD OR UI** in these backend phases.
- Default structure: `apps/api` and optional `packages/contracts` later if useful; avoid premature microservices.

## How to use
1. Copy this entire `requirements` folder into the repository root (keep its two PDFs).
2. Start Cursor Agent with the exact instructions in `CURSOR_MASTER_PROMPT.md`.
3. Cursor must read all requirement and reference documents, make a coverage map, then implement phases in sequence starting at P00. One checkpointed phase at a time; use the short continuation command printed below. **The same master prompt is reusable** — there are not 20 independent prompts to invent.
4. Before implementation, answer the blocking items in `reference/DECISION_REGISTER.md`; Cursor may build safe scaffolding while decisions are pending but must not fabricate financial/authorization policy.
5. After every phase, inspect report, tests, migration diff, API examples, and sign off before continuing.

**Cursor initial instruction:** `Read requirements/CURSOR_MASTER_PROMPT.md completely and execute its instructions, starting with the first incomplete phase.`

**For following phases:** `Continue the next eligible phase strictly using requirements/CURSOR_MASTER_PROMPT.md. Run checks, update IMPLEMENTATION_STATUS.md, and stop at its exit gate.`

## Phase index
| Phase | Topic | Depends on |
|---|---|---|
| P00 | Requirements audit, business decisions, ERD proposal | PDFs |
| P01 | Backend foundation, Docker, Postgres, quality tooling | P00 |
| P02 | Prisma relational schema, constraints, migrations | P01 + blockers |
| P03 | Identity, secure sessions, RBAC | P02 |
| P04 | Employees | P03 |
| P05 | Vendors | P03 |
| P06 | Asset categories / physical inventory | P04, P05 |
| P07 | Contracts | P05 |
| P08 | Purchase orders and line items | P05, P07 |
| P09 | Issuance and return | P04, P06 |
| P10 | Invoices and payments | P08 |
| P11 | Financial years, allocations, commitments, expenditure | P08, P10 |
| P12 | Asset maintenance | P06, P07 |
| P13 | Software licenses / renewals | P05, P08 |
| P14 | Document templates, uploads, generation | P08–P13 |
| P15 | Global linked search | P04–P14 |
| P16 | Notifications and expiry jobs | P07, P08, P13 |
| P17 | Audit, security hardening, backup/restore | across phases |
| P18 | Reporting, PDF/Excel exports, reconciliation | P11–P17 |
| P19 | E2E tests, operations and on-prem deployment | all |

Some cross-cutting work (audit, authorization, validation, secure files) **begins earlier**. Later phases harden it; they must not be skipped until then.

## Core business acceptance walkthrough
1. Register vendor → contract (optional) → create PO with **multiple lines**.
2. Add physical assets with **manually assigned unique codes** and associate to PO/line when relevant.
3. Assign one or more assets to employee → issue form → return form → **immutable movement history**.
4. Register multiple PO invoices / partial invoices; track outstanding, payment details.
5. Track financial year budget allocation, commitment, actual spending with no double counting.
6. Track maintenance, license/contract/PO dates and notification rules.
7. Search **one PO number** to retrieve contract, vendor, invoices, assets, movements, software/maintenance, budget links and document references.
8. Verify roles, audit, backups/recovery, downloadable forms/reports, on-prem internal access.

## Files
- `reference/SOURCE_TRACEABILITY.md`: source-page mapping, confirmed vs proposals.
- `reference/DECISION_REGISTER.md`: unanswered business-policy questions and safe default behavior.
- `reference/DATA_MODEL_BLUEPRINT.md`: 13-table baseline plus extensions and relationships.
- `reference/API_AND_ERROR_CONVENTIONS.md`: consistent API patterns / examples.
- `reference/ENGINEERING_STANDARDS.md`: modular boundaries, validation, security, transactions.
- `reference/DOMAIN_SERVICES_AND_TRANSACTION_RECIPES.md`: function responsibilities and atomic business algorithms.
- `reference/FULL_API_SURFACE_MAP.md`: proposed complete endpoint/permission map.
- `reference/TEST_MATRIX.md`: end-to-end acceptance and nonfunctional verification.
- `reference/DELIVERY_CHECKLIST.md`: actual production readiness requirements.
- `phases/P00..P19`: phase-specific backend logic and acceptance criteria.
- `IMPLEMENTATION_STATUS.md`: Cursor updates **with real evidence** after each phase.
- `CURSOR_MASTER_PROMPT.md`: single reusable prompt to orchestrate phased work.

## Scope note
The source PDF **does not** specify exact role names (e.g., IT admin vs software manager), approval paths, payment posting rules, notification lead days, upload templates, server OS, currency conversion, asset consumable behavior, or detailed endpoint definitions. These are **to be confirmed**, not to be silently coded as client requirements.
