# Engineering Standards / Do Not Skip

## Software boundaries
- `apps/api/src/modules/<module>/`: `routes`, `controller`, `service`, `repository`, `schema` (Zod), `types`, tests; group by feature, not all controllers in one massive folder.
- `src/shared/`: configuration, dependency wiring, auth policies, http errors, logging, DB client, transactions, pagination, response adapters, upload security, test helpers.
- Controller: parse route/input and map output; **no SQL and no business decisions**.
- Service: orchestrate business policy and transactions, throw typed domain errors; dependency injection for repositories/services.
- Repository: database access and query composition; no response objects. DB unique violation and FK errors can be mapped by boundary adapter into domain/application errors.
- Middleware: authentication, permission checks, Zod parsing, rate limiting and correlation IDs. Permission enforcement also verified inside sensitive business services.

## Transactions and lifecycle
- Atomic transitions: issue an asset / return an asset / approve PO / post invoice / financial entry must be all-or-nothing.
- Use Postgres transactions and concurrency controls suitable for isolation requirements; do not rely on front-end button disable.
- Reject invalid state transitions with HTTP 409. Use idempotency key or robust natural uniqueness for replay-prone POSTs and jobs when needed.
- Historical records are not overwritten; corrections must be separately authorized and auditable.
- Deletions: soft/archive or prevent based on D16; never cascade history loss.

## Security
- LAN-only **does not replace** authentication, least privilege or TLS; enforce secure cookie/session, CSRF protection if cookie auth, rate limits at login, strong password hashing or approved SSO.
- Don't place raw DB URLs, API secrets, reset tokens, credentials or software license keys in responses, logs, fixtures or git.
- Audit actor, action, target, previous/new safe fields, timestamp, correlation ID, result, permission context; redact secrets.
- Validate request bodies, URL params, queries, uploaded media types; cap sizes and query results; parameterize DB access.
- Access by scoped permissions, not UI visibility. No role bypass through global search, export or document downloads.
- Do not expose local storage paths in API responses. Files need private storage, randomized paths, content validation, authorized download.
- Plan dependency vulnerability review, secrets rotation, on-prem TLS, firewall network segmentation, backup encryption.

## Quality and testing
- Unit tests: service business rules and error states with typed fakes.
- Integration tests: ephemeral/test Postgres, real Prisma queries, constraints, transactions, concurrency cases.
- HTTP tests: Supertest authn/authz, validation, success, conflict and not-found.
- Cross-feature tests for PO → invoice → budgets and asset → issue → return → maintenance.
- No 'mock that always returns success' as substitute for integration, and no claims of executed tests without logs.
- Machine-verifiable gates: eslint, TypeScript `tsc --noEmit`, test runner, build, DB migration status, relevant security checks.

## API / runtime standards
- Versioned API `/api/v1` and typed validation. OpenAPI contract generated/maintained with actual implementation; docs can be draft before endpoint exists.
- Consistent timestamps and date-only values, decimal money, limited pagination and stable sort with indexes; avoid N+1 global-search queries.
- Structured logs include requestId, principalId, duration, route, status, but never secrets or entire sensitive payloads.
- Health checks separate process liveness vs DB readiness; no public detailed infrastructure diagnostics.
- Environment fail-fast validation; test and local config separate from production. Keep `.env.example`, redact actual secrets.
- No premature Redis/queues/microservices. Use scheduled durable work if P16 needs it, with database deduplication; add infrastructure only after measured need.

## Scope control / source honesty
- Requirements in PDFs are authoritative; technology choices and endpoint paths in kit are proposals.
- For ambiguities, create an explicit decision table and stop feature requiring approval; never silently treat draft as final.
- End every phase with changed-file list, actual commands/output and blockers; don't start later phases automatically.
