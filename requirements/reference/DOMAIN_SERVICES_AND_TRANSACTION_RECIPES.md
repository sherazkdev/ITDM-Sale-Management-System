# Domain Services, Invariants and Transaction Recipes (Implementation Supplement)

**Read with:** `DATA_MODEL_BLUEPRINT.md`, `ENGINEERING_STANDARDS.md`, `DECISION_REGISTER.md` and the owning phase files. All flows below are proposed technical implementations pending business policy. Pseudocode is illustrative, not runnable code. If a transaction detail conflicts with an approved decision, update this document.

## 1. Cross-module service method matrix

| Domain | Service methods (proposed) | Persistence boundary | Main invariant |
|---|---|---|---|
| Users/auth | `login`, `logout`, `getCurrentSession`, `revokeSessions`, `createUser`, `setRoles` | Auth user, session and role joins | Only permitted and active principal performs sensitive action |
| Employees | `createEmployee`, `updateEmployee`, `getEmployee`, `listEmployees`, `deactivateEmployee` | employees | Unique employee number, historical references retained |
| Vendors | `registerVendor`, `updateVendor`, `findVendor`, `archiveVendor` | vendors | Procurement history keeps vendor references |
| Asset categories | `createCategory`, `renameCategory`, `listCategories` | asset_categories | Valid category on every asset |
| Assets | `registerAsset`, `updateAssetMetadata`, `findByCode`, `listAssets`, `getAssetTimeline` | assets | Manually entered unique code; state cannot bypass lifecycle |
| Contracts | `createContract`, `changeDraftContract`, `getExpiringContracts`, `recordRenewal` | contracts | 1:N contracts to POs; date coherence |
| Purchase orders | `createDraftPO`, `addOrUpdatePOLine`, `submitPO`, `approvePO`, `cancelPO`, `getPO360Base` | PO and lines | Atomic lines/totals, no unauthorized post-approval edit |
| Issuance | `issueAssets`, `returnAssets`, `listCurrentAssignments`, `getAssetHistory` | asset transactions, document headers/lines, asset projection | Same asset cannot have two current holders |
| Invoices | `createInvoice`, `postInvoice`, `voidInvoice`, `getBalance`, `recordPayment`, `reversePayment` | invoice/payments | Money posted exactly once; outstanding reconciles |
| Budget | `createYear`, `allocateBudget`, `commitPurchase`, `realizeExpense`, `releaseCommitment`, `reverseExpense`, `reconcileBudget` | allocations + append-only ledger | Available funds computed once from authoritative event ledger |
| Maintenance | `createMaintenance`, `assignMaintainer`, `completeMaintenance`, `listByAsset` | maintenance_records, optional asset state | No unsupported state transition/negative cost |
| Licenses | `registerLicense`, `updateLicense`, `getExpiringLicenses`, `renewLicense` | software_licenses and approved history | No key material disclosed, date/quantity valid |
| Documents | `uploadPrivateFile`, `downloadAuthorized`, `generateForm`, `getDocumentVersions` | stored_documents + template/revision metadata | File access scoped and original transaction data preserved |
| Global search | `searchIdentifiers`, `purchaseOrderOverview`, `searchAssetCode` | authorized SQL projections | No cross-role sensitive data leak |
| Notifications | `scanForExpiry`, `emitReminder`, `listNotifications`, `markRead` | notification events/attempts | Deduplicated expiry event per approved schedule |
| Reports | `assetRegister`, `invoiceSummary`, `budgetUtilization`, `exportReport` | read models + file metadata | Financial numbers reconcile to same canonical ledger |
| Audit | `appendAudit`, `findAuditEvents` | audit_logs | Actor/result/time provenance remains stable |

## 2. Asset issuance — atomicity recipe (P09)

### Pre-validation
- Principal has appropriate `assets.issue` permission; employee/department receiver allowed by approved D10.
- `assetIds` nonempty and unique; cap max assets per form; request includes approved reference format/idempotency key.
- Each selected asset exists and is in allowed state; receiver eligible, not deactivated according to policy.

### Critical transaction
```text
transaction at appropriate isolation:
  lock asset rows in sorted ID order or obtain unique active-assignment locks
  for each asset: re-read current status/holder inside transaction
  if any already issued or unavailable -> ROLLBACK with 409
  create issuance document header once
  for each asset:
    append ISSUE transaction (actor from session, date, condition, document ref)
    insert issuance document line referencing transaction and asset
    update current location/holder projection using guarded conditional update
  append required audit event(s)
commit
return document ID, assets and reference
```
- IMPORTANT: Any failure must rollback **all** asset assignments; never issue 2 out of 3 unless explicit partial-issue workflow is approved.
- Concurrent requests must not both succeed. Use database constraint/lock + verified concurrency integration tests, not read-then-write race.
- Document header+line tables are proposed by DB p3 but exact columns remain to be approved.

### Return recipe
```text
transaction:
  locate active issue(s) with lock
  verify returned asset belongs to the claimed holder and is not already returned
  create return header, append RETURN movement rows, link return lines
  update current holder/status projection with guard
  audit
commit
```
- Partially returning a multi-asset issue leaves remaining assets assigned. Re-issue after return creates a *new* ISSUE row; never change old rows.

## 3. PO lines → invoices → budget (P08, P10, P11)

### Purchase order totals
- Use decimal math, line quantity and unit price; reconcile `total_amount` according to approved taxes/discounts/rounding rules.
- If approval enabled, approved PO is immutable except explicitly audited amendment with event reconciliation; cancellation must check invoice/asset/budget dependencies.
- Link `assets.purchase_order_id` to source PO and optionally `purchase_order_line_id` to line after schema approval.

### Invoice partial payment
```text
transaction:
  lock invoice / payment aggregate
  verify invoice is eligible for posting/payment per D05
  check duplicate idempotency key or payment reference
  compute already-posted paid amount using decimal values
  validate new amount within approved remaining ceiling
  insert append-only payment event
  recompute derived paid/outstanding and any invoice status projection
  send approved budget event if D06 says actual on payment
  append audit
commit
```
- Do not let request PATCH `payment_status` to force PAID.
- Reversals are distinct audited entries; posted payment records cannot be silently deleted.
- If D06 defines actual at invoice posting, payment must **not** duplicate actual expense.
- Partial invoices: many `invoices` link to the same `purchase_order_id`; overbilling and invoice line allocation rules must be approved.

### Budget example — mathematical integrity
Illustrative proposal (not approved policy): budget allocated **100.00**; purchase commitment **60.00**; actual recognized **20.00** against that commitment. Then:
- Open commitment (encumbered) = **40.00**
- Actual expenditure = **20.00**
- Available = **100.00 - 40.00 - 20.00 = 40.00**
- Incorrect: `100 - original commitment 60 - actual 20 = 20` (double count).
- When unused purchase commitment 40 is released due to a qualified cancellation, available becomes 80 (40 actual spent). Each change must have one source event + compensating event.

Do **not** implement this scenario as binding business rules until D03, D05–D08 decisions signed.

### Generic ledger recipe
```text
transaction:
  lock budget allocation row(s) in stable order
  check idempotency by (source type, source id, event kind, version)
  validate same-currency or approved conversion / date policy
  load prior ledger events and derive available/committed/actual
  validate funding / state / event transition
  insert new ledger event(s) with source links and actor
  append audit event(s) and update optionally derived projection
commit
```
- Query reconciliation: total by financial year == sum by categories == sum by source records (subject to explicit shared allocations). No floating-point arithmetic.
- Track corrections as ledger entries, not destructive updates.

## 4. Purchase order 360 read-model (P15)
- Input: PO number (user-entered), normalized according to identifier policy; no direct SQL interpolation.
- Authorize PO existence and basic visibility first; query parent PO then resolve vendor, optional contract, lines, invoice/payment totals, physical assets, asset transactions with employee refs, maintenance, licenses, document metadata and budget ledger.
- Use a bounded number of indexed queries, `select` columns and capped related collections; distinguish null/no record from permission denied.
- Return separate typed sections and safe links to scoped document downloads, not filesystem paths.
- For finance-ineligible role, redact/omit budget/cost sections; test redaction for nested fields and exports.

## 5. Expiry dedup and delivery (P16)
```text
job(asOfBusinessTime):
  query contract and license expiry dates plus approved PO expiry field
  for each due threshold and approved recipient:
    dedupKey = targetType + targetId + threshold + recipient + channel
    insert notification with unique dedupKey (upsert DO NOTHING on duplicate)
    deliver using worker with retry/delivery-attempt records
```
- Do not run PO expiry workflow without an approved PO expiry definition. Ensure time boundaries, daylight transitions (if applicable), status cancellation, worker concurrency and recoverability tested.

## 6. Transaction/audit/outbox consistency
- Use same DB transaction for critical state + audit rows; if external notifications required, persist an outbox row inside transaction and deliver asynchronously so external email failure cannot rollback a completed financial event.
- Retry with bounded policy and dedupKey; don't require Redis until scaling and operational constraints justify it.
- Preserve intentional service boundaries: services call other domain services through explicit interfaces; never make HTTP calls between modules of the same monolith solely to reach internal business logic.
