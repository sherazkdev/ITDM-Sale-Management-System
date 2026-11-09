import type { Request, Response } from "express";
import type { z } from "zod";
import { AppError } from "../../shared/errors/app-error.js";
import { ErrorCodes } from "../../shared/errors/error-codes.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { paginationMeta } from "../../shared/http/pagination.schema.js";
import { sendSuccess } from "../../shared/http/response.js";
import { getRequestId } from "../../shared/middleware/request-id.js";
import { toPublicJson } from "../../shared/json/serialize.js";
import { createVendorSchema, updateVendorSchema } from "./vendor.schema.js";
import multer from "multer";
import { csvFromRows } from "../../shared/export/tabular-export.js";
import type { VendorService } from "./vendor.service.js";
import type { VendorImportService } from "./vendor-import.service.js";

type CreateVendorBody = z.infer<typeof createVendorSchema>;
type UpdateVendorBody = z.infer<typeof updateVendorSchema>;

function parseVendorId(raw: string): bigint {
  if (!/^\d+$/.test(raw)) {
    throw new AppError(ErrorCodes.BAD_REQUEST, "Invalid vendor id", 400);
  }
  return BigInt(raw);
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

export class VendorController {
  constructor(
    private readonly service: VendorService,
    private readonly importService: VendorImportService,
  ) {}

  create = asyncHandler(async (req: Request, res: Response) => {
    const vendor = await this.service.create(req.body as CreateVendorBody);
    sendSuccess(res, toPublicJson(vendor), { requestId: getRequestId(req) }, 201);
  });

  list = asyncHandler(async (req: Request, res: Response) => {
    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 20);
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const isActive =
      req.query.isActive === "true" ? true : req.query.isActive === "false" ? false : undefined;
    const result = await this.service.list(
      {
        page,
        pageSize,
        sortBy: typeof req.query.sortBy === "string" ? req.query.sortBy : undefined,
        sortDir: req.query.sortDir === "desc" ? "desc" : "asc",
      },
      { search, isActive },
    );
    sendSuccess(res, toPublicJson(result.items), {
      requestId: getRequestId(req),
      ...paginationMeta(page, pageSize, result.total),
    });
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const vendor = await this.service.getById(parseVendorId(String(req.params.id)));
    sendSuccess(res, toPublicJson(vendor), { requestId: getRequestId(req) });
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const vendor = await this.service.update(
      parseVendorId(String(req.params.id)),
      req.body as UpdateVendorBody,
    );
    sendSuccess(res, toPublicJson(vendor), { requestId: getRequestId(req) });
  });

  archive = asyncHandler(async (req: Request, res: Response) => {
    const vendor = await this.service.archive(parseVendorId(String(req.params.id)));
    sendSuccess(res, toPublicJson(vendor), { requestId: getRequestId(req) });
  });

  exportList = asyncHandler(async (req: Request, res: Response) => {
    const format = typeof req.query.format === "string" ? req.query.format : "csv";
    const result = await this.service.list({ page: 1, pageSize: 5000, sortDir: "asc" }, {});
    const header = ["vendorName", "registrationNumber", "contactPerson", "phone", "email", "isActive"];
    const rows = result.items.map((v) => [
      v.vendorName,
      v.registrationNumber ?? "",
      v.contactPerson ?? "",
      v.phone ?? "",
      v.email ?? "",
      v.isActive ? "yes" : "no",
    ]);
    if (format === "json") {
      sendSuccess(res, { header, rows }, { requestId: getRequestId(req) });
      return;
    }
    res.setHeader("Content-Type", "text/csv");
    res.send(csvFromRows(header, rows));
  });

  importSpreadsheet = [
    upload.single("file"),
    asyncHandler(async (req: Request, res: Response) => {
      const file = req.file;
      if (!file?.buffer) {
        throw new AppError(ErrorCodes.VALIDATION_ERROR, "Missing import file", 422);
      }
      const data = await this.importService.importBuffer(file.buffer, file.originalname);
      sendSuccess(res, data, { requestId: getRequestId(req) });
    }),
  ];

  importPreviewSpreadsheet = [
    upload.single("file"),
    asyncHandler(async (req: Request, res: Response) => {
      const file = req.file;
      if (!file?.buffer) {
        throw new AppError(ErrorCodes.VALIDATION_ERROR, "Missing import file", 422);
      }
      const data = await this.importService.previewBuffer(file.buffer, file.originalname);
      sendSuccess(res, data, { requestId: getRequestId(req) });
    }),
  ];
}
