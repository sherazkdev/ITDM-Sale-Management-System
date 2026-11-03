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
    const data = await this.service.buildSummary(req.principal);
    sendSuccess(res, data, { requestId: getRequestId(req) });
  });
}
