import type { PrismaClient } from "@prisma/client";
import type { AppEnv } from "../../shared/config/env.js";

function dateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export class NotificationService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly env: AppEnv,
  ) {}

  async runExpiryScan(asOf: Date = new Date()) {
    const leadDays = this.env.NOTIFICATION_LEAD_DAYS;
    const threshold = new Date(asOf.getTime() + leadDays * 24 * 60 * 60 * 1000);

    const [contracts, licenses, purchaseOrders] = await Promise.all([
      this.prisma.contract.findMany({
        where: { expiryDate: { lte: threshold, gte: asOf } },
      }),
      this.prisma.softwareLicense.findMany({
        where: { expiryDate: { lte: threshold, gte: asOf } },
      }),
      this.prisma.purchaseOrder.findMany({
        where: {
          validUntil: { not: null, lte: threshold, gte: asOf },
        },
      }),
    ]);

    let created = 0;
    for (const c of contracts) {
      const dedupeKey = `contract-expiry:${c.contractId}:${dateOnly(c.expiryDate)}`;
      try {
        await this.prisma.notificationEvent.create({
          data: {
            eventType: "CONTRACT_EXPIRY",
            entityType: "contract",
            entityId: String(c.contractId),
            dueOn: c.expiryDate,
            dedupeKey,
            payload: {
              contractNumber: c.contractNumber,
              leadDays,
              policy: "Client Wave 1 — in-app reminder within NOTIFICATION_LEAD_DAYS before expiry",
            },
          },
        });
        created++;
      } catch {
        // duplicate dedupeKey — idempotent
      }
    }
    for (const l of licenses) {
      const dedupeKey = `license-expiry:${l.licenseId}:${dateOnly(l.expiryDate)}`;
      try {
        await this.prisma.notificationEvent.create({
          data: {
            eventType: "LICENSE_EXPIRY",
            entityType: "software_license",
            entityId: String(l.licenseId),
            dueOn: l.expiryDate,
            dedupeKey,
            payload: {
              softwareName: l.softwareName,
              leadDays,
              policy: "Client Wave 1 — in-app reminder within NOTIFICATION_LEAD_DAYS before expiry",
            },
          },
        });
        created++;
      } catch {
        // idempotent
      }
    }
    for (const po of purchaseOrders) {
      if (!po.validUntil) {
        continue;
      }
      const dedupeKey = `po-valid-until:${po.purchaseOrderId}:${dateOnly(po.validUntil)}`;
      try {
        await this.prisma.notificationEvent.create({
          data: {
            eventType: "PO_VALID_UNTIL",
            entityType: "purchase_order",
            entityId: String(po.purchaseOrderId),
            dueOn: po.validUntil,
            dedupeKey,
            payload: {
              poNumber: po.poNumber,
              leadDays,
              validUntil: dateOnly(po.validUntil),
              policy:
                "Client Wave 1 — reminder when valid_until is set; no date invented when null (D04 partial)",
            },
          },
        });
        created++;
      } catch {
        // idempotent
      }
    }
    return {
      created,
      leadDays,
      poExpirySource: "purchase_orders.valid_until when set — no automatic renewal",
    };
  }

  async list(page: number, pageSize: number, unreadOnly: boolean) {
    const where = unreadOnly ? { readAt: null } : {};
    const [items, total] = await Promise.all([
      this.prisma.notificationEvent.findMany({
        where,
        orderBy: { dueOn: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.notificationEvent.count({ where }),
    ]);
    return { items, total };
  }

  async unreadCount() {
    return this.prisma.notificationEvent.count({ where: { readAt: null } });
  }

  async markRead(notificationEventId: bigint) {
    return this.prisma.notificationEvent.update({
      where: { notificationEventId },
      data: { readAt: new Date() },
    });
  }
}
