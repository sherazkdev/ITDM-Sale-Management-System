import { Prisma } from "@prisma/client";
import { AppError } from "../../shared/errors/app-error.js";
import { ErrorCodes } from "../../shared/errors/error-codes.js";
import type { AuditService } from "../../shared/audit/audit.service.js";
import type { PaginationQuery } from "../../shared/http/pagination.schema.js";
import type { PrismaClient } from "@prisma/client";

function parseDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function stripSecrets<T extends { licenseKeyReference?: string | null }>(row: T): T {
  return { ...row, licenseKeyReference: undefined };
}

export class LicenseService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly audit: AuditService,
  ) {}

  private validateDates(startDate: string, expiryDate: string) {
    if (parseDateOnly(expiryDate).getTime() < parseDateOnly(startDate).getTime()) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, "Expiry before start", 422);
    }
  }

  async create(
    input: {
      softwareName: string;
      licenseKeyReference?: string;
      vendorId?: bigint;
      purchaseOrderId?: bigint;
      startDate: string;
      expiryDate: string;
      licenseQuantity: number;
      renewalCost?: number;
      status?: string;
    },
    ctx: { actorUserId?: bigint; requestId?: string },
    viewSecrets: boolean,
  ) {
    this.validateDates(input.startDate, input.expiryDate);
    const row = await this.prisma.softwareLicense.create({
      data: {
        softwareName: input.softwareName,
        licenseKeyReference: input.licenseKeyReference,
        vendor: input.vendorId ? { connect: { vendorId: input.vendorId } } : undefined,
        purchaseOrder: input.purchaseOrderId
          ? { connect: { purchaseOrderId: input.purchaseOrderId } }
          : undefined,
        startDate: parseDateOnly(input.startDate),
        expiryDate: parseDateOnly(input.expiryDate),
        licenseQuantity: input.licenseQuantity,
        renewalCost:
          input.renewalCost !== undefined ? new Prisma.Decimal(input.renewalCost) : undefined,
        status: input.status ?? "ACTIVE",
      },
    });
    await this.audit.record({
      actorUserId: ctx.actorUserId,
      action: "license.create",
      targetType: "software_license",
      targetId: String(row.licenseId),
      result: "success",
      requestId: ctx.requestId,
    });
    return viewSecrets ? row : stripSecrets(row);
  }

  async getById(licenseId: bigint, viewSecrets: boolean) {
    const row = await this.prisma.softwareLicense.findUnique({
      where: { licenseId },
      include: { vendor: true, purchaseOrder: true },
    });
    if (!row) {
      throw new AppError(ErrorCodes.NOT_FOUND, "License not found", 404);
    }
    return viewSecrets ? row : stripSecrets(row);
  }

  async update(
    licenseId: bigint,
    input: Partial<{
      softwareName: string;
      licenseKeyReference: string;
      vendorId: bigint;
      purchaseOrderId: bigint;
      startDate: string;
      expiryDate: string;
      licenseQuantity: number;
      renewalCost: number;
      status: string;
    }>,
    ctx: { actorUserId?: bigint; requestId?: string },
    viewSecrets: boolean,
  ) {
    const existing = await this.getById(licenseId, false);
    const start = input.startDate ?? existing.startDate.toISOString().slice(0, 10);
    const expiry = input.expiryDate ?? existing.expiryDate.toISOString().slice(0, 10);
    this.validateDates(start, expiry);
    const row = await this.prisma.softwareLicense.update({
      where: { licenseId },
      data: {
        ...(input.softwareName ? { softwareName: input.softwareName } : {}),
        ...(input.licenseKeyReference !== undefined
          ? { licenseKeyReference: input.licenseKeyReference }
          : {}),
        ...(input.startDate ? { startDate: parseDateOnly(input.startDate) } : {}),
        ...(input.expiryDate ? { expiryDate: parseDateOnly(input.expiryDate) } : {}),
        ...(input.licenseQuantity !== undefined ? { licenseQuantity: input.licenseQuantity } : {}),
        ...(input.renewalCost !== undefined ? { renewalCost: new Prisma.Decimal(input.renewalCost) } : {}),
        ...(input.status ? { status: input.status } : {}),
      },
    });
    await this.audit.record({
      actorUserId: ctx.actorUserId,
      action: "license.update",
      targetType: "software_license",
      targetId: String(licenseId),
      result: "success",
      requestId: ctx.requestId,
    });
    return viewSecrets ? row : stripSecrets(row);
  }

  async list(query: PaginationQuery, filters: { expiringBefore?: string }, _viewSecrets: boolean) {
    const where = filters.expiringBefore
      ? { expiryDate: { lte: parseDateOnly(filters.expiringBefore) } }
      : {};
    const [items, total] = await Promise.all([
      this.prisma.softwareLicense.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { expiryDate: "asc" },
      }),
      this.prisma.softwareLicense.count({ where }),
    ]);
    return {
      items: items.map((i) => stripSecrets(i)),
      total,
    };
  }

  renewBlocked(): never {
    throw new AppError(
      ErrorCodes.POLICY_NOT_APPROVED,
      "License renewal workflow blocked pending client approval",
      403,
    );
  }
}
