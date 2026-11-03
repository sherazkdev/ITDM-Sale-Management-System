import { Prisma } from "@prisma/client";
import { AppError } from "../../shared/errors/app-error.js";
import { ErrorCodes } from "../../shared/errors/error-codes.js";
import {
  AssetStatus,
  canRetireFromStatus,
  normalizeAssetCode,
} from "../../shared/domain/asset-status.js";
import { isNonNegative } from "../../shared/money/decimal-math.js";
import type { AuditService } from "../../shared/audit/audit.service.js";
import type { PaginationQuery } from "../../shared/http/pagination.schema.js";
import type { AssetRepository } from "./asset.repository.js";

export type AssetViewOptions = { includeFinancials: boolean };

function stripFinancials<T extends { purchaseCost?: unknown }>(asset: T): T {
  const { purchaseCost: _removed, ...rest } = asset as T & { purchaseCost?: unknown };
  return rest as T;
}

export class AssetService {
  constructor(
    private readonly repository: AssetRepository,
    private readonly audit: AuditService,
  ) {}

  async register(
    input: {
      assetCode: string;
      assetName: string;
      categoryId: bigint;
      serialNumber?: string;
      purchaseOrderId?: bigint;
      purchaseOrderLineId?: bigint;
      purchaseDate?: string;
      purchaseCost?: number;
      currentLocation?: string;
    },
    auditContext: { actorUserId?: bigint; requestId?: string },
  ) {
    const assetCode = normalizeAssetCode(input.assetCode);
    if (input.purchaseCost !== undefined && !isNonNegative(input.purchaseCost)) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, "Purchase cost must be non-negative", 422);
    }

    try {
      const asset = await this.repository.create({
        assetCode,
        assetName: input.assetName.trim(),
        category: { connect: { categoryId: input.categoryId } },
        serialNumber: input.serialNumber,
        purchaseOrder: input.purchaseOrderId
          ? { connect: { purchaseOrderId: input.purchaseOrderId } }
          : undefined,
        purchaseOrderLine: input.purchaseOrderLineId
          ? { connect: { purchaseOrderLineId: input.purchaseOrderLineId } }
          : undefined,
        purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : undefined,
        purchaseCost:
          input.purchaseCost !== undefined ? new Prisma.Decimal(input.purchaseCost) : undefined,
        currentLocation: input.currentLocation,
        assetStatus: AssetStatus.inStock,
      });
      await this.audit.record({
        actorUserId: auditContext.actorUserId,
        action: "asset.register",
        targetType: "asset",
        targetId: String(asset.assetId),
        result: "success",
        requestId: auditContext.requestId,
        metadata: { assetCode },
      });
      return asset;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === "P2002") {
          throw new AppError(ErrorCodes.CONFLICT, "Asset code already exists", 409);
        }
        if (err.code === "P2025") {
          throw new AppError(ErrorCodes.VALIDATION_ERROR, "Invalid category or purchase reference", 422);
        }
      }
      throw err;
    }
  }

  async getById(assetId: bigint, view: AssetViewOptions) {
    const asset = await this.repository.findById(assetId);
    if (!asset) {
      throw new AppError(ErrorCodes.NOT_FOUND, "Asset not found", 404);
    }
    return view.includeFinancials ? asset : stripFinancials(asset);
  }

  async updateMetadata(
    assetId: bigint,
    data: { assetName?: string; serialNumber?: string; currentLocation?: string },
    auditContext: { actorUserId?: bigint; requestId?: string },
  ) {
    try {
      const asset = await this.repository.updateMetadata(assetId, {
        ...(data.assetName ? { assetName: data.assetName.trim() } : {}),
        ...(data.serialNumber !== undefined ? { serialNumber: data.serialNumber } : {}),
        ...(data.currentLocation !== undefined ? { currentLocation: data.currentLocation } : {}),
      });
      await this.audit.record({
        actorUserId: auditContext.actorUserId,
        action: "asset.update_metadata",
        targetType: "asset",
        targetId: String(assetId),
        result: "success",
        requestId: auditContext.requestId,
      });
      return asset;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
        throw new AppError(ErrorCodes.NOT_FOUND, "Asset not found", 404);
      }
      throw err;
    }
  }

  async retire(
    assetId: bigint,
    auditContext: { actorUserId?: bigint; requestId?: string },
  ) {
    const existing = await this.repository.findById(assetId);
    if (!existing) {
      throw new AppError(ErrorCodes.NOT_FOUND, "Asset not found", 404);
    }
    if (!canRetireFromStatus(existing.assetStatus)) {
      throw new AppError(
        ErrorCodes.CONFLICT,
        "Only in-stock assets can be retired (issuance/return via movement APIs)",
        409,
      );
    }
    const asset = await this.repository.retire(assetId);
    await this.audit.record({
      actorUserId: auditContext.actorUserId,
      action: "asset.retire",
      targetType: "asset",
      targetId: String(assetId),
      result: "success",
      requestId: auditContext.requestId,
    });
    return asset;
  }

  async list(
    query: PaginationQuery,
    filters: { search?: string; categoryId?: bigint; status?: string },
    view: AssetViewOptions,
  ) {
    const result = await this.repository.list(query, filters);
    if (view.includeFinancials) {
      return result;
    }
    return {
      ...result,
      items: result.items.map((a) => stripFinancials(a)),
    };
  }

  getHistory(assetId: bigint) {
    return this.repository.listHistory(assetId);
  }
}
