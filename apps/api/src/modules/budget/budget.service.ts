import { Prisma } from "@prisma/client";
import { AppError } from "../../shared/errors/app-error.js";
import { ErrorCodes } from "../../shared/errors/error-codes.js";
import { BudgetTransactionType, REPORTING_CURRENCY } from "../../shared/domain/financial-rules.js";
import { toDecimal, sumDecimals } from "../../shared/money/decimal-math.js";
import type { PrismaClient } from "@prisma/client";

function parseDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function sumUsdReporting(
  txs: { amountUsdReporting: Prisma.Decimal | null; transactionType: string }[],
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

export class BudgetService {
  constructor(private readonly prisma: PrismaClient) {}

  async createFinancialYear(input: {
    yearName: string;
    startDate: string;
    endDate: string;
    status: string;
  }) {
    const start = parseDateOnly(input.startDate);
    const end = parseDateOnly(input.endDate);
    if (end.getTime() < start.getTime()) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, "End date before start date", 422);
    }
    try {
      return await this.prisma.financialYear.create({
        data: {
          yearName: input.yearName.trim(),
          startDate: start,
          endDate: end,
          status: input.status,
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new AppError(ErrorCodes.CONFLICT, "Financial year name exists", 409);
      }
      throw err;
    }
  }

  listFinancialYears() {
    return this.prisma.financialYear.findMany({ orderBy: { startDate: "desc" } });
  }

  async createAllocation(input: {
    financialYearId: bigint;
    budgetCategory: string;
    allocatedAmount: number;
    currency: string;
  }) {
    try {
      return await this.prisma.budgetAllocation.create({
        data: {
          financialYear: { connect: { financialYearId: input.financialYearId } },
          budgetCategory: input.budgetCategory,
          allocatedAmount: toDecimal(input.allocatedAmount),
          currency: input.currency.toUpperCase(),
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
        throw new AppError(ErrorCodes.VALIDATION_ERROR, "Financial year not found", 422);
      }
      throw err;
    }
  }

  listAllocations(financialYearId?: bigint) {
    return this.prisma.budgetAllocation.findMany({
      where: financialYearId ? { financialYearId } : undefined,
      orderBy: { budgetId: "asc" },
    });
  }

  /** Manual ledger append — does not auto-classify as committed/actual. */
  async appendLedgerEntry(input: {
    budgetId: bigint;
    transactionType: string;
    amount: number;
    transactionDate: string;
    purchaseOrderId?: bigint;
    invoiceId?: bigint;
    remarks?: string;
  }) {
    return this.prisma.budgetTransaction.create({
      data: {
        budget: { connect: { budgetId: input.budgetId } },
        transactionType: input.transactionType || BudgetTransactionType.manual,
        amount: toDecimal(input.amount),
        transactionDate: parseDateOnly(input.transactionDate),
        purchaseOrder: input.purchaseOrderId
          ? { connect: { purchaseOrderId: input.purchaseOrderId } }
          : undefined,
        invoice: input.invoiceId ? { connect: { invoiceId: input.invoiceId } } : undefined,
        remarks: input.remarks,
      },
    });
  }

  async getSummary(budgetId: bigint) {
    const allocation = await this.prisma.budgetAllocation.findUnique({
      where: { budgetId },
      include: { budgetTransactions: true, financialYear: true },
    });
    if (!allocation) {
      throw new AppError(ErrorCodes.NOT_FOUND, "Budget allocation not found", 404);
    }

    const allocated = toDecimal(allocation.allocatedAmount);
    const committed = sumUsdReporting(
      allocation.budgetTransactions,
      BudgetTransactionType.committedInvoice,
    );
    const actualPaid = sumUsdReporting(
      allocation.budgetTransactions,
      BudgetTransactionType.actualPayment,
    );

    const manualRows = allocation.budgetTransactions.filter(
      (t) =>
        t.transactionType !== BudgetTransactionType.committedInvoice &&
        t.transactionType !== BudgetTransactionType.actualPayment,
    );
    const manualLedgerTotal = sumDecimals(manualRows.map((t) => t.amount));

    const allocatedUsd =
      allocation.currency === REPORTING_CURRENCY
        ? allocated
        : null;

    const remainingUsd =
      allocatedUsd !== null ? allocatedUsd.sub(actualPaid.total) : null;

    const utilizationPercent =
      allocatedUsd !== null && allocatedUsd.greaterThan(0)
        ? actualPaid.total.div(allocatedUsd).mul(100).toDecimalPlaces(2)
        : null;

    return {
      budgetId: allocation.budgetId,
      budgetCategory: allocation.budgetCategory,
      currency: allocation.currency,
      reportingCurrency: REPORTING_CURRENCY,
      allocatedAmount: allocated,
      allocatedUsdReporting: allocatedUsd,
      committedUsd: committed.total,
      committedUsdProvisional: committed.hasProvisional,
      actualPaidUsd: actualPaid.total,
      remainingUsd,
      utilizationPercent,
      manualLedgerTotal,
      financialYear: allocation.financialYear,
      transactions: allocation.budgetTransactions,
      semanticsNote:
        "Committed = posted invoice totals (USD when rate provided). Actual paid = payment amounts in USD at manual payment-date rates. Unpaid posted invoices are not counted as actual paid.",
      provisionalNote:
        committed.hasProvisional || allocatedUsd === null
          ? "Some committed USD or allocation USD figures require manual FX or USD allocation currency."
          : null,
    };
  }

  autoCommitFromPoBlocked(): never {
    throw new AppError(
      ErrorCodes.POLICY_NOT_APPROVED,
      "Automatic budget commitment from PO is not used — commitment occurs on invoice post (Wave 2)",
      403,
    );
  }

  async getUsageByPurchaseOrder(purchaseOrderId: bigint) {
    const po = await this.prisma.purchaseOrder.findUnique({ where: { purchaseOrderId } });
    if (!po) {
      throw new AppError(ErrorCodes.NOT_FOUND, "Purchase order not found", 404);
    }
    const transactions = await this.prisma.budgetTransaction.findMany({
      where: { purchaseOrderId },
      include: { budget: { include: { financialYear: true } }, invoice: true },
      orderBy: { transactionDate: "desc" },
    });
    return {
      purchaseOrderId,
      reportingCurrency: REPORTING_CURRENCY,
      transactions,
    };
  }

  async getUsageByVendor(vendorId: bigint) {
    const vendor = await this.prisma.vendor.findUnique({ where: { vendorId } });
    if (!vendor) {
      throw new AppError(ErrorCodes.NOT_FOUND, "Vendor not found", 404);
    }
    const transactions = await this.prisma.budgetTransaction.findMany({
      where: { purchaseOrder: { vendorId } },
      include: {
        budget: { include: { financialYear: true } },
        purchaseOrder: true,
        invoice: true,
      },
      orderBy: { transactionDate: "desc" },
      take: 500,
    });
    return {
      vendorId,
      reportingCurrency: REPORTING_CURRENCY,
      transactions,
    };
  }
}
