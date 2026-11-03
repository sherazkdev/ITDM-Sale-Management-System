import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { sendSuccess } from "../../shared/http/response.js";
import { getRequestId } from "../../shared/middleware/request-id.js";
import { toPublicJson } from "../../shared/json/serialize.js";
import type { SearchService } from "./search.service.js";

export class SearchController {
  constructor(private readonly service: SearchService) {}

  byPoNumber = asyncHandler(async (req: Request, res: Response) => {
    const poNumber = String(req.params.poNumber);
    const result = await this.service.byPurchaseOrderNumber(poNumber);
    sendSuccess(res, toPublicJson(result), { requestId: getRequestId(req) });
  });
}
