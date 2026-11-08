import type { Prisma, PrismaClient } from "@prisma/client";
import type { PaginationQuery } from "../../shared/http/pagination.schema.js";
import { resolveListOrderBy } from "../../shared/http/list-sort.js";

export class AssetRepository {
  constructor(private readonly prisma: PrismaClient) {}

  create(data: Prisma.AssetCreateInput) {
    return this.prisma.asset.create({ data });
  }

  findById(assetId: bigint) {
    return this.prisma.asset.findUnique({
      where: { assetId },
      include: { category: true },
    });
  }

  findByCode(assetCode: string) {
    return this.prisma.asset.findUnique({ where: { assetCode } });
  }

  updateMetadata(assetId: bigint, data: Prisma.AssetUpdateInput) {
    return this.prisma.asset.update({ where: { assetId }, data });
  }

  retire(assetId: bigint) {
    return this.prisma.asset.update({
      where: { assetId },
      data: { assetStatus: "RETIRED", currentAssigneeEmployeeId: null },
    });
  }

  listHistory(assetId: bigint) {
    return this.prisma.assetTransaction.findMany({
      where: { assetId },
      orderBy: { transactionDate: "asc" },
      include: { employee: true, movementDocument: true },
    });
  }

  async list(query: PaginationQuery, filters: { search?: string; categoryId?: bigint; status?: string }) {
    const where = {
      ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
      ...(filters.status ? { assetStatus: filters.status } : {}),
      ...(filters.search
        ? {
            OR: [
              { assetCode: { contains: filters.search, mode: "insensitive" as const } },
              { assetName: { contains: filters.search, mode: "insensitive" as const } },
              { serialNumber: { contains: filters.search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.asset.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: resolveListOrderBy(
          ["assetCode", "assetName", "assetStatus", "assetId"],
          query,
          { assetCode: "asc" },
        ),
        include: { category: true },
      }),
      this.prisma.asset.count({ where }),
    ]);
    return { items, total };
  }

  lockAssetForUpdate(tx: Prisma.TransactionClient, assetId: bigint) {
    return tx.$queryRaw<{ asset_id: bigint }[]>`
      SELECT asset_id FROM assets WHERE asset_id = ${assetId} FOR UPDATE
    `;
  }
}
