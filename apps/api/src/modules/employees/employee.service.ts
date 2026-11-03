import { Prisma } from "@prisma/client";
import { AppError } from "../../shared/errors/app-error.js";
import { ErrorCodes } from "../../shared/errors/error-codes.js";
import type { PaginationQuery } from "../../shared/http/pagination.schema.js";
import type { EmployeeRepository } from "./employee.repository.js";

export class EmployeeService {
  constructor(private readonly repository: EmployeeRepository) {}

  async create(input: {
    employeeNumber: string;
    fullName: string;
    department?: string;
    designation?: string;
    contactNumber?: string;
    email?: string;
  }) {
    try {
      return await this.repository.create(input);
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

  list(query: PaginationQuery, filters: { search?: string; isActive?: boolean }) {
    return this.repository.list(query, filters);
  }
}
