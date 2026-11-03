# Full Proposed API Surface — Backend Only

> **All paths and permissions are PROPOSED**, not prescribed by the PDFs. Check decision register before implementing approval/financial action endpoints. Track actual implemented endpoints in OpenAPI. Controllers remain thin; never copy business logic into route handlers.

| Phase | Method | Endpoint | Service/use case | Required permission candidate |
|---|---|---|---|---|
| P01 | GET | `/api/v1/health/live` | process liveness | internal or safe public |
| P01 | GET | `/api/v1/health/ready` | DB readiness | internal or safe public |
| P03 | POST | `/api/v1/auth/login` | login | anonymous, throttled |
| P03 | POST | `/api/v1/auth/logout` | logout | authenticated |
| P03 | GET | `/api/v1/auth/me` | current identity | authenticated |
| P03 | GET | `/api/v1/users` | list users | `users.manage` |
| P03 | POST | `/api/v1/users` | provision | `users.manage` |
| P03 | PATCH | `/api/v1/users/:id` | modify user | `users.manage` |
| P03 | PUT | `/api/v1/users/:id/roles` | roles | `users.manage` |
| P04 | GET | `/api/v1/employees` | list/filter employees | `employees.read` |
| P04 | GET | `/api/v1/employees/:id` | employee detail | `employees.read` |
| P04 | POST | `/api/v1/employees` | create | `employees.write` |
| P04 | PATCH | `/api/v1/employees/:id` | update | `employees.write` |
| P04 | POST | `/api/v1/employees/:id/deactivate` | deactivate | `employees.write` |
| P05 | GET | `/api/v1/vendors` | list | `vendors.read` |
| P05 | POST | `/api/v1/vendors` | create | `vendors.manage` |
| P05 | GET | `/api/v1/vendors/:id` | detail | `vendors.read` |
| P05 | PATCH | `/api/v1/vendors/:id` | update | `vendors.manage` |
| P06 | GET | `/api/v1/asset-categories` | list | `assets.read` |
| P06 | POST | `/api/v1/asset-categories` | create | `assets.manage` |
| P06 | GET | `/api/v1/assets` | list/filter | `assets.read` |
| P06 | POST | `/api/v1/assets` | register manually coded asset | `assets.manage` |
| P06 | GET | `/api/v1/assets/:id` | detail | `assets.read` |
| P06 | PATCH | `/api/v1/assets/:id` | update metadata | `assets.manage` |
| P06/P09 | GET | `/api/v1/assets/:id/history` | movements/maintenance | `assets.read` |
| P07 | GET | `/api/v1/contracts` | list/filter | `contracts.read` |
| P07 | POST | `/api/v1/contracts` | create | `contracts.manage` |
| P07 | GET | `/api/v1/contracts/:id` | detail | `contracts.read` |
| P07 | PATCH | `/api/v1/contracts/:id` | update | `contracts.manage` |
| P07 | GET | `/api/v1/contracts/expiring` | expiry list | `contracts.read` |
| P08 | GET | `/api/v1/purchase-orders` | list/filter | `purchaseOrders.read` |
| P08 | POST | `/api/v1/purchase-orders` | create draft + lines | `purchaseOrders.manage` |
| P08 | GET | `/api/v1/purchase-orders/:id` | PO with lines | `purchaseOrders.read` |
| P08 | PATCH | `/api/v1/purchase-orders/:id` | draft edit | `purchaseOrders.manage` |
| P08 | POST | `/api/v1/purchase-orders/:id/lines` | add line | `purchaseOrders.manage` |
| P08 | PATCH | `/api/v1/purchase-orders/:id/lines/:lineId` | change line | `purchaseOrders.manage` |
| P08 | POST | `/api/v1/purchase-orders/:id/approve` | approval (if approved policy) | `purchaseOrders.approve` |
| P08 | POST | `/api/v1/purchase-orders/:id/cancel` | cancel + release side effects | `purchaseOrders.cancel` |
| P09 | POST | `/api/v1/asset-issuances` | atomic issue assets | `assets.issue` |
| P09 | GET | `/api/v1/asset-issuances/:documentId` | issue details | `assets.read` |
| P09 | POST | `/api/v1/asset-returns` | atomic return assets | `assets.return` |
| P09 | GET | `/api/v1/asset-returns/:documentId` | return details | `assets.read` |
| P09 | GET | `/api/v1/assets/:id/transactions` | history | `assets.read` |
| P10 | GET | `/api/v1/invoices` | list/filter | `invoices.read` |
| P10 | POST | `/api/v1/invoices` | create invoice | `invoices.manage` |
| P10 | GET | `/api/v1/invoices/:id` | invoice | `invoices.read` |
| P10 | POST | `/api/v1/invoices/:id/post` | post bill (policy-gated) | `invoices.post` |
| P10 | GET | `/api/v1/invoices/:id/balance` | balance | `invoices.read` |
| P10 | POST | `/api/v1/invoices/:id/payments` | payment (policy-gated) | `invoices.pay` |
| P10 | GET | `/api/v1/invoices/:id/payments` | payment history | `invoices.read` |
| P11 | GET | `/api/v1/financial-years` | list | `budgets.read` |
| P11 | POST | `/api/v1/financial-years` | create fiscal year | `budgets.manage` |
| P11 | POST | `/api/v1/budget-allocations` | create allocation | `budgets.manage` |
| P11 | GET | `/api/v1/budgets/summary` | allocation/spend overview | `budgets.read` |
| P11 | GET | `/api/v1/budgets/ledger` | transaction ledger | `budgets.read` |
| P11 | GET | `/api/v1/budgets/by-po/:id` | PO budget usage | `budgets.read` |
| P11 | GET | `/api/v1/budgets/by-vendor/:id` | vendor budget usage | `budgets.read` |
| P12 | GET | `/api/v1/maintenance-records` | list | `maintenance.read` |
| P12 | POST | `/api/v1/maintenance-records` | request repair | `maintenance.manage` |
| P12 | GET | `/api/v1/maintenance-records/:id` | detail | `maintenance.read` |
| P12 | POST | `/api/v1/maintenance-records/:id/complete` | complete repair | `maintenance.manage` |
| P13 | GET | `/api/v1/software-licenses` | list/filter | `licenses.read` |
| P13 | POST | `/api/v1/software-licenses` | register license | `licenses.manage` |
| P13 | GET | `/api/v1/software-licenses/:id` | detail | `licenses.read` |
| P13 | PATCH | `/api/v1/software-licenses/:id` | edit | `licenses.manage` |
| P13 | GET | `/api/v1/software-licenses/expiring` | expiry list | `licenses.read` |
| P14 | POST | `/api/v1/documents/uploads` | private upload | permission on owner resource |
| P14 | GET | `/api/v1/documents/:id/download` | authorized download | resource policy |
| P14 | POST | `/api/v1/issuance-documents/:id/generate` | official issue form | `reports.export` |
| P14 | POST | `/api/v1/return-documents/:id/generate` | official return form | `reports.export` |
| P15 | GET | `/api/v1/search` | global lookup | module-dependent filtering |
| P15 | GET | `/api/v1/search/purchase-orders/:poNumber/overview` | PO 360 | module-dependent filtering |
| P16 | GET | `/api/v1/notifications` | read user's alerts | authenticated |
| P16 | POST | `/api/v1/notifications/:id/read` | read ack | notification owner |
| P17 | GET | `/api/v1/audit-events` | audit listing | `audit.read` |
| P18 | GET | `/api/v1/reports/asset-register` | PDF/XLSX | `reports.export`, `assets.read` |
| P18 | GET | `/api/v1/reports/purchase-orders` | PDF/XLSX | `reports.export`, `purchaseOrders.read` |
| P18 | GET | `/api/v1/reports/contracts` | PDF/XLSX | `reports.export`, `contracts.read` |
| P18 | GET | `/api/v1/reports/invoices` | PDF/XLSX | `reports.export`, `invoices.read` |
| P18 | GET | `/api/v1/reports/budget-utilization` | PDF/XLSX | `reports.export`, `budgets.read` |

## Contract discipline
- Each endpoint must specify params/query/body schema and max page size, auth behavior, expected responses, conflict states and tests in OpenAPI when implemented.
- Permissions in this table are **candidate names**, not approved role assignments. Never use this list to silently decide the business's role policy.
- No raw financial decimal JS float, secret license key, or local document path in API response.
- For workflow actions the service should enforce transaction/audit and idempotency as needed.
- Do not implement optional or blocked operations as successful no-op endpoint stubs.
