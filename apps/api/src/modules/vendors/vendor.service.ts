import { Prisma } from "@prisma/client";
import { AppError } from "../../shared/errors/app-error.js";
import { ErrorCodes } from "../../shared/errors/error-codes.js";
import type { PaginationQuery } from "../../shared/http/pagination.schema.js";
import type { VendorRepository } from "./vendor.repository.js";

export class VendorService {
  constructor(private readonly repository: VendorRepository) {}

  async create(input: {
    vendorName: string;
    registrationNumber?: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    address?: string;
  }) {
    try {
      return await this.repository.create(input);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new AppError(ErrorCodes.CONFLICT, "Vendor identifier conflict", 409);
      }
      throw err;
    }
  }

  async getById(vendorId: bigint) {
    const vendor = await this.repository.findByIdWithRelationCounts(vendorId);
    if (!vendor) {
      throw new AppError(ErrorCodes.NOT_FOUND, "Vendor not found", 404);
    }
    return vendor;
  }

  async update(vendorId: bigint, data: Record<string, unknown>) {
    try {
      return await this.repository.update(vendorId, data);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
        throw new AppError(ErrorCodes.NOT_FOUND, "Vendor not found", 404);
      }
      throw err;
    }
  }

  async archive(vendorId: bigint) {
    try {
      return await this.repository.archive(vendorId);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
        throw new AppError(ErrorCodes.NOT_FOUND, "Vendor not found", 404);
      }
      throw err;
    }
  }

  list(query: PaginationQuery, filters: { search?: string; isActive?: boolean }) {
    return this.repository.list(query, filters);
  }
}
