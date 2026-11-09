import { AssetMovementDocumentType, type PrismaClient } from "@prisma/client";
import { PermissionKeys } from "../../shared/auth/permissions.js";
import type { AuthPrincipal } from "../../shared/auth/principal.js";
import { AssetStatus } from "../../shared/domain/asset-status.js";
import { BudgetTransactionType } from "../../shared/domain/financial-rules.js";
import { computeBudgetUsdMetrics } from "../../shared/domain/budget-metrics.js";
import { toDecimal } from "../../shared/money/decimal-math.js";
import { MaintenanceStatus } from "../../shared/domain/maintenance-status.js";
import type {
  DashboardExpiryWatchlistItem,
  DashboardSummary,
} from "./dashboard.types.js";

const EXPIRING_WINDOW_DAYS_FALLBACK = 60;

const NON_ASSET_COUNT_NOTE =
  "Registered non-asset item counts only. Available quantities are tracked per item — units are not summed across measures (e.g. feet vs kilograms).";

const BUDGET_SEMANTICS_NOTE =
  "Committed expenditure is recorded when an invoice is posted. Actual paid expenditure is the sum of payment amounts converted to USD using manual rates on each payment date.";

const BUDGET_PROVISIONAL_NOTE =
  "Some utilized or remaining USD totals are provisional when post-time FX is missing for non-USD posted invoices.";

function startOfUtcDay(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function addUtcDays(d: Date, days: number): Date {
  const next = new Date(d);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function daysBetweenUtc(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.ceil(ms / 86_400_000);
}

function dateOnlyIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function has(principal: AuthPrincipal, key: string): boolean {
  return principal.permissions.has(key);
}

export class DashboardService {
  private readonly expiringWindowDays: number;

  constructor(
    private readonly prisma: PrismaClient,
    notificationLeadDays?: number,
  ) {
    this.expiringWindowDays = notificationLeadDays ?? EXPIRING_WINDOW_DAYS_FALLBACK;
  }

  async buildSummary(
    principal: AuthPrincipal,
    options?: {
      activityFrom?: Date;
      activityTo?: Date;
      departmentId?: bigint;
      financialYearId?: bigint;
      poStatus?: string;
      assetCategoryId?: bigint;
      assetStatus?: string;
    },
  ): Promise<DashboardSummary> {
    const generatedAt = new Date().toISOString();
    const sectionsIncluded: string[] = [];
    const summary: DashboardSummary = { generatedAt, sectionsIncluded };

    const today = startOfUtcDay();
    const expiringBefore = addUtcDays(today, this.expiringWindowDays);

    const tasks: Promise<void>[] = [];

    if (has(principal, PermissionKeys.employeesRead)) {
      tasks.push(
        (async () => {
          const deptFilter = options?.departmentId
            ? { departmentId: options.departmentId }
            : {};
          const [active, inactive] = await Promise.all([
            this.prisma.employee.count({ where: { isActive: true, ...deptFilter } }),
            this.prisma.employee.count({ where: { isActive: false, ...deptFilter } }),
          ]);
          summary.employees = { total: active + inactive, active, inactive };
          sectionsIncluded.push("employees");
        })(),
      );
    }

    if (has(principal, PermissionKeys.assetsRead)) {
      tasks.push(
        (async () => {
          const assetWhere: { categoryId?: bigint; assetStatus?: string } = {};
          if (options?.assetCategoryId) assetWhere.categoryId = options.assetCategoryId;
          if (options?.assetStatus) assetWhere.assetStatus = options.assetStatus;

          const movementWhere: {
            occurredAt?: { gte?: Date; lte?: Date };
            employeeId?: bigint;
            receivingDepartment?: { contains: string; mode: "insensitive" };
          } = {};
          if (options?.activityFrom || options?.activityTo) {
            movementWhere.occurredAt = {};
            if (options.activityFrom) movementWhere.occurredAt.gte = options.activityFrom;
            if (options.activityTo) movementWhere.occurredAt.lte = options.activityTo;
          }
          if (options?.departmentId) {
            const dept = await this.prisma.department.findUnique({
              where: { departmentId: options.departmentId },
              select: { departmentName: true },
            });
            if (dept?.departmentName) {
              movementWhere.receivingDepartment = { contains: dept.departmentName, mode: "insensitive" };
            }
          }

          const [grouped, nonAssetCount, movementGrouped] = await Promise.all([
            this.prisma.asset.groupBy({
              by: ["assetStatus"],
              where: assetWhere,
              _count: { _all: true },
            }),
            this.prisma.nonAssetStockItem.count(),
            this.prisma.assetMovementDocument.groupBy({
              by: ["documentType"],
              where: Object.keys(movementWhere).length ? movementWhere : undefined,
              _count: { _all: true },
            }),
          ]);
          const countFor = (status: string) =>
            grouped.find((g) => g.assetStatus === status)?._count._all ?? 0;
          const inStock = countFor(AssetStatus.inStock);
          const issued = countFor(AssetStatus.issued);
          const underMaintenance = countFor(AssetStatus.underMaintenance);
          const retired = countFor(AssetStatus.retired);
          summary.assets = {
            registered: inStock + issued + underMaintenance + retired,
            inStock,
            issued,
            underMaintenance,
            retired,
          };
          sectionsIncluded.push("assets");

          summary.nonAssetStock = {
            registeredItemCount: nonAssetCount,
            note: NON_ASSET_COUNT_NOTE,
          };
          sectionsIncluded.push("nonAssetStock");

          const movementCount = (type: AssetMovementDocumentType) =>
            movementGrouped.find((g) => g.documentType === type)?._count._all ?? 0;
          summary.movements = {
            issuanceDocuments: movementCount(AssetMovementDocumentType.ISSUANCE),
            returnDocuments: movementCount(AssetMovementDocumentType.RETURN),
          };
          sectionsIncluded.push("movements");
        })(),
      );
    }

    if (has(principal, PermissionKeys.contractsRead)) {
      tasks.push(
        (async () => {
          const [active, expiringCount] = await Promise.all([
            this.prisma.contract.count({
              where: { expiryDate: { gte: today } },
            }),
            this.prisma.contract.count({
              where: {
                expiryDate: { gte: today, lte: expiringBefore },
              },
            }),
          ]);
          summary.contracts = {
            active,
            expiringWithinDays: this.expiringWindowDays,
            expiringCount,
          };
          sectionsIncluded.push("contracts");
        })(),
      );
    }

    if (has(principal, PermissionKeys.purchaseOrdersRead)) {
      tasks.push(
        (async () => {
          const poWhere = options?.poStatus ? { status: options.poStatus } : {};
          const grouped = await this.prisma.purchaseOrder.groupBy({
            by: ["status"],
            where: poWhere,
            _count: { _all: true },
          });
          const byStatus: Record<string, number> = {};
          let total = 0;
          for (const row of grouped) {
            byStatus[row.status] = row._count._all;
            total += row._count._all;
          }
          summary.purchaseOrders = { byStatus, total };
          sectionsIncluded.push("purchaseOrders");
        })(),
      );
    }

    if (has(principal, PermissionKeys.licensesRead)) {
      tasks.push(
        (async () => {
          const [active, expiringCount] = await Promise.all([
            this.prisma.softwareLicense.count({ where: { status: "ACTIVE" } }),
            this.prisma.softwareLicense.count({
              where: {
                expiryDate: { gte: today, lte: expiringBefore },
              },
            }),
          ]);
          summary.licenses = {
            active,
            expiringWithinDays: this.expiringWindowDays,
            expiringCount,
          };
          sectionsIncluded.push("licenses");
        })(),
      );
    }

    if (has(principal, PermissionKeys.maintenanceRead)) {
      tasks.push(
        (async () => {
          const grouped = await this.prisma.maintenanceRecord.groupBy({
            by: ["status"],
            _count: { _all: true },
          });
          const countFor = (status: string) =>
            grouped.find((g) => g.status === status)?._count._all ?? 0;
          summary.maintenance = {
            open: countFor(MaintenanceStatus.open),
            inProgress: countFor(MaintenanceStatus.inProgress),
            completed: countFor(MaintenanceStatus.completed),
            cancelled: countFor(MaintenanceStatus.cancelled),
          };
          sectionsIncluded.push("maintenance");
        })(),
      );
    }

    if (has(principal, PermissionKeys.notificationsRead)) {
      tasks.push(
        (async () => {
          const unread = await this.prisma.notificationEvent.count({
            where: { readAt: null },
          });
          summary.notifications = { unread };
          sectionsIncluded.push("notifications");
        })(),
      );
    }

    if (has(principal, PermissionKeys.auditRead)) {
      tasks.push(
        (async () => {
          const occurredAt: { gte?: Date; lte?: Date } = {};
          if (options?.activityFrom) occurredAt.gte = options.activityFrom;
          if (options?.activityTo) occurredAt.lte = options.activityTo;
          const items = await this.prisma.auditLog.findMany({
            where: Object.keys(occurredAt).length ? { occurredAt } : undefined,
            orderBy: { occurredAt: "desc" },
            take: 20,
            include: {
              actor: { select: { displayName: true, username: true } },
            },
          });
          summary.recentActivity = items.map((row) => ({
            id: String(row.auditLogId),
            action: row.action,
            targetType: row.targetType,
            targetId: row.targetId,
            occurredAt: row.occurredAt.toISOString(),
            actorDisplayName: row.actor?.displayName ?? row.actor?.username ?? null,
            result: row.result,
          }));
          sectionsIncluded.push("recentActivity");
        })(),
      );
    }

    const canContracts = has(principal, PermissionKeys.contractsRead);
    const canLicenses = has(principal, PermissionKeys.licensesRead);
    if (canContracts || canLicenses) {
      tasks.push(
        (async () => {
          const items: DashboardExpiryWatchlistItem[] = [];
          if (canContracts) {
            const contracts = await this.prisma.contract.findMany({
              where: { expiryDate: { gte: today, lte: expiringBefore } },
              orderBy: { expiryDate: "asc" },
              take: 8,
              select: { contractId: true, contractNumber: true, expiryDate: true },
            });
            for (const c of contracts) {
              items.push({
                kind: "contract",
                id: String(c.contractId),
                label: c.contractNumber,
                expiryDate: dateOnlyIso(c.expiryDate),
                daysRemaining: daysBetweenUtc(today, startOfUtcDay(c.expiryDate)),
              });
            }
          }
          if (canLicenses) {
            const licenses = await this.prisma.softwareLicense.findMany({
              where: { expiryDate: { gte: today, lte: expiringBefore } },
              orderBy: { expiryDate: "asc" },
              take: 8,
              select: { licenseId: true, softwareName: true, expiryDate: true },
            });
            for (const l of licenses) {
              items.push({
                kind: "software_license",
                id: String(l.licenseId),
                label: l.softwareName,
                expiryDate: dateOnlyIso(l.expiryDate),
                daysRemaining: daysBetweenUtc(today, startOfUtcDay(l.expiryDate)),
              });
            }
          }
          items.sort((a, b) => a.daysRemaining - b.daysRemaining || a.expiryDate.localeCompare(b.expiryDate));
          summary.expiryWatchlist = {
            windowDays: this.expiringWindowDays,
            items: items.slice(0, 10),
          };
          sectionsIncluded.push("expiryWatchlist");
        })(),
      );
    }

    if (has(principal, PermissionKeys.budgetsRead)) {
      tasks.push(
        (async () => {
          const [usdAllocations, committedLines, paymentLines] = await Promise.all([
            this.prisma.budgetAllocation.findMany({
              where: {
                currency: "USD",
                ...(options?.financialYearId ? { financialYearId: options.financialYearId } : {}),
              },
              include: { budgetTransactions: true },
            }),
            this.prisma.budgetTransaction.count({
              where: { transactionType: BudgetTransactionType.committedInvoice },
            }),
            this.prisma.budgetTransaction.count({
              where: { transactionType: BudgetTransactionType.actualPayment },
            }),
          ]);
          let allocated = toDecimal(0);
          let utilized = toDecimal(0);
          let actual = toDecimal(0);
          let provisional = false;
          for (const row of usdAllocations) {
            const metrics = computeBudgetUsdMetrics({
              allocatedAmount: row.allocatedAmount,
              currency: row.currency,
              transactions: row.budgetTransactions,
            });
            if (metrics.allocatedUsd) allocated = allocated.add(metrics.allocatedUsd);
            utilized = utilized.add(metrics.utilizedUsd);
            actual = actual.add(metrics.actualUsd);
            if (metrics.committedUsdProvisional || metrics.provisionalNote) provisional = true;
          }
          const remaining =
            provisional || usdAllocations.length === 0
              ? null
              : allocated.sub(utilized);
          summary.budgetOverview = {
            provisional,
            usdAllocationCount: usdAllocations.length,
            usdAllocatedTotal: allocated.toFixed(2),
            utilizedUsdTotal: utilized.toFixed(2),
            actualUsdTotal: actual.toFixed(2),
            remainingUsdTotal: remaining !== null ? remaining.toFixed(2) : null,
            committedInvoiceLedgerLines: committedLines,
            actualPaymentLedgerLines: paymentLines,
            semanticsNote: BUDGET_SEMANTICS_NOTE,
            provisionalNote: provisional ? BUDGET_PROVISIONAL_NOTE : null,
          };
          summary.budgetNotice = BUDGET_PROVISIONAL_NOTE;
          sectionsIncluded.push("budgetOverview");
          sectionsIncluded.push("budgetNotice");
        })(),
      );
    }

    await Promise.all(tasks);
    return summary;
  }
}
