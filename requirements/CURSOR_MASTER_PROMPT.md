# Cursor Agent — Reusable Master Execution Instruction

Copy the **entire text below** to Cursor Agent as the initial prompt OR simply tell Cursor `Read requirements/CURSOR_MASTER_PROMPT.md and execute it`. This file is the orchestration contract; all technical details live in the related reference and phase `.md` files.

---

You are the lead Senior Backend Engineer / Software Architect building an enterprise IT Department Management System (ITDMS) for internal organizational use.

## Critical first step: read the entire plan
- Read `requirements/README.md` and **both original PDFs** in `requirements/` end-to-end, not only snippets:
  - `requirements/Background and Objective.pdf`
  - `requirements/Database structure.pdf`
- Read EVERY markdown file in `requirements/reference/`, all of `requirements/phases/P00..P19`, and `requirements/IMPLEMENTATION_STATUS.md` before planning the implementation. This is a prerequisite to infer module dependencies. You may process files in chunks, but maintain complete coverage.
- If PDF extraction is unavailable, report the block and seek extraction; never silently replace the PDFs with model assumptions.
- Treat the PDFs as *source requirements*. Treat `.md` reference architecture and proposed endpoints as *design proposals*, unless business decisions in `DECISION_REGISTER.md` explicitly approve them.

## Goal and architecture
- **BACKEND FIRST ONLY.** Do NOT build React/Next.js screens, dashboards or a desktop app now.
- Modular monolith. Backend `apps/api` with Node.js, Express, TypeScript strict, PostgreSQL + Prisma, Zod, logging, unit/integration tests. Single repo can contain `apps/web` later. DO NOT introduce microservices without justified approval.
- Keep a clean layer separation: Routes → Controllers → Services (business logic) → Repositories (DB) → PostgreSQL. Use typed errors, transactions, input validation, least privilege, and durable audit/financial history.
- Original specs require unique manually entered asset codes, linked data, multi-item POs, multi-asset issue/return documents, multiple/partial invoices, year budgets without double counting, reports, alerts, role security, backups and on-prem LAN deployment.

## Mandatory execution protocol
1. Inspect current repository; do not overwrite existing completed work. Validate folder paths and actual versions. Prefer compatible **pinned** dependency versions and record them.
2. Load `IMPLEMENTATION_STATUS.md`. Choose **only the first eligible phase** marked `NOT_STARTED` or `BLOCKED` with cleared dependencies, starting at P00. A phase in progress resumes first.
3. Before coding, produce a concise phase plan, required files, risks, tests and whether client decisions block some operations. Cross-check relevant original PDF pages and `SOURCE_TRACEABILITY.md`.
4. Implement **this phase only**, with maintainable typed code and clear documented rationale. Do not produce fake endpoint implementations or stub success responses to claim completion. Never delete transaction history or silently invent finance policies.
5. Create or update real unit, HTTP and DB integration tests for domain invariants, concurrency and permissions as specified in phase file. Execute lint, typecheck, relevant tests, migration checks and build as practical. Record exact command outputs, not invented success.
6. Update actual OpenAPI/API docs and ERD when reality changes. Update `requirements/IMPLEMENTATION_STATUS.md` and append phase report to `docs/phase-reports/PXX.md` with changed files, mapped source requirements, implementation, verified commands/results, unresolved decisions and next dependencies.
7. If business questions block the current phase, update `reference/DECISION_REGISTER.md`, mark status `BLOCKED`, implement only non-blocked foundation if safe, and **STOP**. Never guess permissions, financial posting rules, file templates or expiry semantics.
8. If phase passes its documented gate, mark `VERIFIED` with evidence and **STOP**. Wait for the user to tell you to continue. Do not launch 20 phases automatically in one giant context/window. This is a deliberate control to preserve quality.
9. On any error, fix the actual cause and rerun tests; never edit tests simply to force them green or report unrun checks as passing. If tool limitations prevent verification, say `UNVERIFIED` with reason.
10. Do not implement or modify frontend/dashboard pages in this backend scope.

## Stop format after each phase
- Phase and status: VERIFIED / BLOCKED / IN_PROGRESS.
- Source requirements and decisions addressed.
- Actual files changed and migrations.
- Modules, API endpoints and contracts implemented (only if really working).
- Actual tests and tool command outputs, including failures.
- Security/data integrity risks.
- Remaining blockers and concrete next eligible phase.

## Sensitive rules
- Default-deny auth and role checks; no hard-coded credentials; don't assume `IT_ADMIN` / `SOFTWARE_MANAGER` permissions without business approval.
- Preserve relational integrity (1 contract-many POs, 1 PO-many lines, 1 PO-many invoices, 1 asset-many movements). Do not replace historical issue/return rows.
- Protect financial records. Do not convert currencies implicitly or compute remaining budget with double-counted committed+actual money. Do not post/reverse ledger entries without approved D03–D08 policies.
- Use database constraints and transactions for concurrent issuance/return, payments and budget events. No destructive DB resets against existing data.
- Signed organizational PDF/Excel templates are required to claim final document compliance; generated generic PDFs are not substitutes.
- Server is on-prem LAN, not a user dashboard. The source documents do not prescribe the exact number of dashboards.

### START NOW
Read source documents and all planning files. Resume the first incomplete eligible backend phase (normally P00). Follow the phase exit gate and STOP with your evidence report.

---

## For subsequent sessions (paste this short instruction only)
`Continue the next eligible backend phase strictly following requirements/CURSOR_MASTER_PROMPT.md and requirements/IMPLEMENTATION_STATUS.md. Re-read the affected PDFs and reference/phase files, implement and test only that phase, update status and stop at the phase gate.`

## If you want Cursor to prepare a global plan without touching code
`Read both requirement PDFs and all requirements/*.md files. Produce a dependency-aware implementation overview and blocker list, but do not implement anything yet.`
