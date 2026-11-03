# Decision Register — ASK CLIENT / BUSINESS OWNER

**Rule:** Every choice below is either unresolved or **PROPOSED**. Cursor must not silently adopt one as an approved client requirement. Affects-feature blockers prevent production behavior; safe scaffolding and tests using explicit draft policies are permitted only if clearly labeled and not presented as finalized functionality.

| ID | Question | Suggested option (not approved) | Severity / block | Approved decision / date |
|---|---|---|---|---|
| D01 | Exact user roles and permissions? Are IT Admin / Software Manager roles distinct? | Seed configurable permissions, deny by default | **BLOCKS** authorization policies | OPEN |
| D02 | Does application require internal directory/LDAP/SSO, or local accounts? | Local securely stored sessions initially | **BLOCKS** auth integration choice | OPEN |
| D03 | PO lifecycle: draft/approved/received/cancelled? Approval authority? | Explicit state machine | **BLOCKS** posting, commitment | OPEN |
| D04 | What does 'PO expiry' mean? POs have no expiry field in baseline table | Optional validity date or delivery deadline | **BLOCKS** PO expiry alerts | OPEN |
| D05 | How are invoice partial payments, outstanding and credit notes calculated? | Payment ledger linked to invoice | **BLOCKS** financial posting | OPEN |
| D06 | When does 'actual expenditure' arise: invoice approved or payment settled? | Documented accounting policy | **BLOCKS** budget aggregates | OPEN |
| D07 | What exactly reserves/reduces budget? Committed vs actual; cancellations, reversals? | Event-sourced-style explicit ledger | **BLOCKS** budget spend rules | OPEN |
| D08 | Currency types/FX rates/date rules? | One budget currency; cross-currency block pending policy | **BLOCKS** multi-currency sums | OPEN |
| D09 | Are some items bulk consumables; how are quantities allocated? | Separate stock ledger vs serialized assets | **BLOCKS** quantity-based stock workflow | OPEN |
| D10 | Can asset issue/return target departments directly? Who is receiver? | Holder type employee or department | **BLOCKS** issuance schema | OPEN |
| D11 | Asset condition/status values, repair/retire/lost rules, partial return? | Controlled enums/state transitions | **BLOCKS** transition policies | OPEN |
| D12 | Organization-approved PDF/Excel templates, fields and numbering? | Get actual editable examples | **BLOCKS** final formatted exports | OPEN |
| D13 | Attachments types, max sizes, retention rules, virus scanning? | PDF/images only; strict limits, private storage | **BLOCKS** file policy | OPEN |
| D14 | Notification channels and lead times for contracts, licenses, PO? | In-app daily scheduler with configurable threshold | **BLOCKS** reminder policy | OPEN |
| D15 | Numbering rules / uniqueness for PO, invoice, document reference and contracts? | Unique scoped identifiers, prevent collision | **BLOCKS** critical identifiers | OPEN |
| D16 | Should deletes be soft deletes / retention and legal archiving? | No hard delete for linked transactions | **BLOCKS** deletion policy | OPEN |
| D17 | Exact operating system/server hardware, internal DNS, TLS, backup storage / schedule? | On-prem Compose, reverse proxy, off-host backup | **BLOCKS** production deployment | OPEN |
| D18 | Employee department normalized master table vs existing text field? | Keep PDF field, consider table after confirmation | Optional architectural decision | OPEN |
| D19 | Maintenance contract SLA, cost approvals, vendor invoicing links? | Basic records first | Optional advance behavior | OPEN |
| D20 | Historical Excel imports, duplicates, initial data owners? | Stage/import/validate with dry-run | **BLOCKS** data migration | OPEN |
| D21 | License key protection/encryption access vs reference only? | Do not store raw keys by default | **BLOCKS** secrets policy | OPEN |
| D22 | User password reset / account verification / MFA required? | Admin-provisioned accounts + reset workflow | **BLOCKS** final account policy | OPEN |
| D23 | Timezone, fiscal year boundaries, date-only semantics? | Company timezone, explicit fiscal windows | **BLOCKS** scheduled finance reports | OPEN |
| D24 | Multi-company or single company / branches / locations? | One org + location field initially | Optional scope decision | OPEN |

## P00 phase impact map (2026-10-28)

| ID | Stops P02 migration detail | Stops later phases / endpoints |
|---|---|---|
| D01 | Auth/RBAC tables optional in P02; **do not seed roles as facts** | P03+ all protected routes |
| D02 | Session vs SSO schema | P03 login integration |
| D03 | PO `status` enum values only as draft | P08 approve/cancel; budget commit |
| D04 | **No** `purchase_orders.expiry_date` column | P16 PO expiry alerts |
| D05 | **No** `invoice_payments` until approved | P10 post/pay/balance |
| D06–D08 | Budget `transaction_type` semantics draft only | P11 summaries; P18 finance reports |
| D09 | **No** stock/consumable tables | P06 quantity workflows |
| D10 | **No** department holder FK until approved | P09 issue/return recipient |
| D11 | Asset status enum provisional | P09/P12 transitions |
| D12 | Generic PDFs only in dev | P14/P18 compliance exports |
| D13 | Upload module stub without policy | P14 uploads |
| D14 | No scheduled reminders | P16 |
| D15 | Unique scope rules documented as TBD | All numbered entities |
| D16 | Default RESTRICT + soft archive proposal | Delete endpoints |
| D17 | Does not block P01 local Docker | P19 production |
| D18 | Keep `employees.department` text | Optional `departments` table |
| D19–D24 | As marked optional/blocked in table above | See severity column |

## Source document audit (P00)

Both PDFs in `requirements/` were read end-to-end on 2026-10-28; traceability in `SOURCE_TRACEABILITY.md` confirmed against BO (4 pp) and DB (4 pp).

## Change management
For each answer add: date, approver role, rationale, exact affected tables/endpoints/phase IDs, backward-compatibility concerns and test cases. If an answer arrives after a migration, create a migration plan; never edit production history destructively.

## Safe progress vs blockers
- Allowed while open: source audit, repo setup, domain module skeletons, read-only lookups using confirmed fields, proposals documented as drafts.
- Not allowed to be marked 'complete' while open: money posting, approval side effects, sensitive authorization policies, formal document formats, automatic expiry logic without expiry source.
- Do not seed business policies presented as facts; separate experimental fixtures from live policy.
