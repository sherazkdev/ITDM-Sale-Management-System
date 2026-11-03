import type { AuditService } from "../../shared/audit/audit.service.js";
import type { PrismaClient } from "@prisma/client";
import {
  csvFromRows,
  NON_OFFICIAL_DISCLAIMER,
  parseExportFormat,
  placeholderPdf,
  placeholderXlsxSheet,
  type ExportFormat,
} from "../../shared/export/tabular-export.js";

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
      String(n.quantityOnHand),
      n.unitOfMeasure,
      n.currentLocation ?? "",
    ]);
    return this.formatTabular("inventory", header, [...assetRows, ...nonAssetRows], format);
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
      "committedUsd",
      "actualPaidUsd",
      "remainingUsd",
    ];
    const rows = allocations.map((a) => {
      const allocatedUsd =
        a.currency === "USD" ? String(a.allocatedAmount) : "PROVISIONAL_NON_USD_ALLOC";
      const committed = a.budgetTransactions
        .filter((t) => t.transactionType === "COMMITTED_INVOICE")
        .reduce((s, t) => s + Number(t.amountUsdReporting ?? 0), 0);
      const actual = a.budgetTransactions
        .filter((t) => t.transactionType === "ACTUAL_PAYMENT")
        .reduce((s, t) => s + Number(t.amountUsdReporting ?? 0), 0);
      const remaining =
        a.currency === "USD" ? String(Number(a.allocatedAmount) - actual) : "PROVISIONAL";
      return [a.financialYear.yearName, a.budgetCategory, allocatedUsd, String(committed), String(actual), remaining];
    });
    return this.formatTabular("budget-utilization", header, rows, format);
  }

  async purchaseOrders(format: ExportFormat) {
    const pos = await this.prisma.purchaseOrder.findMany({
      include: { vendor: true },
      orderBy: { poNumber: "asc" },
      take: 5000,
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
      take: 5000,
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

  async invoices(format: ExportFormat) {
    const invoices = await this.prisma.invoice.findMany({
      include: { purchaseOrder: true, payments: true },
      orderBy: { invoiceNumber: "asc" },
      take: 5000,
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
      "assetCode",
      "assetName",
    ];
    const rows = lines.map((line) => [
      line.document.documentType,
      line.document.referenceNumber ?? "",
      line.document.occurredAt.toISOString(),
      line.document.employee?.fullName ?? "",
      line.asset.assetCode,
      line.asset.assetName,
    ]);
    return this.formatTabular("asset-movements", header, rows, format);
  }

  async employees(format: ExportFormat) {
    const employees = await this.prisma.employee.findMany({
      orderBy: { employeeNumber: "asc" },
      take: 5000,
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

  private formatTabular(
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
      const lines = rows.slice(0, 40).map((r) => r.join(" | "));
      return {
        contentType: "application/pdf",
        body: placeholderPdf(title, lines),
        disclaimer: NON_OFFICIAL_DISCLAIMER,
      };
    }
    return {
      contentType: "application/vnd.ms-excel",
      body: placeholderXlsxSheet(title, header, rows),
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
