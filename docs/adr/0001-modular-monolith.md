# ADR 0001 — Modular Monolith Backend Architecture

**Status:** Accepted (engineering proposal — not specified in client PDFs)  
**Date:** 2026-10-28  
**Phase:** P00  
**Deciders:** Backend implementation team (pending stakeholder sign-off on deployment details D17)

## Context

The IT Department Management System (ITDMS) must support procurement, inventory, issuance, invoicing, budgeting, maintenance, licensing, documents, search, reporting, and security on an on-premises LAN (R01, R11, R12). Source documents describe capabilities and an initial 13-table relational model; they do not prescribe application topology or framework choices.

## Decision

Implement a **single deployable backend** (`apps/api`) as a **modular monolith**:

- **Runtime:** Node.js with Express and TypeScript (`strict`).
- **Persistence:** PostgreSQL with Prisma migrations (schema authored in P02+).
- **Validation:** Zod at HTTP boundaries; typed domain errors.
- **Testing:** Vitest + Supertest; integration tests against real PostgreSQL in CI/local.
- **Structure:** Feature modules under `apps/api/src/modules/<domain>/` with `routes → controller → service → repository`, shared cross-cutting code in `src/shared/`.
- **API:** Versioned REST under `/api/v1` with documented OpenAPI once endpoints exist.
- **Frontend:** Deferred; optional `apps/web` later in the same repository.

Microservices, message queues, and Redis are **out of scope** until measured need (per `ENGINEERING_STANDARDS.md`).

## Consequences

**Positive**

- One transaction boundary for PO → invoice → budget and issue → return workflows (R14–R18).
- Simpler on-prem operations, backup, and LAN deployment (R01, R19).
- Clear module boundaries without network split complexity.

**Negative / risks**

- Scale-out is vertical-first; heavy report/export load may later need read replicas or background jobs (P18/P16).
- Discipline required so modules do not become a “big ball of mud” — enforce layer rules in review.

## Alternatives considered

| Alternative | Rejected because |
|---|---|
| Microservices per domain | Overhead for on-prem IT dept scale; cross-domain transactions harder |
| Monolithic MVC without modules | Poor long-term maintainability for 15+ domains |
| Django/Java stack | Valid options; kit standardizes on Node/TS for typed full-stack continuity |

## Related requirements

- R01 (LAN/on-prem), R09 (unified relational DB), R11 (auth/audit), R13 (modular/maintainable).
- Deployment specifics remain **OPEN** (D17).

## Follow-up

- P01: scaffold `apps/api`, Docker Compose PostgreSQL, health checks.
- P02: Prisma schema from approved `docs/db-schema-proposal.md` baseline only where decisions allow.
