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
  createPurchaseOrderSchema,
  purchaseOrderLineSchema,
  updatePurchaseOrderSchema,
} from "./purchase-order.schema.js";
import type { PurchaseOrderService } from "./purchase-order.service.js";

type CreateBody = z.infer<typeof createPurchaseOrderSchema>;
type UpdateBody = z.infer<typeof updatePurchaseOrderSchema>;
type LineBody = z.infer<typeof purchaseOrderLineSchema>;

function parsePoId(raw: string): bigint {
  if (!/^\d+$/.test(raw)) {
    throw new AppError(ErrorCodes.BAD_REQUEST, "Invalid purchase order id", 400);
  }
  return BigInt(raw);
}

function parseLineId(raw: string): bigint {
  if (!/^\d+$/.test(raw)) {
    throw new AppError(ErrorCodes.BAD_REQUEST, "Invalid line id", 400);
  }
  return BigInt(raw);
}

export class PurchaseOrderController {
  constructor(private readonly service: PurchaseOrderService) {}

  create = asyncHandler(async (req: Request, res: Response) => {
    const po = await this.service.createDraft(req.body as CreateBody, {
      actorUserId: req.principal?.userId,
      requestId: getRequestId(req),
    });
    sendSuccess(res, toPublicJson(po), { requestId: getRequestId(req) }, 201);
  });

  list = asyncHandler(async (req: Request, res: Response) => {
    const pagination = parseListPagination(req, { sortDir: "desc" });
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const vendorId =
      typeof req.query.vendorId === "string" && /^\d+$/.test(req.query.vendorId)
        ? BigInt(req.query.vendorId)
        : undefined;
    const result = await this.service.list(pagination, { vendorId, search });
    sendSuccess(res, toPublicJson(result.items), {
      requestId: getRequestId(req),
      ...paginationMeta(pagination.page, pagination.pageSize, result.total),
    });
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const po = await this.service.getById(parsePoId(String(req.params.id)));
    sendSuccess(res, toPublicJson(po), { requestId: getRequestId(req) });
  });

  getByNumber = asyncHandler(async (req: Request, res: Response) => {
    const po = await this.service.getByNumber(String(req.params.poNumber));
    if (!po) {
      throw new AppError(ErrorCodes.NOT_FOUND, "Purchase order not found", 404);
    }
    sendSuccess(res, toPublicJson(po), { requestId: getRequestId(req) });
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const po = await this.service.updateDraftHeader(
      parsePoId(String(req.params.id)),
      req.body as UpdateBody,
      { actorUserId: req.principal?.userId, requestId: getRequestId(req) },
    );
    sendSuccess(res, toPublicJson(po), { requestId: getRequestId(req) });
  });

  addLine = asyncHandler(async (req: Request, res: Response) => {
    const po = await this.service.addLine(
      parsePoId(String(req.params.id)),
      req.body as LineBody,
      { actorUserId: req.principal?.userId, requestId: getRequestId(req) },
    );
    sendSuccess(res, toPublicJson(po), { requestId: getRequestId(req) });
  });

  removeLine = asyncHandler(async (req: Request, res: Response) => {
    const po = await this.service.removeLine(
      parsePoId(String(req.params.id)),
      parseLineId(String(req.params.lineId)),
      { actorUserId: req.principal?.userId, requestId: getRequestId(req) },
    );
    sendSuccess(res, toPublicJson(po), { requestId: getRequestId(req) });
  });

  submit = asyncHandler((_req: Request, _res: Response) => {
    this.service.assertWorkflowEndpointBlocked();
  });

  approve = asyncHandler((_req: Request, _res: Response) => {
    this.service.assertWorkflowEndpointBlocked();
  });

  cancel = asyncHandler((_req: Request, _res: Response) => {
    this.service.assertWorkflowEndpointBlocked();
  });
}
