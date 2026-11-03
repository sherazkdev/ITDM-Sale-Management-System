import type { Prisma, PrismaClient } from "@prisma/client";

export class AuditService {
  constructor(private readonly prisma: PrismaClient) {}

  record(input: {
    actorUserId?: bigint;
    action: string;
    targetType: string;
    targetId?: string;
    result: "success" | "failure";
    metadata?: Prisma.InputJsonValue;
    requestId?: string;
  }): Promise<void> {
    return this.prisma.auditLog
      .create({
        data: {
          actorUserId: input.actorUserId,
          action: input.action,
          targetType: input.targetType,
          targetId: input.targetId,
          result: input.result,
          metadata: input.metadata ?? undefined,
          requestId: input.requestId,
        },
      })
      .then(() => undefined);
  }

  async list(filters: {
    targetType?: string;
    actorUserId?: bigint;
    from?: Date;
    to?: Date;
    page: number;
    pageSize: number;
  }) {
    const where = {
      ...(filters.targetType ? { targetType: filters.targetType } : {}),
      ...(filters.actorUserId ? { actorUserId: filters.actorUserId } : {}),
      ...(filters.from || filters.to
        ? {
            occurredAt: {
              ...(filters.from ? { gte: filters.from } : {}),
              ...(filters.to ? { lte: filters.to } : {}),
            },
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { occurredAt: "desc" },
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
        include: { actor: { select: { userId: true, username: true, displayName: true } } },
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { items, total };
  }

  getById(auditLogId: bigint) {
    return this.prisma.auditLog.findUnique({
      where: { auditLogId },
      include: { actor: { select: { userId: true, username: true, displayName: true } } },
    });
  }
}
