import type { Request, Response } from "express";
import type { z } from "zod";
import { AppError } from "../../shared/errors/app-error.js";
import { ErrorCodes } from "../../shared/errors/error-codes.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { sendSuccess } from "../../shared/http/response.js";
import { getRequestId } from "../../shared/middleware/request-id.js";
import { toPublicJson } from "../../shared/json/serialize.js";
import { issueAssetsSchema, returnAssetsSchema } from "./asset-movement.schema.js";
import type { AssetMovementService } from "./asset-movement.service.js";
import type { AssetMovementOfficialExportService } from "./asset-movement-official-export.js";

type IssueBody = z.infer<typeof issueAssetsSchema>;
type ReturnBody = z.infer<typeof returnAssetsSchema>;

function parseDocumentId(raw: string): bigint {
  if (!/^\d+$/.test(raw)) {
    throw new AppError(ErrorCodes.BAD_REQUEST, "Invalid document id", 400);
  }
  return BigInt(raw);
}

export class AssetMovementController {
  constructor(
    private readonly service: AssetMovementService,
    private readonly officialExport?: AssetMovementOfficialExportService,
  ) {}

  issue = asyncHandler(async (req: Request, res: Response) => {
    const principal = req.principal;
    if (!principal) {
      throw new AppError(ErrorCodes.UNAUTHORIZED, "Authentication required", 401);
    }
    const doc = await this.service.issueAssets(req.body as IssueBody, {
      userId: principal.userId,
      requestId: getRequestId(req),
    });
    sendSuccess(res, toPublicJson(doc), { requestId: getRequestId(req) }, 201);
  });

  returnAssets = asyncHandler(async (req: Request, res: Response) => {
    const principal = req.principal;
    if (!principal) {
      throw new AppError(ErrorCodes.UNAUTHORIZED, "Authentication required", 401);
    }
    const doc = await this.service.returnAssets(req.body as ReturnBody, {
      userId: principal.userId,
      requestId: getRequestId(req),
    });
    sendSuccess(res, toPublicJson(doc), { requestId: getRequestId(req) }, 201);
  });

  getIssuance = asyncHandler(async (req: Request, res: Response) => {
    const doc = await this.service.getDocument(parseDocumentId(String(req.params.documentId)));
    sendSuccess(res, toPublicJson(doc), { requestId: getRequestId(req) });
  });

  getReturn = asyncHandler(async (req: Request, res: Response) => {
    const doc = await this.service.getDocument(parseDocumentId(String(req.params.documentId)));
    sendSuccess(res, toPublicJson(doc), { requestId: getRequestId(req) });
  });

  currentHolder = asyncHandler(async (req: Request, res: Response) => {
    const assetId = parseDocumentId(String(req.params.id));
    const holder = await this.service.getCurrentHolder(assetId);
    sendSuccess(res, toPublicJson(holder), { requestId: getRequestId(req) });
  });

  downloadOfficial = asyncHandler(async (req: Request, res: Response) => {
    if (!this.officialExport) {
      throw new AppError(ErrorCodes.INTERNAL_ERROR, "Export service unavailable", 500);
    }
    const documentId = parseDocumentId(String(req.params.documentId));
    const { buffer, filename } = await this.officialExport.generateWorkbook(documentId);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("x-itdms-export-disclaimer", "CLIENT-D12-OFFICIAL-TEMPLATE");
    res.send(buffer);
  });
}
