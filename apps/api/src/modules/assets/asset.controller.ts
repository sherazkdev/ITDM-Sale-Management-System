import type { Request, Response } from "express";
import type { z } from "zod";
import { AppError } from "../../shared/errors/app-error.js";
import { ErrorCodes } from "../../shared/errors/error-codes.js";
import { PermissionKeys } from "../../shared/auth/permissions.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { paginationMeta } from "../../shared/http/pagination.schema.js";
import { parseListPagination } from "../../shared/http/parse-list-query.js";
import { sendSuccess } from "../../shared/http/response.js";
import { getRequestId } from "../../shared/middleware/request-id.js";
import { toPublicJson } from "../../shared/json/serialize.js";
import { registerAssetSchema, updateAssetMetadataSchema } from "./asset.schema.js";
import type { AssetService } from "./asset.service.js";

type RegisterBody = z.infer<typeof registerAssetSchema>;
type UpdateBody = z.infer<typeof updateAssetMetadataSchema>;

function parseAssetId(raw: string): bigint {
  if (!/^\d+$/.test(raw)) {
    throw new AppError(ErrorCodes.BAD_REQUEST, "Invalid asset id", 400);
  }
  return BigInt(raw);
}

function canViewFinancials(req: Request): boolean {
  const p = req.principal?.permissions;
  if (!p) {
    return false;
  }
  return (
    p.has(PermissionKeys.assetsManage) ||
    p.has(PermissionKeys.assetsFinancialsRead) ||
    p.has(PermissionKeys.invoicesRead)
  );
}

export class AssetController {
  constructor(private readonly service: AssetService) {}

  register = asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as RegisterBody;
    const asset = await this.service.register(body, {
      actorUserId: req.principal?.userId,
      requestId: getRequestId(req),
    });
    sendSuccess(res, toPublicJson(asset), { requestId: getRequestId(req) }, 201);
  });

  list = asyncHandler(async (req: Request, res: Response) => {
    const pagination = parseListPagination(req, { sortDir: "asc" });
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const categoryId =
      typeof req.query.categoryId === "string" && /^\d+$/.test(req.query.categoryId)
        ? BigInt(req.query.categoryId)
        : undefined;
    const result = await this.service.list(
      pagination,
      { search, categoryId, status },
      { includeFinancials: canViewFinancials(req) },
    );
    sendSuccess(res, toPublicJson(result.items), {
      requestId: getRequestId(req),
      ...paginationMeta(pagination.page, pagination.pageSize, result.total),
    });
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const asset = await this.service.getById(parseAssetId(String(req.params.id)), {
      includeFinancials: canViewFinancials(req),
    });
    sendSuccess(res, toPublicJson(asset), { requestId: getRequestId(req) });
  });

  updateMetadata = asyncHandler(async (req: Request, res: Response) => {
    const asset = await this.service.updateMetadata(
      parseAssetId(String(req.params.id)),
      req.body as UpdateBody,
      { actorUserId: req.principal?.userId, requestId: getRequestId(req) },
    );
    sendSuccess(res, toPublicJson(asset), { requestId: getRequestId(req) });
  });

  retire = asyncHandler(async (req: Request, res: Response) => {
    const asset = await this.service.retire(parseAssetId(String(req.params.id)), {
      actorUserId: req.principal?.userId,
      requestId: getRequestId(req),
    });
    sendSuccess(res, toPublicJson(asset), { requestId: getRequestId(req) });
  });

  history = asyncHandler(async (req: Request, res: Response) => {
    const rows = await this.service.getHistory(parseAssetId(String(req.params.id)));
    sendSuccess(res, toPublicJson(rows), { requestId: getRequestId(req) });
  });
}
