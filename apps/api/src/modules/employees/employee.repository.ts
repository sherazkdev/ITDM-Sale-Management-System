import type { PrismaClient } from "@prisma/client";
import type { PaginationQuery } from "../../shared/http/pagination.schema.js";

export class EmployeeRepository {
  constructor(private readonly prisma: PrismaClient) {}

  create(data: {
    employeeNumber: string;
    fullName: string;
    department?: string;
    designation?: string;
    contactNumber?: string;
    email?: string;
  }) {
    return this.prisma.employee.create({ data: { ...data, isActive: true } });
  }

  findById(employeeId: bigint) {
    return this.prisma.employee.findUnique({ where: { employeeId } });
  }

  update(employeeId: bigint, data: Record<string, unknown>) {
    return this.prisma.employee.update({ where: { employeeId }, data });
  }

  deactivate(employeeId: bigint) {
    return this.prisma.employee.update({
      where: { employeeId },
      data: { isActive: false },
    });
  }

  async list(query: PaginationQuery, filters: { search?: string; isActive?: boolean }) {
    const where = {
      ...(filters.isActive === undefined ? {} : { isActive: filters.isActive }),
      ...(filters.search
        ? {
            OR: [
              { fullName: { contains: filters.search, mode: "insensitive" as const } },
              { employeeNumber: { contains: filters.search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { employeeId: query.sortDir },
      }),
      this.prisma.employee.count({ where }),
    ]);
    return { items, total };
  }
}
