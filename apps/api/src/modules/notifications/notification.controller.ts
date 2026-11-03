import type { Request, Response } from "express";
import { AppError } from "../../shared/errors/app-error.js";
import { ErrorCodes } from "../../shared/errors/error-codes.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { paginationMeta } from "../../shared/http/pagination.schema.js";
import { sendSuccess } from "../../shared/http/response.js";
import { getRequestId } from "../../shared/middleware/request-id.js";
import { toPublicJson } from "../../shared/json/serialize.js";
import type { NotificationService } from "./notification.service.js";
import type { AppEnv } from "../../shared/config/env.js";

function parseId(raw: string): bigint {
  if (!/^\d+$/.test(raw)) {
    throw new AppError(ErrorCodes.BAD_REQUEST, "Invalid id", 400);
  }
  return BigInt(raw);
}

export class NotificationController {
  constructor(
    private readonly service: NotificationService,
    private readonly env: AppEnv,
  ) {}

  list = asyncHandler(async (req: Request, res: Response) => {
    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 20);
    const unreadOnly = req.query.unread === "true";
    const result = await this.service.list(page, pageSize, unreadOnly);
    sendSuccess(res, toPublicJson(result.items), {
      requestId: getRequestId(req),
      ...paginationMeta(page, pageSize, result.total),
    });
  });

  unreadCount = asyncHandler(async (req: Request, res: Response) => {
    const count = await this.service.unreadCount();
    sendSuccess(res, { count }, { requestId: getRequestId(req) });
  });

  markRead = asyncHandler(async (req: Request, res: Response) => {
    const row = await this.service.markRead(parseId(String(req.params.id)));
    sendSuccess(res, toPublicJson(row), { requestId: getRequestId(req) });
  });

  runExpiryJob = asyncHandler(async (req: Request, res: Response) => {
    if (this.env.NODE_ENV === "production") {
      throw new AppError(ErrorCodes.FORBIDDEN, "Job endpoint disabled in production", 403);
    }
    const body = req.body as { asOf?: unknown } | undefined;
    const asOfRaw = body?.asOf;
    const asOf =
      typeof asOfRaw === "string" && !Number.isNaN(Date.parse(asOfRaw))
        ? new Date(asOfRaw)
        : new Date();
    const result = await this.service.runExpiryScan(asOf);
    sendSuccess(res, toPublicJson(result), { requestId: getRequestId(req) });
  });
}
