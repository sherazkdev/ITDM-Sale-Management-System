import type { Request, Response } from "express";
import type { z } from "zod";
import { AppError } from "../../shared/errors/app-error.js";
import { ErrorCodes } from "../../shared/errors/error-codes.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { paginationMeta } from "../../shared/http/pagination.schema.js";
import { parseListPagination } from "../../shared/http/parse-list-query.js";
import { sendSuccess } from "../../shared/http/response.js";
import { getRequestId } from "../../shared/middleware/request-id.js";
import { toPublicJson } from "../../shared/json/serialize.js";
import {
  completeMaintenanceSchema,
  createMaintenanceSchema,
  updateMaintenanceSchema,
} from "./maintenance.schema.js";
import type { MaintenanceService } from "./maintenance.service.js";

type CreateBody = z.infer<typeof createMaintenanceSchema>;
type UpdateBody = z.infer<typeof updateMaintenanceSchema>;
type CompleteBody = z.infer<typeof completeMaintenanceSchema>;

function parseId(raw: string): bigint {
  if (!/^\d+$/.test(raw)) {
    throw new AppError(ErrorCodes.BAD_REQUEST, "Invalid id", 400);
  }
  return BigInt(raw);
}

export class MaintenanceController {
  constructor(private readonly service: MaintenanceService) {}

  create = asyncHandler(async (req: Request, res: Response) => {
    const row = await this.service.create(req.body as CreateBody, {
      actorUserId: req.principal?.userId,
      requestId: getRequestId(req),
    });
    sendSuccess(res, toPublicJson(row), { requestId: getRequestId(req) }, 201);
  });

  list = asyncHandler(async (req: Request, res: Response) => {
    const pagination = parseListPagination(req, { sortDir: "desc" });
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const assetId =
      typeof req.query.assetId === "string" && /^\d+$/.test(req.query.assetId)
        ? BigInt(req.query.assetId)
        : undefined;
    const result = await this.service.list(pagination, { status, assetId });
    sendSuccess(res, toPublicJson(result.items), {
      requestId: getRequestId(req),
      ...paginationMeta(pagination.page, pagination.pageSize, result.total),
    });
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const row = await this.service.getById(parseId(String(req.params.id)));
    sendSuccess(res, toPublicJson(row), { requestId: getRequestId(req) });
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const row = await this.service.update(parseId(String(req.params.id)), req.body as UpdateBody, {
      actorUserId: req.principal?.userId,
      requestId: getRequestId(req),
    });
    sendSuccess(res, toPublicJson(row), { requestId: getRequestId(req) });
  });

  complete = asyncHandler(async (req: Request, res: Response) => {
    const row = await this.service.complete(
      parseId(String(req.params.id)),
      req.body as CompleteBody,
      { actorUserId: req.principal?.userId, requestId: getRequestId(req) },
    );
    sendSuccess(res, toPublicJson(row), { requestId: getRequestId(req) });
  });

  listByAsset = asyncHandler(async (req: Request, res: Response) => {
    const rows = await this.service.listByAsset(parseId(String(req.params.id)));
    sendSuccess(res, toPublicJson(rows), { requestId: getRequestId(req) });
  });
}
