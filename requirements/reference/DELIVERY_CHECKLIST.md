# Production / Client Acceptance Checklist

## Product acceptance
- [ ] All seven BO core modules demonstrable with linked data.
- [ ] PO-number global lookup shows relevant records in authorized consolidated response.
- [ ] Asset manually assigned code unique; issuance and returns are traceable and never rewrite history.
- [ ] Contract / license / defined PO expiry notifications work according to approved policy.
- [ ] Multiple invoices / partial invoices and money reconciliation match signed business rules.
- [ ] Annual allocation, committed, actual and available totals independently reconciled with ledger.
- [ ] Organization-provided sample PDF/Excel templates used and signed off.
- [ ] Access permissions approved for all relevant organization roles and sensitive fields.

## Technical acceptance
- [ ] Database migrations reviewed and applied in staging; safe deployment/rollback described.
- [ ] Real tests pass including concurrency, payment, search and security permission scenarios.
- [ ] OpenAPI, module runbooks and environment README match actual deployed system.
- [ ] Internal DNS / HTTPS / reverse proxy, firewall rules and no unintended public exposure.
- [ ] PostgreSQL and attachments persistence volumes protected; encrypted off-host backups.
- [ ] Backup **restoration drill** completed and documented, with retention policy and recovery objectives.
- [ ] Minimum-privilege service accounts, credential rotation, secure headers, CSRF controls if cookie auth.
- [ ] Audit log search, retention, redaction, immutable/append-only handling for financial events.
- [ ] Logging/health monitoring, job retry/deduplication, failure alerts and disk-space monitoring.
- [ ] Sample data import verified or explicitly out of scope, data-owner sign-off recorded.
- [ ] Known limitations, dependencies and unresolved decisions documented before go-live.

## After backend completion
- Next.js dashboards and UX are a **separate future implementation scope**; backend readiness is not full product delivery.
