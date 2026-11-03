import { Prisma } from "@prisma/client";
import { AppError } from "../../shared/errors/app-error.js";
import { ErrorCodes } from "../../shared/errors/error-codes.js";
import { normalizeStockCode } from "../../shared/domain/inventory-units.js";
import type { AuditService } from "../../shared/audit/audit.service.js";
import type { PaginationQuery } from "../../shared/http/pagination.schema.js";
import type { NonAssetStockRepository } from "./non-asset-stock.repository.js";
import type { PrismaClient } from "@prisma/client";
import { enrichNonAssetStockItem } from "./non-asset-stock.presenter.js";

export class NonAssetStockService {
  constructor(
    private readonly repository: NonAssetStockRepository,
    private readonly prisma: PrismaClient,
    private readonly audit: AuditService,
  ) {}

  async register(
    input: {
      stockCode: string;
      itemName: string;
      itemType?: string;
      categoryId: bigint;
      quantityOnHand: number;
      unitOfMeasure: string;
      purchaseOrderId?: bigint;
      stockReceivedDate?: string;
      currentLocation?: string;
      notes?: string;
    },
    auditContext: { actorUserId?: bigint; requestId?: string },
  ) {
    const stockCode = normalizeStockCode(input.stockCode);
    if (input.purchaseOrderId) {
      const po = await this.prisma.purchaseOrder.findUnique({
        where: { purchaseOrderId: input.purchaseOrderId },
      });
      if (!po) {
        throw new AppError(ErrorCodes.VALIDATION_ERROR, "Purchase order not found", 422);
      }
    }
    const received =
      input.stockReceivedDate !== undefined
        ? new Date(`${input.stockReceivedDate}T00:00:00.000Z`)
        : new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`);
    try {
      const item = await this.repository.create({
        stockCode,
        itemName: input.itemName.trim(),
        itemType: input.itemType?.trim() || null,
        category: { connect: { categoryId: input.categoryId } },
        quantityOnHand: new Prisma.Decimal(input.quantityOnHand),
        unitOfMeasure: input.unitOfMeasure,
        stockReceivedDate: received,
        purchaseOrder: input.purchaseOrderId
          ? { connect: { purchaseOrderId: input.purchaseOrderId } }
          : undefined,
        currentLocation: input.currentLocation?.trim(),
        notes: input.notes?.trim(),
      });
      await this.audit.record({
        actorUserId: auditContext.actorUserId,
        action: "non_asset_stock.register",
        targetType: "non_asset_stock_item",
        targetId: String(item.stockItemId),
        result: "success",
        requestId: auditContext.requestId,
        metadata: { stockCode, unitOfMeasure: input.unitOfMeasure },
      });
      return enrichNonAssetStockItem(item);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === "P2002") {
          throw new AppError(ErrorCodes.CONFLICT, "Stock code already exists", 409);
        }
        if (err.code === "P2025") {
          throw new AppError(ErrorCodes.VALIDATION_ERROR, "Invalid category", 422);
        }
      }
      throw err;
    }
  }

  async getById(stockItemId: bigint) {
    const item = await this.repository.findById(stockItemId);
    if (!item) {
      throw new AppError(ErrorCodes.NOT_FOUND, "Non-asset stock item not found", 404);
    }
    return enrichNonAssetStockItem(item);
  }

  async list(
    query: PaginationQuery,
    filters: { search?: string; categoryId?: bigint; unitOfMeasure?: string },
  ) {
    const result = await this.repository.list(query, filters);
    return {
      items: result.items.map((item) => enrichNonAssetStockItem(item)),
      total: result.total,
    };
  }

  async updateMetadata(
    stockItemId: bigint,
    data: { itemName?: string; itemType?: string | null; currentLocation?: string; notes?: string },
    auditContext: { actorUserId?: bigint; requestId?: string },
  ) {
    try {
      const item = await this.repository.update(stockItemId, {
        ...(data.itemName ? { itemName: data.itemName.trim() } : {}),
        ...(data.itemType !== undefined
          ? { itemType: data.itemType?.trim() || null }
          : {}),
        ...(data.currentLocation !== undefined
          ? { currentLocation: data.currentLocation.trim() || null }
          : {}),
        ...(data.notes !== undefined ? { notes: data.notes.trim() || null } : {}),
      });
      await this.audit.record({
        actorUserId: auditContext.actorUserId,
        action: "non_asset_stock.update_metadata",
        targetType: "non_asset_stock_item",
        targetId: String(stockItemId),
        result: "success",
        requestId: auditContext.requestId,
      });
      return enrichNonAssetStockItem(item);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
        throw new AppError(ErrorCodes.NOT_FOUND, "Non-asset stock item not found", 404);
      }
      throw err;
    }
  }
}
