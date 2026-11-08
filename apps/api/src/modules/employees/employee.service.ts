import { Prisma } from "@prisma/client";
import { AppError } from "../../shared/errors/app-error.js";
import { ErrorCodes } from "../../shared/errors/error-codes.js";
import type { PaginationQuery } from "../../shared/http/pagination.schema.js";
import type { PrismaClient } from "@prisma/client";
import type { EmployeeRepository } from "./employee.repository.js";

export class EmployeeService {
  constructor(
    private readonly repository: EmployeeRepository,
    private readonly prisma: PrismaClient,
  ) {}

  private async resolveDepartmentFields(input: {
    departmentId?: bigint;
    department?: string;
  }): Promise<{ departmentId?: bigint | null; department?: string }> {
    if (input.departmentId) {
      const dept = await this.prisma.department.findFirst({
        where: { departmentId: input.departmentId, isActive: true },
      });
      if (!dept) {
        throw new AppError(ErrorCodes.VALIDATION_ERROR, "Unknown or inactive department", 422);
      }
      return { departmentId: dept.departmentId, department: dept.departmentName };
    }
    return { department: input.department, departmentId: null };
  }

  async create(input: {
    employeeNumber: string;
    fullName: string;
    departmentId?: bigint;
    department?: string;
    designation?: string;
    contactNumber?: string;
    email?: string;
  }) {
    const deptFields = await this.resolveDepartmentFields(input);
    try {
      return await this.repository.create({ ...input, ...deptFields });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new AppError(ErrorCodes.CONFLICT, "Employee number already exists", 409);
      }
      throw err;
    }
  }

  getById(employeeId: bigint) {
    return this.repository.findById(employeeId);
  }

  async update(employeeId: bigint, data: Record<string, unknown>) {
    if (data.departmentId !== undefined || data.department !== undefined) {
      const deptFields = await this.resolveDepartmentFields({
        departmentId: data.departmentId as bigint | undefined,
        department: data.department as string | undefined,
      });
      Object.assign(data, deptFields);
    }
    try {
      return await this.repository.update(employeeId, data);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
        throw new AppError(ErrorCodes.NOT_FOUND, "Employee not found", 404);
      }
      throw err;
    }
  }

  deactivate(employeeId: bigint) {
    return this.repository.deactivate(employeeId);
  }

  list(query: PaginationQuery, filters: { search?: string; isActive?: boolean; departmentId?: bigint }) {
    return this.repository.list(query, filters);
  }
}
