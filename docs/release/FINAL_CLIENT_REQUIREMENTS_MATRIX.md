# Final Client Requirements Matrix (Wave 5)

**Project:** ITDMS (`D:\ITDM-Sale-Management`)  
**Audit date:** 2026-11-03  
**Authority:** BO/DB PDFs (`requirements/Background and Objective.pdf`, `requirements/Database structure.pdf`), `SOURCE_TRACEABILITY.md`, client answers Nov 3 2026 (Wave 2 brief), `CLIENT_DECISION_REGISTER.md`, Wave 1–4 reports  

**Legend**

| Status | Meaning |
|--------|---------|
| **VERIFIED IMPLEMENTED** | Code + automated test or gate evidence |
| **IMPLEMENTED BUT NOT VERIFIED** | Built; weak or no dedicated E2E |
| **PARTIAL** | Known gaps; see notes |
| **CLIENT-DEPENDENT** | Blocked on decision, template, or policy |
| **NOT IMPLEMENTED** | Out of scope or explicitly not built |

---

## R01–R19 source requirements

| ID | Requirement (summary) | Status | Backend / API | Frontend | Tests / evidence | Client deps |
|----|------------------------|--------|---------------|----------|------------------|-------------|
| **R01** | Browser app on in-house server / LAN | **IMPLEMENTED BUT NOT VERIFIED** | Express API, health | Next proxy | Runbooks; staging smoke | D17 hosting; Windows checklist only |
| **R02** | Employee records | **VERIFIED IMPLEMENTED** | `employees` module | `/employees` | API + Playwright | D18 dept master optional |
| **R03** | Inventory categories, serials, location, codes | **PARTIAL** | `assets`, `non_asset_stock_items` | `/assets`, non-asset detail | Wave 3 inventory E2E; API | **D09** no consumption |
| **R04** | Vendors, contracts, POs, attachments, expiry | **PARTIAL** | P05–P08, P14, P16 | Full CRUD routes | Procurement tests | D03 SAP approval; D04 PO expiry semantics |
| **R05** | Invoices, balances, payment status | **PARTIAL** | `postInvoice`, payments, ledger | `/invoices/[id]` | Wave 2/3 finance tests | D05 credits; **remainingUsd** formula |
| **R06** | Licenses, maintenance | **PARTIAL** | CRUD modules | UI modules | API tests | D21 renewal; D19 SLA optional |
| **R07** | Issue/return, history, condition | **PARTIAL** | P09 movement docs + transactions | `/asset-issuance`, `/asset-history` | Concurrency + E2E | **D10** dept holder; **D11** statuses; **D12** forms |
| **R08** | Budget committed/actual/utilized/remaining | **PARTIAL** | Wave 2 ledger types | `/budgets` + provisional notice | `wave2-finance.test.ts`, Wave 3 E2E | **D06–D08** remaining formula |
| **R09** | Unified DB, PO search hub | **VERIFIED IMPLEMENTED** | Search service | `/search` | Integration tests | — |
| **R10** | Org PDF/Excel templates | **PARTIAL** | `/api/v1/reports/*` operational | `/reports` | `extended-modules.test.ts`; Wave 5 new routes | **D12** official layouts |
| **R11** | Auth, RBAC, audit | **PARTIAL** | Sessions, permissions | `/login`, `/admin` | Security gate tests | **D01**, **D02**, D22 |
| **R12** | Backup & recovery | **PARTIAL** | CLI scripts | — | Restore rehearsal Wave 3 | **D17** schedule/RPO |
| **R13** | Modular maintainable system | **VERIFIED IMPLEMENTED** | Modular monolith | App router | ADR, phase reports | — |
| **R14** | Contract ≠ PO; 1:N POs | **VERIFIED IMPLEMENTED** | Schema + services | UI | Procurement tests | — |
| **R15** | PO multi-line | **VERIFIED IMPLEMENTED** | `purchase_order_lines` | PO detail UI | `po-line.test.ts` | PO **report** lines N/A in export |
| **R16** | Multi/partial invoices per PO | **VERIFIED IMPLEMENTED** | Invoice + payments | UI | Finance tests | — |
| **R17** | Issuance doc multi-asset | **VERIFIED IMPLEMENTED** | Movement docs/lines | Issuance UI | P09 tests | D12 PDF template |
| **R18** | Append-only transactions; no double count | **VERIFIED IMPLEMENTED** | Transactions + budget links | — | Finance + movement tests | Ledger semantics partial for remaining |
| **R19** | Controlled template document refs | **PARTIAL** | `stored_documents` | `/documents` | Upload tests | D12 artwork |

---

## Wave 5 report catalog (operational exports)

| Report | XLSX/CSV | Data scope | Status | Notes |
|--------|----------|------------|--------|-------|
| Asset register | Yes | Serialized assets | **VERIFIED IMPLEMENTED** | `GET /reports/asset-register` |
| Inventory (asset + non-asset) | Yes | Qty + status | **VERIFIED IMPLEMENTED** | Wave 1 + 3 |
| Budget utilization | Yes | USD committed/actual/remaining columns | **PARTIAL** | `remainingUsd` = allocated − actual paid only |
| Purchase orders | Yes | Header fields | **PARTIAL** | Lines not in export |
| Contracts | Yes | Register | **VERIFIED IMPLEMENTED** | — |
| Invoices / expenditure | Yes | Wave 5: currency, post, commitment USD, paid USD | **PARTIAL** | Provisional commitment when rate missing |
| Asset movements | Yes | **Wave 5** issuance/return lines | **IMPLEMENTED BUT NOT VERIFIED** | Non-official D12 |
| Employees | Yes | **Wave 5** master register | **IMPLEMENTED BUT NOT VERIFIED** | R02 reporting aid |
| Issuance/return **official** PDF | No | — | **CLIENT-DEPENDENT** | `ASSET_MOVEMENT_TEMPLATE_INTEGRATION.md` |

All exports: header `X-ITDMS-Export-Disclaimer: NON-OFFICIAL-D12`.

---

## Financial rules (confirmed — do not reinterpret)

| Rule | Status | Code anchor |
|------|--------|-------------|
| Post → budget **commitment** | **VERIFIED IMPLEMENTED** | `invoice.service.ts` `postInvoice`, `COMMITTED_INVOICE` |
| **Actual paid** = payment rows only | **VERIFIED IMPLEMENTED** | `ACTUAL_PAYMENT`, `recordPayment` |
| Manual FX; USD reporting | **VERIFIED IMPLEMENTED** | `fx-conversion.ts`, payment/post rates |
| Partial payments + idempotency | **VERIFIED IMPLEMENTED** | `wave2-finance.test.ts`, Wave 3 E2E |
| `remainingUsd` excludes committed unless client defines otherwise | **CLIENT-DEPENDENT** | `budget.service.ts` — notices retained |
| Non-USD commitment without post rate | **PARTIAL** | `PROVISIONAL_COMMITMENT_USD` in exports |
| Reversals / credits | **NOT IMPLEMENTED** | — |

---

## Inventory & movement (Wave 5)

| Capability | Status | Evidence |
|------------|--------|----------|
| Serialized asset CRUD + unique code | **VERIFIED IMPLEMENTED** | API + UI |
| Non-asset stock entry, units, PO link | **VERIFIED IMPLEMENTED** | Wave 3 |
| Qty consumption / withdrawal | **NOT IMPLEMENTED** | D09 |
| Non-asset dept issuance | **NOT IMPLEMENTED** | D09/D10 |
| Employee issue/return | **VERIFIED IMPLEMENTED** | E2E issuance |
| Asset transaction history | **VERIFIED IMPLEMENTED** | DB + UI asset history |
| Official signed forms | **CLIENT-DEPENDENT** | D12 |

---

## Workflows & access

| Topic | Status | Notes |
|-------|--------|-------|
| Single initial full-access user | **PARTIAL** | `WAVE1_INITIAL_ADMIN_SETUP.md` |
| RBAC infrastructure | **VERIFIED IMPLEMENTED** | Permission middleware |
| SAP / in-app PO approval | **NOT IMPLEMENTED** (by design) | D03 |
| ITDMS PO status (draft) | **VERIFIED IMPLEMENTED** | 403 on approve endpoints |
| Audit on exports | **VERIFIED IMPLEMENTED** | `report.service.ts` `logExport` |
| External contract/license renewal | **CLIENT-DEPENDENT** | Reminders in-app only |

---

## UI / branding (record only)

| Wave 4 premium UI | **VERIFIED IMPLEMENTED** | No Wave 5 UI changes |
| Wave 4B fidelity | **VERIFIED IMPLEMENTED** | Regression preserved |

---

## Sign-off rule

No row marked **VERIFIED IMPLEMENTED** without cited test or gate output in `WAVE5_BUSINESS_CLOSURE_REPORT.md`.
