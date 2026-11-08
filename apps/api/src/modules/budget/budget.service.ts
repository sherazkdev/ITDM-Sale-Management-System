import { Prisma } from "@prisma/client";
import { AppError } from "../../shared/errors/app-error.js";
import { ErrorCodes } from "../../shared/errors/error-codes.js";
import { BudgetTransactionType, REPORTING_CURRENCY } from "../../shared/domain/financial-rules.js";
import { computeBudgetUsdMetrics } from "../../shared/domain/budget-metrics.js";
import { toDecimal, sumDecimals } from "../../shared/money/decimal-math.js";
import { runInTransaction } from "../../shared/db/transaction.js";
import type { AuditService } from "../../shared/audit/audit.service.js";
import { recordFinancialCorrectionAudit } from "../../shared/audit/financial-correction-audit.js";
import type { PrismaClient } from "@prisma/client";

function parseDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export class BudgetService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly audit: AuditService,
  ) {}

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
    const currency = input.currency.toUpperCase();
    if (currency !== REPORTING_CURRENCY) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        "Annual budget allocations must be recorded in USD",
        422,
      );
    }
    try {
      return await this.prisma.budgetAllocation.create({
        data: {
          financialYear: { connect: { financialYearId: input.financialYearId } },
          budgetCategory: input.budgetCategory,
          allocatedAmount: toDecimal(input.allocatedAmount),
          currency,
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

  /** Admin-only manual ledger append — does not replace invoice post/payment ledger rows. */
  async appendLedgerEntry(
    input: {
      correctionReason: string;
      budgetId: bigint;
      transactionType: string;
      amount: number;
      transactionDate: string;
      purchaseOrderId?: bigint;
      invoiceId?: bigint;
      remarks?: string;
    },
    auditContext: { actorUserId?: bigint; requestId?: string },
  ) {
    const type = (input.transactionType || BudgetTransactionType.manual).toUpperCase();
    if (
      type === BudgetTransactionType.committedInvoice ||
      type === BudgetTransactionType.actualPayment
    ) {
      throw new AppError(
        ErrorCodes.POLICY_NOT_APPROVED,
        "Committed and actual ledger rows must come from invoice post and payment workflows",
        403,
      );
    }

    const allocation = await this.prisma.budgetAllocation.findUnique({
      where: { budgetId: input.budgetId },
    });
    if (!allocation) {
      throw new AppError(ErrorCodes.NOT_FOUND, "Budget allocation not found", 404);
    }

    return runInTransaction(this.prisma, async (tx) => {
      const row = await tx.budgetTransaction.create({
        data: {
          budget: { connect: { budgetId: input.budgetId } },
          transactionType: type,
          amount: toDecimal(input.amount),
          transactionDate: parseDateOnly(input.transactionDate),
          purchaseOrder: input.purchaseOrderId
            ? { connect: { purchaseOrderId: input.purchaseOrderId } }
            : undefined,
          invoice: input.invoiceId ? { connect: { invoiceId: input.invoiceId } } : undefined,
          remarks: input.remarks,
        },
      });
      await recordFinancialCorrectionAudit(this.audit, {
        actorUserId: auditContext.actorUserId,
        requestId: auditContext.requestId,
        result: "success",
        payload: {
          entityType: "budget_transaction",
          recordId: String(row.budgetTransactionId),
          correctionReason: input.correctionReason,
          actionType: "manual_ledger_append",
          before: {},
          after: {
            transactionType: row.transactionType,
            amount: row.amount.toString(),
            transactionDate: row.transactionDate.toISOString().slice(0, 10),
            remarks: row.remarks ?? null,
          },
          changedFields: ["created"],
          relatedIds: {
            budgetId: String(input.budgetId),
            purchaseOrderId: input.purchaseOrderId ? String(input.purchaseOrderId) : null,
            invoiceId: input.invoiceId ? String(input.invoiceId) : null,
          },
        },
      });
      return row;
    });
  }

  async correctAllocation(
    budgetId: bigint,
    input: {
      correctionReason: string;
      budgetCategory?: string;
      allocatedAmount?: number;
    },
    auditContext: { actorUserId?: bigint; requestId?: string },
  ) {
    const allocation = await this.prisma.budgetAllocation.findUnique({
      where: { budgetId },
    });
    if (!allocation) {
      throw new AppError(ErrorCodes.NOT_FOUND, "Budget allocation not found", 404);
    }

    const before = {
      budgetCategory: allocation.budgetCategory,
      allocatedAmount: allocation.allocatedAmount.toString(),
      currency: allocation.currency,
    };

    const data: { budgetCategory?: string; allocatedAmount?: ReturnType<typeof toDecimal> } = {};
    const changedFields: string[] = [];
    if (input.budgetCategory && input.budgetCategory.trim() !== allocation.budgetCategory) {
      data.budgetCategory = input.budgetCategory.trim();
      changedFields.push("budgetCategory");
    }
    if (input.allocatedAmount !== undefined) {
      const next = toDecimal(input.allocatedAmount);
      if (!next.equals(toDecimal(allocation.allocatedAmount))) {
        data.allocatedAmount = next;
        changedFields.push("allocatedAmount");
      }
    }
    if (changedFields.length === 0) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, "No changes to apply", 422);
    }

    return runInTransaction(this.prisma, async (tx) => {
      const updated = await tx.budgetAllocation.update({
        where: { budgetId },
        data,
      });
      const after = {
        budgetCategory: updated.budgetCategory,
        allocatedAmount: updated.allocatedAmount.toString(),
        currency: updated.currency,
      };
      await recordFinancialCorrectionAudit(this.audit, {
        actorUserId: auditContext.actorUserId,
        requestId: auditContext.requestId,
        result: "success",
        payload: {
          entityType: "budget_allocation",
          recordId: String(budgetId),
          correctionReason: input.correctionReason,
          actionType: "allocation_correction",
          before,
          after,
          changedFields,
          relatedIds: { financialYearId: String(updated.financialYearId) },
        },
      });
      return updated;
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
    const metrics = computeBudgetUsdMetrics({
      allocatedAmount: allocated,
      currency: allocation.currency,
      transactions: allocation.budgetTransactions,
    });

    const manualRows = allocation.budgetTransactions.filter(
      (t) =>
        t.transactionType !== BudgetTransactionType.committedInvoice &&
        t.transactionType !== BudgetTransactionType.actualPayment,
    );
    const manualLedgerTotal = sumDecimals(manualRows.map((t) => t.amount));

    return {
      budgetId: allocation.budgetId,
      budgetCategory: allocation.budgetCategory,
      currency: allocation.currency,
      reportingCurrency: REPORTING_CURRENCY,
      allocatedAmount: allocated,
      allocatedUsdReporting: metrics.allocatedUsd,
      utilizedUsd: metrics.utilizedUsd,
      committedUsd: metrics.committedUsd,
      committedUsdProvisional: metrics.committedUsdProvisional,
      actualPaidUsd: metrics.actualPaidUsd,
      actualUsdProvisional: metrics.actualUsdProvisional,
      remainingUsd: metrics.remainingUsd,
      utilizationPercent: metrics.utilizationPercent,
      manualLedgerTotal,
      financialYear: allocation.financialYear,
      transactions: allocation.budgetTransactions,
      semanticsNote: metrics.semanticsNote,
      provisionalNote: metrics.provisionalNote,
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
