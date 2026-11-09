import type { Request, Response } from "express";
import { AppError } from "../../shared/errors/app-error.js";
import { ErrorCodes } from "../../shared/errors/error-codes.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { sendSuccess } from "../../shared/http/response.js";
import { getRequestId } from "../../shared/middleware/request-id.js";
import type { DashboardService } from "./dashboard.service.js";

export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  summary = asyncHandler(async (req: Request, res: Response) => {
    if (!req.principal) {
      throw new AppError(ErrorCodes.UNAUTHORIZED, "Authentication required", 401);
    }
    const parseDate = (raw: unknown): Date | undefined => {
      if (typeof raw !== "string" || !/^\d{4}-\d{2}-\d{2}/.test(raw)) return undefined;
      const d = new Date(raw);
      return Number.isNaN(d.getTime()) ? undefined : d;
    };
    const parseId = (raw: unknown): bigint | undefined => {
      if (typeof raw !== "string" || !/^\d+$/.test(raw)) return undefined;
      return BigInt(raw);
    };
    const data = await this.service.buildSummary(req.principal, {
      activityFrom: parseDate(req.query.from),
      activityTo: parseDate(req.query.to),
      departmentId: parseId(req.query.departmentId),
      financialYearId: parseId(req.query.financialYearId),
      poStatus:
        typeof req.query.poStatus === "string" && req.query.poStatus.length > 0
          ? req.query.poStatus
          : undefined,
      assetCategoryId: parseId(req.query.assetCategoryId),
      assetStatus:
        typeof req.query.assetStatus === "string" && req.query.assetStatus.length > 0
          ? req.query.assetStatus
          : undefined,
    });
    sendSuccess(res, data, { requestId: getRequestId(req) });
  });
}
