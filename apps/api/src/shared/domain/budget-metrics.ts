import { Prisma } from "@prisma/client";
import { BudgetTransactionType, REPORTING_CURRENCY } from "./financial-rules.js";
import { sumDecimals, toDecimal } from "../money/decimal-math.js";

export type BudgetLedgerRow = {
  amountUsdReporting: Prisma.Decimal | null;
  transactionType: string;
};

export function sumUsdReportingByType(
  txs: BudgetLedgerRow[],
  type: string,
): { total: Prisma.Decimal; hasProvisional: boolean } {
  let hasProvisional = false;
  const values: Prisma.Decimal[] = [];
  for (const t of txs) {
    if (t.transactionType !== type) {
      continue;
    }
    if (t.amountUsdReporting === null) {
      hasProvisional = true;
      continue;
    }
    values.push(toDecimal(t.amountUsdReporting));
  }
  return { total: sumDecimals(values), hasProvisional };
}

/**
 * Client-approved Phase 2 semantics (Nov 2026):
 * - Utilized = posted invoice commitments (COMMITTED_INVOICE), USD reporting amounts only
 * - Actual = payment expenditure (ACTUAL_PAYMENT), USD at manual payment-date FX
 * - Remaining = Allocated USD − Utilized (payments do not reduce remaining again)
 */
export function computeBudgetUsdMetrics(input: {
  allocatedAmount: Prisma.Decimal;
  currency: string;
  transactions: BudgetLedgerRow[];
}) {
  const utilized = sumUsdReportingByType(
    input.transactions,
    BudgetTransactionType.committedInvoice,
  );
  const actual = sumUsdReportingByType(
    input.transactions,
    BudgetTransactionType.actualPayment,
  );

  const allocatedUsd =
    input.currency.toUpperCase() === REPORTING_CURRENCY ? toDecimal(input.allocatedAmount) : null;

  const utilizedUsd = utilized.total;
  const actualUsd = actual.total;

  const remainingUsd =
    allocatedUsd !== null && !utilized.hasProvisional
      ? allocatedUsd.sub(utilizedUsd)
      : null;

  const utilizationPercent =
    allocatedUsd !== null && allocatedUsd.greaterThan(0) && !utilized.hasProvisional
      ? utilizedUsd.div(allocatedUsd).mul(100).toDecimalPlaces(2)
      : null;

  return {
    allocatedUsd,
    utilizedUsd,
    actualUsd,
    committedUsd: utilizedUsd,
    actualPaidUsd: actualUsd,
    remainingUsd,
    utilizationPercent,
    committedUsdProvisional: utilized.hasProvisional,
    actualUsdProvisional: actual.hasProvisional,
    provisionalNote:
      utilized.hasProvisional || allocatedUsd === null
        ? "Utilized or remaining USD figures require USD allocation currency and manual post-time FX for non-USD invoices."
        : null,
    semanticsNote:
      "Utilized USD is the sum of posted invoice commitments. Actual USD is summed payment expenditure at manual payment-date FX. Remaining USD = allocated − utilized; payments do not reduce remaining again.",
  };
}
