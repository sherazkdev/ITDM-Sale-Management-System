import type { PrismaClient } from "@prisma/client";
import type { PaginationQuery } from "../../shared/http/pagination.schema.js";
import { resolveListOrderBy } from "../../shared/http/list-sort.js";

export class VendorRepository {
  constructor(private readonly prisma: PrismaClient) {}

  create(data: {
    vendorName: string;
    registrationNumber?: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    address?: string;
  }) {
    return this.prisma.vendor.create({ data: { ...data, isActive: true } });
  }

  findById(vendorId: bigint) {
    return this.prisma.vendor.findUnique({ where: { vendorId } });
  }

  async findByIdWithRelationCounts(vendorId: bigint) {
    const vendor = await this.findById(vendorId);
    if (!vendor) {
      return null;
    }
    const [contracts, purchaseOrders, maintenanceRecords, softwareLicenses] = await Promise.all([
      this.prisma.contract.count({ where: { vendorId } }),
      this.prisma.purchaseOrder.count({ where: { vendorId } }),
      this.prisma.maintenanceRecord.count({ where: { vendorId } }),
      this.prisma.softwareLicense.count({ where: { vendorId } }),
    ]);
    return {
      ...vendor,
      relationCounts: {
        contracts,
        purchaseOrders,
        maintenanceRecords,
        softwareLicenses,
      },
    };
  }

  update(vendorId: bigint, data: Record<string, unknown>) {
    return this.prisma.vendor.update({ where: { vendorId }, data });
  }

  archive(vendorId: bigint) {
    return this.prisma.vendor.update({
      where: { vendorId },
      data: { isActive: false },
    });
  }

  async list(query: PaginationQuery, filters: { search?: string; isActive?: boolean }) {
    const where = {
      ...(filters.isActive === undefined ? {} : { isActive: filters.isActive }),
      ...(filters.search
        ? {
            OR: [
              { vendorName: { contains: filters.search, mode: "insensitive" as const } },
              { registrationNumber: { contains: filters.search, mode: "insensitive" as const } },
              { contactPerson: { contains: filters.search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.vendor.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: resolveListOrderBy(
          ["vendorName", "registrationNumber", "vendorId"],
          query,
          { vendorName: "asc" },
        ),
      }),
      this.prisma.vendor.count({ where }),
    ]);
    return { items, total };
  }
}
