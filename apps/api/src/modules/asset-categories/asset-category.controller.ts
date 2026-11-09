import type { Request, Response } from "express";
import type { z } from "zod";
import { AppError } from "../../shared/errors/app-error.js";
import { ErrorCodes } from "../../shared/errors/error-codes.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { sendSuccess } from "../../shared/http/response.js";
import { getRequestId } from "../../shared/middleware/request-id.js";
import { toPublicJson } from "../../shared/json/serialize.js";
import multer from "multer";
import { csvFromRows } from "../../shared/export/tabular-export.js";
import { createAssetCategorySchema, updateAssetCategorySchema } from "./asset-category.schema.js";
import type { AssetCategoryService } from "./asset-category.service.js";
import type { AssetCategoryImportService } from "./asset-category-import.service.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

type CreateBody = z.infer<typeof createAssetCategorySchema>;
type UpdateBody = z.infer<typeof updateAssetCategorySchema>;

function parseId(raw: string): bigint {
  if (!/^\d+$/.test(raw)) {
    throw new AppError(ErrorCodes.BAD_REQUEST, "Invalid category id", 400);
  }
  return BigInt(raw);
}

export class AssetCategoryController {
  constructor(
    private readonly service: AssetCategoryService,
    private readonly importService: AssetCategoryImportService,
  ) {}

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

  exportList = asyncHandler(async (_req: Request, res: Response) => {
    const rows = await this.service.list();
    const header = ["categoryName", "description"];
    const body = rows.map((c) => [c.categoryName, c.description ?? ""]);
    res.setHeader("Content-Type", "text/csv");
    res.send(csvFromRows(header, body));
  });

  importSpreadsheet = [
    upload.single("file"),
    asyncHandler(async (req: Request, res: Response) => {
      const file = req.file;
      if (!file?.buffer) throw new AppError(ErrorCodes.VALIDATION_ERROR, "Missing import file", 422);
      const data = await this.importService.importBuffer(file.buffer, file.originalname);
      sendSuccess(res, data, { requestId: getRequestId(req) });
    }),
  ];

  importPreviewSpreadsheet = [
    upload.single("file"),
    asyncHandler(async (req: Request, res: Response) => {
      const file = req.file;
      if (!file?.buffer) throw new AppError(ErrorCodes.VALIDATION_ERROR, "Missing import file", 422);
      const data = await this.importService.previewBuffer(file.buffer, file.originalname);
      sendSuccess(res, data, { requestId: getRequestId(req) });
    }),
  ];
}
