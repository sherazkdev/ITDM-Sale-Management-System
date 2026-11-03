# Cross-Module Test Matrix (Planned Acceptance Evidence)

| ID | Acceptance scenario | Expected behavior | Phases |
|---|---|---|---|
| T01 | User lacking `budgets.read` GETs budget and PO global search | No sensitive money fields or unauthorized export; 403/field filtering policy approved | P03,P11,P15,P18 |
| T02 | Two concurrent requests issue same physical asset | Exactly one succeeds; other gets 409; one current holder; full history | P09 |
| T03 | Duplicate manually entered asset_code, including case/whitespace normalization | DB uniqueness and safe 409; no duplicate row | P06 |
| T04 | Vendor → contract → PO with multiple lines → physical assets | All parent-child relationships work with referential integrity | P05–P08 |
| T05 | Multiple partial invoices for one PO | Correct invoice total and payment outstanding; approved overbilling policy enforced | P10 |
| T06 | Invoice partially paid and then payment repeated with same idempotency key | Posted once, outstanding consistent, audit recorded | P10 |
| T07 | PO commitment, partial actual, cancellation/reversal | Budget accounting never double-counts; available balance reconciles | P11 |
| T08 | Unsupported currency against budget | Reject or convert only per signed policy; never silently add unlike currency | P11 |
| T09 | Return unissued asset or duplicate return | 409; no incorrect inventory changes or lost movement history | P09 |
| T10 | Multi-asset issuance form, partial return, reissue | Document/line/transaction IDs link; history preserved | P09,P14 |
| T11 | Contract expires; job runs twice | One deduplicated reminder per target/threshold/channel per approved policy | P16 |
| T12 | PO number global search | Returns linked PO, contract, vendor, invoice, assets, movement, license, maintenance, budget and document refs as permitted | P15 |
| T13 | Expired session or privilege downgrade during request | Correct auth denial; no sensitive response | P03 |
| T14 | PDF template / Excel export generated and downloaded | Correct organizational template/version and authorized data; safe file path | P14,P18 |
| T15 | File upload with traversal path, spoofed MIME, oversize file | Rejected, cannot access files outside private storage | P14 |
| T16 | Restore encrypted database backup to isolated environment | Recover relational integrity, verify sample reports and records | P17,P19 |
| T17 | Database unresponsive | Readiness fails; liveness remains useful; non-sensitive errors | P01,P19 |
| T18 | Asset maintenance while issued vs unissued | Follows approved state policy, no contradictory current assignment | P12 |
| T19 | Financial delete/change after posting | Controlled correction/reversal and audit, no silent destructive update | P10,P11,P17 |
| T20 | CSV/XLSX injection-like cell content in export | Escaped/treated as data; no active formulas derived from user strings | P18 |

## Test implementation guidance
- Prepare deterministic fixtures for two vendors, one contract, two POs, several lines, three assets, two employees, two invoices with payments and one financial year/budget.
- Property/invariant tests: unique asset assigned no more than once; sum of posted payments ≤ approved invoice net (unless policy defines refunds); each finance entry reconciles to source event; no orphan FKs.
- Integration: real temporary DB with migration up, API test running auth & permissions; isolate test data and tear down only test DB.
- Performance: seed representative records, assert indexed search plans, set target latency only after real server capacity/workload is known.
- Security: auth bypass, IDOR, mass assignment, SQL injection via API (ORM-parametrized), upload path safety, session cookie CSRF, report leakage.
- Backup drill evidence: backup filename/time, restore command in test environment, counts/constraints checked and restore report saved.
