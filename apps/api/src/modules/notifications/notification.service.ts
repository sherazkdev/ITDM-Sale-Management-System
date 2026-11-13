import type { Prisma, PrismaClient } from "@prisma/client";
import type { AppEnv } from "../../shared/config/env.js";
import { listSuperAdminUserIds } from "../../shared/auth/super-admin-users.js";
import {
  EXPIRY_REMINDER_MAX_LEAD_DAYS,
  dateOnlyIso,
  daysUntilExpiryDateOnly,
  isExpiryReminderMilestone,
  startOfUtcDay,
} from "../../shared/domain/expiry-reminder-policy.js";
import type { NotificationListQuery } from "./notification-list.query.js";
import { PurchaseOrderStatus } from "../../shared/domain/purchase-order-status.js";

const LICENSE_INACTIVE = new Set(["inactive", "cancelled", "expired", "retired"]);

type ExpiryTarget = {
  entityType: string;
  entityId: string;
  eventType: string;
  expiry: Date;
  payload: Record<string, unknown>;
};

export class NotificationService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly env: AppEnv,
  ) {}

  private recipientWhere(userId: bigint): Prisma.NotificationEventWhereInput {
    return {
      OR: [{ recipientUserId: userId }, { recipientUserId: null }],
    };
  }

  async runExpiryScan(asOf: Date = new Date()) {
    const asOfDay = startOfUtcDay(asOf);
    const horizon = new Date(asOfDay.getTime() + EXPIRY_REMINDER_MAX_LEAD_DAYS * 86_400_000);
    const recipients = await listSuperAdminUserIds(this.prisma);
    if (recipients.length === 0) {
      return {
        created: 0,
        leadDays: this.env.NOTIFICATION_LEAD_DAYS,
        milestones: EXPIRY_REMINDER_MAX_LEAD_DAYS,
        recipients: 0,
        poExpirySource: "purchase_orders.valid_until when set",
      };
    }

    const [contracts, licenses, purchaseOrders] = await Promise.all([
      this.prisma.contract.findMany({
        where: { expiryDate: { gte: asOfDay, lte: horizon } },
      }),
      this.prisma.softwareLicense.findMany({
        where: { expiryDate: { gte: asOfDay, lte: horizon } },
      }),
      this.prisma.purchaseOrder.findMany({
        where: {
          validUntil: { not: null, gte: asOfDay, lte: horizon },
          status: { not: PurchaseOrderStatus.cancelled },
        },
      }),
    ]);

    const targets: ExpiryTarget[] = [];
    for (const c of contracts) {
      const daysUntil = daysUntilExpiryDateOnly(asOfDay, c.expiryDate);
      if (!isExpiryReminderMilestone(daysUntil)) {
        continue;
      }
      targets.push({
        entityType: "contract",
        entityId: String(c.contractId),
        eventType: "CONTRACT_EXPIRY",
        expiry: c.expiryDate,
        payload: {
          contractNumber: c.contractNumber,
          daysUntil,
          expiryDate: dateOnlyIso(c.expiryDate),
          policy: "Client Prompt #25 — in-app milestone reminder for Super Admin",
        },
      });
    }
    for (const l of licenses) {
      if (LICENSE_INACTIVE.has(l.status.toLowerCase())) {
        continue;
      }
      const daysUntil = daysUntilExpiryDateOnly(asOfDay, l.expiryDate);
      if (!isExpiryReminderMilestone(daysUntil)) {
        continue;
      }
      targets.push({
        entityType: "software_license",
        entityId: String(l.licenseId),
        eventType: "LICENSE_EXPIRY",
        expiry: l.expiryDate,
        payload: {
          softwareName: l.softwareName,
          daysUntil,
          expiryDate: dateOnlyIso(l.expiryDate),
          policy: "Client Prompt #25 — in-app milestone reminder for Super Admin",
        },
      });
    }
    for (const po of purchaseOrders) {
      if (!po.validUntil) {
        continue;
      }
      const daysUntil = daysUntilExpiryDateOnly(asOfDay, po.validUntil);
      if (!isExpiryReminderMilestone(daysUntil)) {
        continue;
      }
      targets.push({
        entityType: "purchase_order",
        entityId: String(po.purchaseOrderId),
        eventType: "PO_VALID_UNTIL",
        expiry: po.validUntil,
        payload: {
          poNumber: po.poNumber,
          daysUntil,
          validUntil: dateOnlyIso(po.validUntil),
          policy: "Client Prompt #25 — reminder on valid_until; no invented dates",
        },
      });
    }

    let created = 0;
    for (const target of targets) {
      for (const recipientUserId of recipients) {
        const dedupeKey = `${target.eventType}:${target.entityId}:${dateOnlyIso(target.expiry)}:d${target.payload.daysUntil}:u${recipientUserId}`;
        try {
          await this.prisma.notificationEvent.create({
            data: {
              eventType: target.eventType,
              entityType: target.entityType,
              entityId: target.entityId,
              dueOn: target.expiry,
              dedupeKey,
              recipientUserId,
              payload: target.payload as Prisma.InputJsonValue,
            },
          });
          created++;
        } catch {
          // duplicate dedupeKey — idempotent
        }
      }
    }

    return {
      created,
      leadDays: EXPIRY_REMINDER_MAX_LEAD_DAYS,
      milestones: EXPIRY_REMINDER_MAX_LEAD_DAYS,
      recipients: recipients.length,
      poExpirySource: "purchase_orders.valid_until when set",
    };
  }

  buildListWhere(
    query: NotificationListQuery,
    asOf: Date = new Date(),
    recipientUserId?: bigint,
  ): Prisma.NotificationEventWhereInput {
    const and: Prisma.NotificationEventWhereInput[] = [];

    if (recipientUserId !== undefined) {
      and.push(this.recipientWhere(recipientUserId));
    }

    if (query.read === "unread") and.push({ readAt: null });
    else if (query.read === "read") and.push({ NOT: { readAt: null } });

    if (query.expiringSoon) {
      const leadDays = Math.max(this.env.NOTIFICATION_LEAD_DAYS, EXPIRY_REMINDER_MAX_LEAD_DAYS);
      const from = startOfUtcDay(asOf);
      const to = new Date(from.getTime() + leadDays * 86_400_000);
      and.push({ dueOn: { gte: from, lte: to } });
    }

    if (query.eventType) {
      and.push({ eventType: query.eventType });
    }

    if (query.dueFrom) {
      and.push({ dueOn: { gte: new Date(`${query.dueFrom}T00:00:00.000Z`) } });
    }
    if (query.dueTo) {
      and.push({ dueOn: { lte: new Date(`${query.dueTo}T23:59:59.999Z`) } });
    }

    if (query.search) {
      const q = query.search;
      and.push({
        OR: [
          { eventType: { contains: q, mode: "insensitive" } },
          { entityType: { contains: q, mode: "insensitive" } },
          { entityId: { contains: q, mode: "insensitive" } },
        ],
      });
    }

    return and.length ? { AND: and } : {};
  }

  async list(query: NotificationListQuery, recipientUserId?: bigint) {
    const where = this.buildListWhere(query, new Date(), recipientUserId);
    const page = query.page;
    const pageSize = query.pageSize;
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

  async unreadCount(recipientUserId?: bigint) {
    const where: Prisma.NotificationEventWhereInput = { readAt: null };
    if (recipientUserId !== undefined) {
      return this.prisma.notificationEvent.count({
        where: { AND: [where, this.recipientWhere(recipientUserId)] },
      });
    }
    return this.prisma.notificationEvent.count({ where });
  }

  async markRead(notificationEventId: bigint, recipientUserId?: bigint) {
    const row = await this.prisma.notificationEvent.findUnique({
      where: { notificationEventId },
    });
    if (!row) {
      return null;
    }
    if (
      recipientUserId !== undefined &&
      row.recipientUserId !== null &&
      row.recipientUserId !== recipientUserId
    ) {
      return null;
    }
    return this.prisma.notificationEvent.update({
      where: { notificationEventId },
      data: { readAt: new Date() },
    });
  }
}
