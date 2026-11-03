import { Prisma } from "@prisma/client";
import { AppError } from "../../shared/errors/app-error.js";
import { ErrorCodes } from "../../shared/errors/error-codes.js";
import type { AuditService } from "../../shared/audit/audit.service.js";
import type { PaginationQuery } from "../../shared/http/pagination.schema.js";
import type { ContractRepository } from "./contract.repository.js";

function parseDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export class ContractService {
  constructor(
    private readonly repository: ContractRepository,
    private readonly audit: AuditService,
  ) {}

  private validateDates(startDate: string, expiryDate: string) {
    const start = parseDateOnly(startDate);
    const expiry = parseDateOnly(expiryDate);
    if (expiry.getTime() < start.getTime()) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, "Expiry date cannot be before start date", 422);
    }
  }

  async create(
    input: {
      contractNumber: string;
      vendorId: bigint;
      startDate: string;
      expiryDate: string;
      contractValue?: number;
      renewalStatus?: string;
    },
    auditContext: { actorUserId?: bigint; requestId?: string },
  ) {
    this.validateDates(input.startDate, input.expiryDate);
    try {
      const contract = await this.repository.create({
        contractNumber: input.contractNumber.trim(),
        vendor: { connect: { vendorId: input.vendorId } },
        startDate: parseDateOnly(input.startDate),
        expiryDate: parseDateOnly(input.expiryDate),
        contractValue:
          input.contractValue !== undefined ? new Prisma.Decimal(input.contractValue) : undefined,
        renewalStatus: input.renewalStatus,
      });
      await this.audit.record({
        actorUserId: auditContext.actorUserId,
        action: "contract.create",
        targetType: "contract",
        targetId: String(contract.contractId),
        result: "success",
        requestId: auditContext.requestId,
      });
      return contract;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new AppError(ErrorCodes.CONFLICT, "Contract number already exists", 409);
      }
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
        throw new AppError(ErrorCodes.VALIDATION_ERROR, "Vendor not found", 422);
      }
      throw err;
    }
  }

  async getById(contractId: bigint) {
    const contract = await this.repository.findById(contractId);
    if (!contract) {
      throw new AppError(ErrorCodes.NOT_FOUND, "Contract not found", 404);
    }
    return contract;
  }

  async update(
    contractId: bigint,
    input: Partial<{
      vendorId: bigint;
      startDate: string;
      expiryDate: string;
      contractValue: number;
      renewalStatus: string;
    }>,
    auditContext: { actorUserId?: bigint; requestId?: string },
  ) {
    const existing = await this.getById(contractId);
    const startDate = input.startDate ?? existing.startDate.toISOString().slice(0, 10);
    const expiryDate = input.expiryDate ?? existing.expiryDate.toISOString().slice(0, 10);
    this.validateDates(startDate, expiryDate);
    try {
      const contract = await this.repository.update(contractId, {
        ...(input.vendorId ? { vendor: { connect: { vendorId: input.vendorId } } } : {}),
        ...(input.startDate ? { startDate: parseDateOnly(input.startDate) } : {}),
        ...(input.expiryDate ? { expiryDate: parseDateOnly(input.expiryDate) } : {}),
        ...(input.contractValue !== undefined
          ? { contractValue: new Prisma.Decimal(input.contractValue) }
          : {}),
        ...(input.renewalStatus !== undefined ? { renewalStatus: input.renewalStatus } : {}),
      });
      await this.audit.record({
        actorUserId: auditContext.actorUserId,
        action: "contract.update",
        targetType: "contract",
        targetId: String(contractId),
        result: "success",
        requestId: auditContext.requestId,
      });
      return contract;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
        throw new AppError(ErrorCodes.NOT_FOUND, "Contract not found", 404);
      }
      throw err;
    }
  }

  list(query: PaginationQuery, filters: { vendorId?: bigint; expiringBefore?: string }) {
    return this.repository.list(query, {
      vendorId: filters.vendorId,
      expiringBefore: filters.expiringBefore
        ? parseDateOnly(filters.expiringBefore)
        : undefined,
    });
  }

  listPurchaseOrders(contractId: bigint) {
    return this.repository.listPurchaseOrders(contractId);
  }
}
