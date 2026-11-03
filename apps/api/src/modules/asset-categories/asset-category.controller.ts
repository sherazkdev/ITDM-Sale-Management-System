import type { Request, Response } from "express";
import type { z } from "zod";
import { AppError } from "../../shared/errors/app-error.js";
import { ErrorCodes } from "../../shared/errors/error-codes.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { sendSuccess } from "../../shared/http/response.js";
import { getRequestId } from "../../shared/middleware/request-id.js";
import { toPublicJson } from "../../shared/json/serialize.js";
import { createAssetCategorySchema, updateAssetCategorySchema } from "./asset-category.schema.js";
import type { AssetCategoryService } from "./asset-category.service.js";

type CreateBody = z.infer<typeof createAssetCategorySchema>;
type UpdateBody = z.infer<typeof updateAssetCategorySchema>;

function parseId(raw: string): bigint {
  if (!/^\d+$/.test(raw)) {
    throw new AppError(ErrorCodes.BAD_REQUEST, "Invalid category id", 400);
  }
  return BigInt(raw);
}

export class AssetCategoryController {
  constructor(private readonly service: AssetCategoryService) {}

  create = asyncHandler(async (req: Request, res: Response) => {
    const row = await this.service.create(req.body as CreateBody);
    sendSuccess(res, toPublicJson(row), { requestId: getRequestId(req) }, 201);
  });

  list = asyncHandler(async (req: Request, res: Response) => {
    const rows = await this.service.list();
    sendSuccess(res, toPublicJson(rows), { requestId: getRequestId(req) });
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const row = await this.service.update(parseId(String(req.params.id)), req.body as UpdateBody);
    sendSuccess(res, toPublicJson(row), { requestId: getRequestId(req) });
  });
}
