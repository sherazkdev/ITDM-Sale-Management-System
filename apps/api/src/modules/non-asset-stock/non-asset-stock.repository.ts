import type { Prisma, PrismaClient } from "@prisma/client";
import type { PaginationQuery } from "../../shared/http/pagination.schema.js";

export class NonAssetStockRepository {
  constructor(private readonly prisma: PrismaClient) {}

  create(data: Prisma.NonAssetStockItemCreateInput) {
    return this.prisma.nonAssetStockItem.create({
      data,
      include: {
        category: true,
        purchaseOrder: { select: { purchaseOrderId: true, poNumber: true, poDate: true } },
      },
    });
  }

  findById(stockItemId: bigint) {
    return this.prisma.nonAssetStockItem.findUnique({
      where: { stockItemId },
      include: {
        category: true,
        purchaseOrder: { select: { purchaseOrderId: true, poNumber: true, poDate: true } },
      },
    });
  }

  async list(
    query: PaginationQuery,
    filters: { search?: string; categoryId?: bigint; unitOfMeasure?: string },
  ) {
    const where: Prisma.NonAssetStockItemWhereInput = {
      ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
      ...(filters.unitOfMeasure ? { unitOfMeasure: filters.unitOfMeasure } : {}),
      ...(filters.search
        ? {
            OR: [
              { stockCode: { contains: filters.search, mode: "insensitive" } },
              { itemName: { contains: filters.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.nonAssetStockItem.findMany({
        where,
        include: {
          category: true,
          purchaseOrder: { select: { purchaseOrderId: true, poNumber: true, poDate: true } },
        },
        orderBy: { stockCode: "asc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.nonAssetStockItem.count({ where }),
    ]);
    return { items, total };
  }

  update(stockItemId: bigint, data: Prisma.NonAssetStockItemUpdateInput) {
    return this.prisma.nonAssetStockItem.update({
      where: { stockItemId },
      data,
      include: {
        category: true,
        purchaseOrder: { select: { purchaseOrderId: true, poNumber: true, poDate: true } },
      },
    });
  }
}
