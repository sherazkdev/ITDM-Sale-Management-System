import type { PrismaClient } from "@prisma/client";
import { PermissionKeys } from "../../shared/auth/permissions.js";
import type { AuthPrincipal } from "../../shared/auth/principal.js";
import { AssetStatus } from "../../shared/domain/asset-status.js";
import { MaintenanceStatus } from "../../shared/domain/maintenance-status.js";
import type { DashboardSummary } from "./dashboard.types.js";

const EXPIRING_WINDOW_DAYS_FALLBACK = 60;

function startOfUtcDay(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function addUtcDays(d: Date, days: number): Date {
  const next = new Date(d);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
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

  async buildSummary(principal: AuthPrincipal): Promise<DashboardSummary> {
    const generatedAt = new Date().toISOString();
    const sectionsIncluded: string[] = [];
    const summary: DashboardSummary = { generatedAt, sectionsIncluded };

    const today = startOfUtcDay();
    const expiringBefore = addUtcDays(today, this.expiringWindowDays);

    const tasks: Promise<void>[] = [];

    if (has(principal, PermissionKeys.employeesRead)) {
      tasks.push(
        (async () => {
          const [active, inactive] = await Promise.all([
            this.prisma.employee.count({ where: { isActive: true } }),
            this.prisma.employee.count({ where: { isActive: false } }),
          ]);
          summary.employees = { total: active + inactive, active, inactive };
          sectionsIncluded.push("employees");
        })(),
      );
    }

    if (has(principal, PermissionKeys.assetsRead)) {
      tasks.push(
        (async () => {
          const grouped = await this.prisma.asset.groupBy({
            by: ["assetStatus"],
            _count: { _all: true },
          });
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
          const grouped = await this.prisma.purchaseOrder.groupBy({
            by: ["status"],
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
          const items = await this.prisma.auditLog.findMany({
            orderBy: { occurredAt: "desc" },
            take: 8,
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

    if (has(principal, PermissionKeys.budgetsRead)) {
      summary.budgetNotice =
        "Wave 2 invoice posting and payments are in production code; budget committed/remaining USD summaries may remain provisional per client FX and remainingUsd rules (see budgets module notice).";
      sectionsIncluded.push("budgetNotice");
    }

    await Promise.all(tasks);
    return summary;
  }
}
