import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { sendSuccess } from "../../shared/http/response.js";
import { getRequestId } from "../../shared/middleware/request-id.js";
import type { HealthService } from "./health.service.js";

export class HealthController {
  constructor(private readonly service: HealthService) {}

  live = asyncHandler(async (req: Request, res: Response) => {
    await Promise.resolve();
    const data = this.service.getLiveness();
    sendSuccess(res, data, { requestId: getRequestId(req) });
  });

  ready = asyncHandler(async (req: Request, res: Response) => {
    const data = await this.service.getReadiness();
    sendSuccess(res, data, { requestId: getRequestId(req) });
  });
}
