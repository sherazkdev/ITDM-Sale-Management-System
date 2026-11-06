import type { Request, Response } from "express";
import type { z } from "zod";
import { AppError } from "../../shared/errors/app-error.js";
import { ErrorCodes } from "../../shared/errors/error-codes.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { paginationMeta } from "../../shared/http/pagination.schema.js";
import { sendSuccess } from "../../shared/http/response.js";
import { getRequestId } from "../../shared/middleware/request-id.js";
import { toPublicJson } from "../../shared/json/serialize.js";
import {
  createInvoiceSchema,
  listInvoicesQuerySchema,
  postInvoiceSchema,
  recordPaymentSchema,
} from "./invoice.schema.js";
import type { InvoiceService } from "./invoice.service.js";

type CreateBody = z.infer<typeof createInvoiceSchema>;
type PaymentBody = z.infer<typeof recordPaymentSchema>;
type PostBody = z.infer<typeof postInvoiceSchema>;
type ListQuery = z.infer<typeof listInvoicesQuerySchema>;

function parseId(raw: string): bigint {
  if (!/^\d+$/.test(raw)) {
    throw new AppError(ErrorCodes.BAD_REQUEST, "Invalid invoice id", 400);
  }
  return BigInt(raw);
}

export class InvoiceController {
  constructor(private readonly service: InvoiceService) {}

  create = asyncHandler(async (req: Request, res: Response) => {
    const row = await this.service.create(req.body as CreateBody, {
      actorUserId: req.principal?.userId,
      requestId: getRequestId(req),
    });
    sendSuccess(res, toPublicJson(row), { requestId: getRequestId(req) }, 201);
  });

  list = asyncHandler(async (req: Request, res: Response) => {
    const parsed = listInvoicesQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError(ErrorCodes.BAD_REQUEST, parsed.error.issues[0]?.message ?? "Invalid query", 400);
    }
    const query = parsed.data as ListQuery;
    const result = await this.service.list(
      { page: query.page, pageSize: query.pageSize, sortDir: "desc" },
      { search: query.search, paymentStatus: query.paymentStatus },
    );
    sendSuccess(res, toPublicJson(result.items), {
      requestId: getRequestId(req),
      ...paginationMeta(query.page, query.pageSize, result.total),
    });
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const row = await this.service.getById(parseId(String(req.params.id)));
    sendSuccess(res, toPublicJson(row), { requestId: getRequestId(req) });
  });

  balance = asyncHandler(async (req: Request, res: Response) => {
    const row = await this.service.getBalance(parseId(String(req.params.id)));
    sendSuccess(res, toPublicJson(row), { requestId: getRequestId(req) });
  });

  post = asyncHandler(async (req: Request, res: Response) => {
    const row = await this.service.postInvoice(parseId(String(req.params.id)), req.body as PostBody, {
      actorUserId: req.principal?.userId,
      requestId: getRequestId(req),
    });
    sendSuccess(res, toPublicJson(row), { requestId: getRequestId(req) }, 200);
  });

  recordPayment = asyncHandler(async (req: Request, res: Response) => {
    const row = await this.service.recordPayment(
      parseId(String(req.params.id)),
      req.body as PaymentBody,
      { actorUserId: req.principal?.userId, requestId: getRequestId(req) },
    );
    sendSuccess(res, toPublicJson(row), { requestId: getRequestId(req) }, 201);
  });

  listPayments = asyncHandler(async (req: Request, res: Response) => {
    const rows = await this.service.listPayments(parseId(String(req.params.id)));
    sendSuccess(res, toPublicJson(rows), { requestId: getRequestId(req) });
  });

  listForPo = asyncHandler(async (req: Request, res: Response) => {
    const rows = await this.service.listByPurchaseOrder(parseId(String(req.params.id)));
    sendSuccess(res, toPublicJson(rows), { requestId: getRequestId(req) });
  });
}
