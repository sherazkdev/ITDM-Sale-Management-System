/** Shown when utilized/remaining USD still missing post-time FX on non-USD invoices. */
export const BUDGET_PROVISIONAL_NOTICE =
  "Utilized and remaining USD require manual posting-time FX for non-USD invoices. Admin may correct draft invoices and allocation metadata; posted invoice reversals, payment changes, and credit notes await client policy.";

export const BUDGET_LEDGER_SEMANTICS =
  "Utilized USD is recorded when an invoice is posted. Actual USD is the sum of payments converted using manual rates on each payment date. Remaining USD equals allocated minus utilized; payments do not reduce remaining again.";

export const FINANCIAL_REPORTING_CURRENCY = "USD";
