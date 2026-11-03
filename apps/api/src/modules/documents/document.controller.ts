import type { Request, Response } from "express";
import type { z } from "zod";
import { AppError } from "../../shared/errors/app-error.js";
import { ErrorCodes } from "../../shared/errors/error-codes.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { sendSuccess } from "../../shared/http/response.js";
import { getRequestId } from "../../shared/middleware/request-id.js";
import { toPublicJson } from "../../shared/json/serialize.js";
import { uploadDocumentSchema } from "./document.schema.js";
import type { DocumentService } from "./document.service.js";
import { sanitizeFileName } from "../../shared/storage/file-storage.js";

type UploadBody = z.infer<typeof uploadDocumentSchema>;

function parseId(raw: string): bigint {
  if (!/^\d+$/.test(raw)) {
    throw new AppError(ErrorCodes.BAD_REQUEST, "Invalid id", 400);
  }
  return BigInt(raw);
}

export class DocumentController {
  constructor(private readonly service: DocumentService) {}

  upload = asyncHandler(async (req: Request, res: Response) => {
    const row = await this.service.upload(req.body as UploadBody, {
      actorUserId: req.principal?.userId,
      requestId: getRequestId(req),
    });
    sendSuccess(res, toPublicJson(row), { requestId: getRequestId(req) }, 201);
  });

  metadata = asyncHandler(async (req: Request, res: Response) => {
    const row = await this.service.getMetadata(parseId(String(req.params.id)));
    sendSuccess(res, toPublicJson(row), { requestId: getRequestId(req) });
  });

  download = asyncHandler(async (req: Request, res: Response) => {
    const { row, buffer } = await this.service.download(parseId(String(req.params.id)), {
      actorUserId: req.principal?.userId,
      requestId: getRequestId(req),
    });
    res.setHeader("Content-Type", row.mimeType);
    const safeName = sanitizeFileName(row.originalFileName).replace(/[\r\n"]/g, "_");
    res.setHeader("Content-Disposition", `attachment; filename="${safeName}"`);
    res.send(buffer);
  });

  generateIssuance = asyncHandler(async (req: Request, res: Response) => {
    const format = typeof req.query.format === "string" ? req.query.format : "json";
    const doc = await this.service.generateMovementDocument(
      parseId(String(req.params.id)),
      format,
      { actorUserId: req.principal?.userId, requestId: getRequestId(req) },
    );
    if (format === "pdf" && doc && typeof doc === "object" && "body" in doc) {
      const pdf = doc as { body: Buffer; contentType: string };
      res.setHeader("Content-Type", pdf.contentType);
      res.setHeader("X-ITDMS-Export-Disclaimer", "NON-OFFICIAL-D12");
      res.send(pdf.body);
      return;
    }
    sendSuccess(res, toPublicJson(doc), { requestId: getRequestId(req) });
  });
}
