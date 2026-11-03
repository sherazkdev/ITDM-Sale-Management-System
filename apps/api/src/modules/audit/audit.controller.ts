import type { Request, Response } from "express";
import { AppError } from "../../shared/errors/app-error.js";
import { ErrorCodes } from "../../shared/errors/error-codes.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { paginationMeta } from "../../shared/http/pagination.schema.js";
import { sendSuccess } from "../../shared/http/response.js";
import { getRequestId } from "../../shared/middleware/request-id.js";
import { toPublicJson } from "../../shared/json/serialize.js";
import type { AuditService } from "../../shared/audit/audit.service.js";

function parseId(raw: string): bigint {
  if (!/^\d+$/.test(raw)) {
    throw new AppError(ErrorCodes.BAD_REQUEST, "Invalid id", 400);
  }
  return BigInt(raw);
}

export class AuditController {
  constructor(private readonly service: AuditService) {}

  list = asyncHandler(async (req: Request, res: Response) => {
    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 50);
    const targetType = typeof req.query.targetType === "string" ? req.query.targetType : undefined;
    const result = await this.service.list({
      targetType,
      page,
      pageSize,
    });
    sendSuccess(res, toPublicJson(result.items), {
      requestId: getRequestId(req),
      ...paginationMeta(page, pageSize, result.total),
    });
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const row = await this.service.getById(parseId(String(req.params.id)));
    if (!row) {
      throw new AppError(ErrorCodes.NOT_FOUND, "Audit event not found", 404);
    }
    sendSuccess(res, toPublicJson(row), { requestId: getRequestId(req) });
  });
}
