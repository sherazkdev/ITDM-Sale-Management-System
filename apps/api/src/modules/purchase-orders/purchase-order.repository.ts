import type { Prisma, PrismaClient } from "@prisma/client";
import type { PaginationQuery } from "../../shared/http/pagination.schema.js";

export class PurchaseOrderRepository {
  constructor(private readonly prisma: PrismaClient) {}

  createHeader(data: Prisma.PurchaseOrderCreateInput) {
    return this.prisma.purchaseOrder.create({ data });
  }

  findById(purchaseOrderId: bigint) {
    return this.prisma.purchaseOrder.findUnique({
      where: { purchaseOrderId },
      include: { lines: { orderBy: { lineNumber: "asc" } }, vendor: true, contract: true },
    });
  }

  findByNumber(poNumber: string) {
    return this.prisma.purchaseOrder.findUnique({
      where: { poNumber },
      include: { lines: { orderBy: { lineNumber: "asc" } }, vendor: true, contract: true },
    });
  }

  updateHeader(purchaseOrderId: bigint, data: Prisma.PurchaseOrderUpdateInput) {
    return this.prisma.purchaseOrder.update({ where: { purchaseOrderId }, data });
  }

  async list(query: PaginationQuery, filters: { vendorId?: bigint; search?: string }) {
    const where = {
      ...(filters.vendorId ? { vendorId: filters.vendorId } : {}),
      ...(filters.search
        ? { poNumber: { contains: filters.search, mode: "insensitive" as const } }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { purchaseOrderId: "desc" },
        include: { vendor: true },
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);
    return { items, total };
  }

  sumLineSubtotals(tx: Prisma.TransactionClient, purchaseOrderId: bigint) {
    return tx.purchaseOrderLine.aggregate({
      where: { purchaseOrderId },
      _sum: { lineSubtotal: true },
    });
  }
}
