import type { AuditService } from "../../shared/audit/audit.service.js";
import { computeBudgetUsdMetrics } from "../../shared/domain/budget-metrics.js";
import type { Prisma, PrismaClient } from "@prisma/client";
import {
  csvFromRows,
  NON_OFFICIAL_DISCLAIMER,
  parseExportFormat,
  type ExportFormat,
} from "../../shared/export/tabular-export.js";
import { buildTabularPdf } from "../../shared/export/tabular-pdf.js";
import { buildTabularXlsx } from "../../shared/export/tabular-xlsx.js";

export class ReportService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly audit: AuditService,
  ) {}

  parseFormat(raw: string): ExportFormat {
    return parseExportFormat(raw);
  }

  async inventory(format: ExportFormat) {
    const [assets, nonAssets] = await Promise.all([
      this.prisma.asset.findMany({
        include: { category: true, currentAssignee: true },
        orderBy: { assetCode: "asc" },
        take: 5000,
      }),
      this.prisma.nonAssetStockItem.findMany({
        include: { category: true },
        orderBy: { stockCode: "asc" },
        take: 5000,
      }),
    ]);
    const header = [
      "itemClass",
      "code",
      "name",
      "category",
      "quantityOrStatus",
      "unitOrAssignee",
      "location",
    ];
    const assetRows = assets.map((a) => [
      "ASSET",
      a.assetCode,
      a.assetName,
      a.category.categoryName,
      a.assetStatus,
      a.currentAssignee?.fullName ?? "",
      a.currentLocation ?? "",
    ]);
    const nonAssetRows = nonAssets.map((n) => [
      "NON_ASSET",
      n.stockCode,
      n.itemName,
      n.category.categoryName,
      String(n.quantityAvailable),
      n.unitOfMeasure,
      n.currentLocation ?? "",
    ]);
    return this.formatTabular("inventory", header, [...assetRows, ...nonAssetRows], format);
  }

  async nonAssetStockLedger(format: ExportFormat) {
    const items = await this.prisma.nonAssetStockItem.findMany({
      include: {
        category: true,
        movements: {
          include: { employee: true },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { stockCode: "asc" },
      take: 5000,
    });

    const header = [
      "stockCode",
      "itemName",
      "unit",
      "registeredReceivedQty",
      "availableQty",
      "movementType",
      "movementQty",
      "qtyBefore",
      "qtyAfter",
      "movementAt",
      "employeeNumber",
      "employeeName",
      "department",
      "referenceReason",
    ];

    const rows: string[][] = [];
    for (const item of items) {
      const registered = String(item.quantityOnHand);
      const available = String(item.quantityAvailable);
      if (item.movements.length === 0) {
        rows.push([
          item.stockCode,
          item.itemName,
          item.unitOfMeasure,
          registered,
          available,
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
        ]);
        continue;
      }
      for (const m of item.movements) {
        rows.push([
          item.stockCode,
          item.itemName,
          item.unitOfMeasure,
          registered,
          available,
          m.movementType,
          String(m.quantity),
          m.quantityBefore != null ? String(m.quantityBefore) : "",
          m.quantityAfter != null ? String(m.quantityAfter) : "",
          m.createdAt.toISOString(),
          m.employee?.employeeNumber ?? "",
          m.employee?.fullName ?? "",
          m.department ?? m.employee?.department ?? "",
          m.referenceReason ?? "",
        ]);
      }
    }
    return this.formatTabular("non-asset-stock-ledger", header, rows, format);
  }

  async assetRegister(format: ExportFormat) {
    const assets = await this.prisma.asset.findMany({
      include: { category: true, currentAssignee: true },
      orderBy: { assetCode: "asc" },
      take: 5000,
    });
    const header = ["assetCode", "assetName", "status", "category", "assignee"];
    const rows = assets.map((a) => [
      a.assetCode,
      a.assetName,
      a.assetStatus,
      a.category.categoryName,
      a.currentAssignee?.fullName ?? "",
    ]);
    return this.formatTabular("asset-register", header, rows, format);
  }

  async budgetUtilization(financialYearId: bigint | undefined, format: ExportFormat) {
    const allocations = await this.prisma.budgetAllocation.findMany({
      where: financialYearId ? { financialYearId } : undefined,
      include: { budgetTransactions: true, financialYear: true },
    });
    const header = [
      "year",
      "category",
      "allocatedUsd",
      "utilizedUsd",
      "actualUsd",
      "remainingUsd",
    ];
    const rows = allocations.map((a) => {
      const metrics = computeBudgetUsdMetrics({
        allocatedAmount: a.allocatedAmount,
        currency: a.currency,
        transactions: a.budgetTransactions,
      });
      const allocatedUsd =
        metrics.allocatedUsd !== null ? metrics.allocatedUsd.toString() : "PROVISIONAL_NON_USD_ALLOC";
      const remaining =
        metrics.remainingUsd !== null ? metrics.remainingUsd.toString() : "PROVISIONAL";
      return [
        a.financialYear.yearName,
        a.budgetCategory,
        allocatedUsd,
        metrics.utilizedUsd.toString(),
        metrics.actualUsd.toString(),
        remaining,
      ];
    });
    return this.formatTabular("budget-utilization", header, rows, format);
  }

  async purchaseOrders(format: ExportFormat, filters?: { status?: string }) {
    const pos = await this.prisma.purchaseOrder.findMany({
      where: filters?.status ? { status: filters.status } : undefined,
      include: { vendor: true },
      orderBy: { poNumber: "asc" },
    });
    const header = ["poNumber", "vendor", "status", "totalAmount", "currency", "validUntil"];
    const rows = pos.map((p) => [
      p.poNumber,
      p.vendor.vendorName,
      p.status,
      String(p.totalAmount),
      p.currency,
      p.validUntil ? p.validUntil.toISOString().slice(0, 10) : "",
    ]);
    return this.formatTabular("purchase-orders", header, rows, format);
  }

  async contracts(format: ExportFormat) {
    const contracts = await this.prisma.contract.findMany({
      include: { vendor: true },
      orderBy: { contractNumber: "asc" },
    });
    const header = ["contractNumber", "vendor", "expiryDate", "contractValue"];
    const rows = contracts.map((c) => [
      c.contractNumber,
      c.vendor.vendorName,
      c.expiryDate.toISOString().slice(0, 10),
      c.contractValue ? String(c.contractValue) : "",
    ]);
    return this.formatTabular("contracts", header, rows, format);
  }

  async invoices(
    format: ExportFormat,
    filters?: { search?: string; paymentStatus?: string },
  ) {
    const search = filters?.search?.trim();
    const paymentStatus = filters?.paymentStatus?.trim();
    const where: Prisma.InvoiceWhereInput = {
      ...(paymentStatus ? { paymentStatus } : {}),
      ...(search
        ? {
            OR: [
              { invoiceNumber: { contains: search, mode: "insensitive" } },
              { purchaseOrder: { poNumber: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    };
    const invoices = await this.prisma.invoice.findMany({
      where,
      include: { purchaseOrder: true, payments: true },
      orderBy: { invoiceNumber: "asc" },
    });
    const header = [
      "invoiceNumber",
      "poNumber",
      "currency",
      "invoiceAmount",
      "postedAt",
      "commitmentAmountUsd",
      "actualPaidUsd",
      "paymentStatus",
      "outstandingInInvoiceCurrency",
    ];
    const rows = invoices.map((inv) => {
      const paid = inv.payments.reduce((s, p) => s + Number(p.amount), 0);
      const paidUsd = inv.payments.reduce((s, p) => s + Number(p.amountUsd), 0);
      const outstanding = Number(inv.invoiceAmount) - paid;
      const commitmentUsd =
        inv.commitmentAmountUsd != null
          ? String(inv.commitmentAmountUsd)
          : inv.postedAt
            ? "PROVISIONAL_COMMITMENT_USD"
            : "";
      return [
        inv.invoiceNumber,
        inv.purchaseOrder.poNumber,
        inv.currency.trim(),
        String(inv.invoiceAmount),
        inv.postedAt ? inv.postedAt.toISOString() : "",
        commitmentUsd,
        inv.postedAt || inv.payments.length > 0 ? String(paidUsd) : "",
        inv.paymentStatus,
        String(outstanding),
      ];
    });
    return this.formatTabular("invoices", header, rows, format);
  }

  /** Operational issuance/return lines (non-official layout — D12). */
  async assetMovements(format: ExportFormat) {
    const lines = await this.prisma.assetMovementDocumentLine.findMany({
      include: {
        document: { include: { employee: true } },
        asset: true,
      },
      orderBy: [{ document: { occurredAt: "desc" } }, { documentLineId: "asc" }],
      take: 10000,
    });
    const header = [
      "documentType",
      "referenceNumber",
      "occurredAt",
      "employee",
      "receivingDepartment",
      "assetCode",
      "assetName",
    ];
    const rows: string[][] = lines.map((line) => [
      line.document.documentType,
      line.document.referenceNumber ?? "",
      line.document.occurredAt.toISOString(),
      line.document.employee?.fullName ?? "",
      line.document.receivingDepartment ?? "",
      line.asset.assetCode,
      line.asset.assetName,
    ]);
    return this.formatTabular("asset-movements", header, rows, format);
  }

  async employees(format: ExportFormat, filters?: { departmentId?: bigint }) {
    const employees = await this.prisma.employee.findMany({
      where: filters?.departmentId ? { departmentId: filters.departmentId } : undefined,
      orderBy: { employeeNumber: "asc" },
    });
    const header = ["employeeNumber", "fullName", "department", "email", "contactNumber", "isActive"];
    const rows = employees.map((e) => [
      e.employeeNumber,
      e.fullName,
      e.department ?? "",
      e.email ?? "",
      e.contactNumber ?? "",
      e.isActive ? "yes" : "no",
    ]);
    return this.formatTabular("employees", header, rows, format);
  }

  private async formatTabular(
    title: string,
    header: string[],
    rows: string[][],
    format: ExportFormat,
  ) {
    if (format === "json") {
      return {
        type: title,
        disclaimer: NON_OFFICIAL_DISCLAIMER,
        generatedAt: new Date().toISOString(),
        header,
        rows,
      };
    }
    if (format === "csv") {
      return { contentType: "text/csv", body: csvFromRows(header, rows) };
    }
    if (format === "pdf") {
      return {
        contentType: "application/pdf",
        body: await buildTabularPdf({ title, header, rows }),
        disclaimer: NON_OFFICIAL_DISCLAIMER,
      };
    }
    return {
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      body: await buildTabularXlsx(title, header, rows),
      disclaimer: NON_OFFICIAL_DISCLAIMER,
    };
  }

  async logExport(actorUserId: bigint | undefined, reportType: string, requestId?: string) {
    await this.audit.record({
      actorUserId,
      action: "report.export",
      targetType: "report",
      targetId: reportType,
      result: "success",
      requestId,
      metadata: { disclaimer: NON_OFFICIAL_DISCLAIMER },
    });
  }
}
