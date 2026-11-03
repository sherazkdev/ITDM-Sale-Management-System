import type { Request, Response } from "express";
import type { z } from "zod";
import { AppError } from "../../shared/errors/app-error.js";
import { ErrorCodes } from "../../shared/errors/error-codes.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { paginationMeta } from "../../shared/http/pagination.schema.js";
import { sendSuccess } from "../../shared/http/response.js";
import { getRequestId } from "../../shared/middleware/request-id.js";
import { toPublicJson } from "../../shared/json/serialize.js";
import {
  createNonAssetStockItemSchema,
  listNonAssetStockQuerySchema,
  updateNonAssetStockItemSchema,
} from "./non-asset-stock.schema.js";
import type { NonAssetStockService } from "./non-asset-stock.service.js";

type CreateBody = z.infer<typeof createNonAssetStockItemSchema>;
type UpdateBody = z.infer<typeof updateNonAssetStockItemSchema>;

function parseId(raw: string): bigint {
  if (!/^\d+$/.test(raw)) {
    throw new AppError(ErrorCodes.BAD_REQUEST, "Invalid stock item id", 400);
  }
  return BigInt(raw);
}

export class NonAssetStockController {
  constructor(private readonly service: NonAssetStockService) {}

  create = asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as CreateBody;
    const item = await this.service.register(
      {
        stockCode: body.stockCode,
        itemName: body.itemName,
        itemType: body.itemType,
        categoryId: BigInt(body.categoryId),
        quantityOnHand: body.quantityOnHand,
        unitOfMeasure: body.unitOfMeasure,
        purchaseOrderId: body.purchaseOrderId ? BigInt(body.purchaseOrderId) : undefined,
        stockReceivedDate: body.stockReceivedDate,
        currentLocation: body.currentLocation,
        notes: body.notes,
      },
      { actorUserId: req.principal?.userId, requestId: getRequestId(req) },
    );
    sendSuccess(res, toPublicJson(item), { requestId: getRequestId(req) }, 201);
  });

  list = asyncHandler(async (req: Request, res: Response) => {
    const q = listNonAssetStockQuerySchema.parse(req.query);
    const result = await this.service.list(
      { page: q.page, pageSize: q.pageSize, sortDir: "asc" },
      {
        search: q.search,
        categoryId: q.categoryId ? BigInt(q.categoryId) : undefined,
        unitOfMeasure: q.unitOfMeasure,
      },
    );
    sendSuccess(res, toPublicJson(result.items), {
      requestId: getRequestId(req),
      ...paginationMeta(q.page, q.pageSize, result.total),
    });
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const item = await this.service.getById(parseId(String(req.params.id)));
    sendSuccess(res, toPublicJson(item), { requestId: getRequestId(req) });
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as UpdateBody;
    const item = await this.service.updateMetadata(parseId(String(req.params.id)), {
      itemName: body.itemName,
      itemType: body.itemType,
      currentLocation: body.currentLocation,
      notes: body.notes,
    }, {
      actorUserId: req.principal?.userId,
      requestId: getRequestId(req),
    });
    sendSuccess(res, toPublicJson(item), { requestId: getRequestId(req) });
  });
}
