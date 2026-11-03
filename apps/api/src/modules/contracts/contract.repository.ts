import type { Prisma, PrismaClient } from "@prisma/client";
import type { PaginationQuery } from "../../shared/http/pagination.schema.js";

export class ContractRepository {
  constructor(private readonly prisma: PrismaClient) {}

  create(data: Prisma.ContractCreateInput) {
    return this.prisma.contract.create({ data });
  }

  findById(contractId: bigint) {
    return this.prisma.contract.findUnique({
      where: { contractId },
      include: { vendor: true },
    });
  }

  update(contractId: bigint, data: Prisma.ContractUpdateInput) {
    return this.prisma.contract.update({ where: { contractId }, data });
  }

  listPurchaseOrders(contractId: bigint) {
    return this.prisma.purchaseOrder.findMany({
      where: { contractId },
      orderBy: { poDate: "desc" },
    });
  }

  async list(query: PaginationQuery, filters: { vendorId?: bigint; expiringBefore?: Date }) {
    const where = {
      ...(filters.vendorId ? { vendorId: filters.vendorId } : {}),
      ...(filters.expiringBefore ? { expiryDate: { lte: filters.expiringBefore } } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.contract.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { expiryDate: "asc" },
        include: { vendor: true },
      }),
      this.prisma.contract.count({ where }),
    ]);
    return { items, total };
  }
}
