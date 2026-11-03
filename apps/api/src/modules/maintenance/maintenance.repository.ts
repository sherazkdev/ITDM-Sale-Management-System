import type { Prisma, PrismaClient } from "@prisma/client";
import type { PaginationQuery } from "../../shared/http/pagination.schema.js";

export class MaintenanceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  create(data: Prisma.MaintenanceRecordCreateInput) {
    return this.prisma.maintenanceRecord.create({ data });
  }

  findById(maintenanceId: bigint) {
    return this.prisma.maintenanceRecord.findUnique({
      where: { maintenanceId },
      include: { asset: true, vendor: true, contract: true },
    });
  }

  update(maintenanceId: bigint, data: Prisma.MaintenanceRecordUpdateInput) {
    return this.prisma.maintenanceRecord.update({ where: { maintenanceId }, data });
  }

  listByAsset(assetId: bigint) {
    return this.prisma.maintenanceRecord.findMany({
      where: { assetId },
      orderBy: { requestDate: "desc" },
    });
  }

  async list(query: PaginationQuery, filters: { status?: string; assetId?: bigint }) {
    const where = {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.assetId ? { assetId: filters.assetId } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.maintenanceRecord.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { maintenanceId: "desc" },
        include: { asset: true, vendor: true },
      }),
      this.prisma.maintenanceRecord.count({ where }),
    ]);
    return { items, total };
  }
}
