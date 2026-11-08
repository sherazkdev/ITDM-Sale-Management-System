import { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import type { AuditService } from "../../shared/audit/audit.service.js";
import { AppError } from "../../shared/errors/app-error.js";
import { ErrorCodes } from "../../shared/errors/error-codes.js";
import type { PaginationQuery } from "../../shared/http/pagination.schema.js";
import { slugDepartmentCode } from "./department-code.js";

export class DepartmentService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly audit: AuditService,
  ) {}

  async list(query: PaginationQuery, filters: { search?: string; isActive?: boolean }) {
    const where = {
      ...(filters.isActive === undefined ? {} : { isActive: filters.isActive }),
      ...(filters.search
        ? {
            OR: [
              { departmentName: { contains: filters.search, mode: "insensitive" as const } },
              { departmentCode: { contains: filters.search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.department.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { departmentName: "asc" },
        include: { _count: { select: { employees: true } } },
      }),
      this.prisma.department.count({ where }),
    ]);
    return { items, total };
  }

  async getById(departmentId: bigint) {
    const row = await this.prisma.department.findUnique({
      where: { departmentId },
      include: { _count: { select: { employees: true } } },
    });
    if (!row) throw new AppError(ErrorCodes.NOT_FOUND, "Department not found", 404);
    return row;
  }

  async create(
    input: { departmentName: string; departmentCode?: string; description?: string },
    actorUserId?: bigint,
    requestId?: string,
  ) {
    const departmentName = input.departmentName.trim();
    let code = input.departmentCode?.trim() || slugDepartmentCode(departmentName);
    const existingCode = await this.prisma.department.findUnique({ where: { departmentCode: code } });
    if (existingCode) {
      if (input.departmentCode) {
        throw new AppError(ErrorCodes.CONFLICT, "Department code already exists", 409);
      }
      code = `${code}_${Date.now().toString(36).slice(-4)}`;
    }
    try {
      const row = await this.prisma.department.create({
        data: {
          departmentCode: code,
          departmentName,
          description: input.description,
        },
      });
      await this.audit.record({
        actorUserId,
        action: "department.create",
        targetType: "department",
        targetId: row.departmentId.toString(),
        result: "success",
        requestId,
      });
      return row;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new AppError(ErrorCodes.CONFLICT, "Department code or name already exists", 409);
      }
      throw err;
    }
  }

  async update(
    departmentId: bigint,
    data: { departmentName?: string; description?: string | null; isActive?: boolean },
    actorUserId?: bigint,
    requestId?: string,
  ) {
    const update: Prisma.DepartmentUpdateInput = {};
    if (data.departmentName !== undefined) update.departmentName = data.departmentName.trim();
    if (data.description !== undefined) update.description = data.description;
    if (data.isActive !== undefined) update.isActive = data.isActive;
    try {
      const row = await this.prisma.department.update({ where: { departmentId }, data: update });
      if (data.departmentName) {
        await this.prisma.employee.updateMany({
          where: { departmentId },
          data: { department: data.departmentName.trim() },
        });
      }
      await this.audit.record({
        actorUserId,
        action: "department.update",
        targetType: "department",
        targetId: departmentId.toString(),
        result: "success",
        requestId,
      });
      return row;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
        throw new AppError(ErrorCodes.NOT_FOUND, "Department not found", 404);
      }
      throw err;
    }
  }

  async resolveDepartmentIdByName(name: string): Promise<bigint | null> {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const byMaster = await this.prisma.department.findFirst({
      where: { departmentName: { equals: trimmed, mode: "insensitive" }, isActive: true },
    });
    if (byMaster) return byMaster.departmentId;
    const legacy = await this.prisma.departmentLegacyLabel.findUnique({
      where: { legacyLabel: trimmed },
      include: { department: true },
    });
    if (legacy?.departmentId && legacy.department?.isActive) return legacy.departmentId;
    return null;
  }
}
