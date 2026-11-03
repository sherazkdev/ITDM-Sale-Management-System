import { Prisma } from "@prisma/client";
import { AppError } from "../../shared/errors/app-error.js";
import { ErrorCodes } from "../../shared/errors/error-codes.js";
import { MaintenanceStatus } from "../../shared/domain/maintenance-status.js";
import { isNonNegative } from "../../shared/money/decimal-math.js";
import type { AuditService } from "../../shared/audit/audit.service.js";
import type { PaginationQuery } from "../../shared/http/pagination.schema.js";
import type { PrismaClient } from "@prisma/client";
import type { MaintenanceRepository } from "./maintenance.repository.js";

function parseDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export class MaintenanceService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly repository: MaintenanceRepository,
    private readonly audit: AuditService,
  ) {}

  async create(
    input: {
      assetId?: bigint;
      contractId?: bigint;
      vendorId?: bigint;
      maintenanceType: string;
      requestDate: string;
      cost?: number;
      remarks?: string;
    },
    ctx: { actorUserId?: bigint; requestId?: string },
  ) {
    if (input.cost !== undefined && !isNonNegative(input.cost)) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, "Cost must be non-negative", 422);
    }
    if (input.vendorId) {
      const vendor = await this.prisma.vendor.findUnique({ where: { vendorId: input.vendorId } });
      if (!vendor || !vendor.isActive) {
        throw new AppError(ErrorCodes.VALIDATION_ERROR, "Vendor not found or inactive", 422);
      }
    }
    const record = await this.repository.create({
      maintenanceType: input.maintenanceType,
      requestDate: parseDateOnly(input.requestDate),
      status: MaintenanceStatus.open,
      cost: input.cost !== undefined ? new Prisma.Decimal(input.cost) : undefined,
      remarks: input.remarks,
      asset: input.assetId ? { connect: { assetId: input.assetId } } : undefined,
      contract: input.contractId ? { connect: { contractId: input.contractId } } : undefined,
      vendor: input.vendorId ? { connect: { vendorId: input.vendorId } } : undefined,
    });
    await this.audit.record({
      actorUserId: ctx.actorUserId,
      action: "maintenance.create",
      targetType: "maintenance_record",
      targetId: String(record.maintenanceId),
      result: "success",
      requestId: ctx.requestId,
    });
    return record;
  }

  async getById(maintenanceId: bigint) {
    const row = await this.repository.findById(maintenanceId);
    if (!row) {
      throw new AppError(ErrorCodes.NOT_FOUND, "Maintenance record not found", 404);
    }
    return row;
  }

  async update(
    maintenanceId: bigint,
    input: {
      maintenanceType?: string;
      vendorId?: bigint | null;
      contractId?: bigint | null;
      cost?: number;
      remarks?: string;
    },
    ctx: { actorUserId?: bigint; requestId?: string },
  ) {
    const existing = await this.getById(maintenanceId);
    if (existing.status === MaintenanceStatus.completed || existing.status === MaintenanceStatus.cancelled) {
      throw new AppError(ErrorCodes.CONFLICT, "Closed maintenance record cannot be edited", 409);
    }
    const row = await this.repository.update(maintenanceId, {
      ...(input.maintenanceType ? { maintenanceType: input.maintenanceType } : {}),
      ...(input.cost !== undefined ? { cost: new Prisma.Decimal(input.cost) } : {}),
      ...(input.remarks !== undefined ? { remarks: input.remarks } : {}),
      ...(input.vendorId === null ? { vendor: { disconnect: true } } : {}),
      ...(input.vendorId ? { vendor: { connect: { vendorId: input.vendorId } } } : {}),
    });
    await this.audit.record({
      actorUserId: ctx.actorUserId,
      action: "maintenance.update",
      targetType: "maintenance_record",
      targetId: String(maintenanceId),
      result: "success",
      requestId: ctx.requestId,
    });
    return row;
  }

  async complete(
    maintenanceId: bigint,
    input: { completionDate: string; cost?: number; remarks?: string },
    ctx: { actorUserId?: bigint; requestId?: string },
  ) {
    const existing = await this.getById(maintenanceId);
    const completion = parseDateOnly(input.completionDate);
    if (completion.getTime() < existing.requestDate.getTime()) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, "Completion cannot precede request date", 422);
    }
    if (existing.status === MaintenanceStatus.cancelled) {
      throw new AppError(ErrorCodes.CONFLICT, "Cancelled record cannot be completed", 409);
    }
    const row = await this.repository.update(maintenanceId, {
      status: MaintenanceStatus.completed,
      completionDate: completion,
      ...(input.cost !== undefined ? { cost: new Prisma.Decimal(input.cost) } : {}),
      ...(input.remarks !== undefined ? { remarks: input.remarks } : {}),
    });
    await this.audit.record({
      actorUserId: ctx.actorUserId,
      action: "maintenance.complete",
      targetType: "maintenance_record",
      targetId: String(maintenanceId),
      result: "success",
      requestId: ctx.requestId,
    });
    return row;
  }

  list(query: PaginationQuery, filters: { status?: string; assetId?: bigint }) {
    return this.repository.list(query, filters);
  }

  listByAsset(assetId: bigint) {
    return this.repository.listByAsset(assetId);
  }
}
