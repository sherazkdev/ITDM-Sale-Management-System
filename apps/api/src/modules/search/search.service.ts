import { AppError } from "../../shared/errors/app-error.js";
import { ErrorCodes } from "../../shared/errors/error-codes.js";
import type { PrismaClient } from "@prisma/client";
import { sumDecimals, toDecimal } from "../../shared/money/decimal-math.js";
import { listDocumentsForOwner } from "../../shared/documents/document-owner.js";
import { enrichNonAssetStockItem } from "../non-asset-stock/non-asset-stock.presenter.js";

export class SearchService {
  constructor(private readonly prisma: PrismaClient) {}

  async byPurchaseOrderNumber(poNumber: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { poNumber: poNumber.trim() },
      include: {
        vendor: true,
        contract: true,
        lines: true,
        invoices: { include: { payments: true } },
        assets: true,
        nonAssetStockItems: {
          include: {
            category: { select: { categoryId: true, categoryName: true } },
            purchaseOrder: { select: { purchaseOrderId: true, poNumber: true, poDate: true } },
          },
          take: 200,
        },
        budgetTransactions: { include: { budget: { include: { financialYear: true } } } },
      },
    });
    if (!po) {
      throw new AppError(ErrorCodes.NOT_FOUND, "Purchase order not found", 404);
    }

    const poIdStr = String(po.purchaseOrderId);
    const poDocuments = await listDocumentsForOwner(this.prisma, "purchase_order", poIdStr);
    const contractDocuments =
      po.contractId !== null
        ? await listDocumentsForOwner(this.prisma, "contract", String(po.contractId))
        : [];

    const assetIds = po.assets.map((a) => a.assetId);
    const movements =
      assetIds.length === 0
        ? []
        : await this.prisma.assetTransaction.findMany({
            where: { assetId: { in: assetIds } },
            orderBy: { transactionDate: "desc" },
            take: 500,
            include: { asset: true, employee: true },
          });

    const licenses = await this.prisma.softwareLicense.findMany({
      where: { purchaseOrderId: po.purchaseOrderId },
      take: 200,
    });

    const maintenanceByAsset =
      assetIds.length === 0
        ? []
        : await this.prisma.maintenanceRecord.findMany({
            where: { assetId: { in: assetIds } },
            take: 200,
          });

    const maintenanceByContract =
      po.contractId !== null
        ? await this.prisma.maintenanceRecord.findMany({
            where: { contractId: po.contractId },
            take: 100,
          })
        : [];

    const budgetSummaries = this.summarizeBudgetTransactions(po.budgetTransactions);

    const invoiceFinancials = po.invoices.map((inv) => {
      const paidTotal = sumDecimals(inv.payments.map((p) => p.amount));
      const outstanding = toDecimal(inv.invoiceAmount).sub(paidTotal);
      return {
        invoiceId: inv.invoiceId,
        invoiceNumber: inv.invoiceNumber,
        invoiceAmount: inv.invoiceAmount,
        paymentStatus: inv.paymentStatus,
        paidTotal,
        outstanding,
        paymentCount: inv.payments.length,
      };
    });

    const { nonAssetStockItems, ...purchaseOrder } = po;

    return {
      purchaseOrder,
      nonAssetStockItems: nonAssetStockItems.map((item) => enrichNonAssetStockItem(item)),
      expiryDates: {
        contractExpiry: po.contract?.expiryDate ?? null,
        poValidUntil: po.validUntil ?? null,
        note: "PO valid_until and reminder lead time are PROPOSED until D04/D14 approved",
      },
      supportingDocuments: {
        purchaseOrder: poDocuments.map((d) => d.storedDocument),
        contract: contractDocuments.map((d) => d.storedDocument),
      },
      invoiceFinancials,
      movements,
      maintenance: [...maintenanceByAsset, ...maintenanceByContract],
      softwareLicenses: licenses.map((l) => ({
        ...l,
        licenseKeyReference: undefined,
      })),
      budget: budgetSummaries,
      truncation: {
        movementsCap: 500,
        maintenanceCap: 200,
        licensesCap: 200,
        nonAssetStockCap: 200,
      },
    };
  }

  private summarizeBudgetTransactions(
    txs: Array<{
      transactionType: string;
      amount: import("@prisma/client").Prisma.Decimal;
      budget: {
        budgetId: bigint;
        budgetCategory: string;
        allocatedAmount: import("@prisma/client").Prisma.Decimal;
        currency: string;
        financialYear: { yearName: string };
      };
    }>,
  ) {
    const byBudget = new Map<
      string,
      {
        budgetId: bigint;
        budgetCategory: string;
        yearName: string;
        currency: string;
        allocatedAmount: import("@prisma/client").Prisma.Decimal;
        ledgerByType: Record<string, string>;
        ledgerTotal: import("@prisma/client").Prisma.Decimal;
        remainingProvisional: import("@prisma/client").Prisma.Decimal;
      }
    >();

    for (const tx of txs) {
      const key = String(tx.budget.budgetId);
      let entry = byBudget.get(key);
      if (!entry) {
        entry = {
          budgetId: tx.budget.budgetId,
          budgetCategory: tx.budget.budgetCategory,
          yearName: tx.budget.financialYear.yearName,
          currency: tx.budget.currency,
          allocatedAmount: tx.budget.allocatedAmount,
          ledgerByType: {},
          ledgerTotal: toDecimal(0),
          remainingProvisional: tx.budget.allocatedAmount,
        };
        byBudget.set(key, entry);
      }
      const type = tx.transactionType;
      const prev = entry.ledgerByType[type] ?? "0";
      entry.ledgerByType[type] = toDecimal(prev).add(tx.amount).toFixed();
      entry.ledgerTotal = entry.ledgerTotal.add(tx.amount);
      entry.remainingProvisional = toDecimal(entry.allocatedAmount).sub(entry.ledgerTotal);
    }

    return {
      allocations: [...byBudget.values()],
      semanticsNote:
        "committed/actual/utilized split not defined — ledger grouped by transaction_type only (D06/D07)",
    };
  }
}
