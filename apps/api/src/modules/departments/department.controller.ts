import type { Request, Response } from "express";
import type { z } from "zod";
import multer from "multer";
import { AppError } from "../../shared/errors/app-error.js";
import { ErrorCodes } from "../../shared/errors/error-codes.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { paginationMeta } from "../../shared/http/pagination.schema.js";
import { sendSuccess } from "../../shared/http/response.js";
import { getRequestId } from "../../shared/middleware/request-id.js";
import { toPublicJson } from "../../shared/json/serialize.js";
import { csvFromRows } from "../../shared/export/tabular-export.js";
import { createDepartmentSchema, updateDepartmentSchema } from "./department.schema.js";
import type { DepartmentService } from "./department.service.js";
import type { DepartmentImportService } from "./department-import.service.js";

type CreateBody = z.infer<typeof createDepartmentSchema>;
type UpdateBody = z.infer<typeof updateDepartmentSchema>;

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

function parseId(raw: string): bigint {
  if (!/^\d+$/.test(raw)) throw new AppError(ErrorCodes.BAD_REQUEST, "Invalid department id", 400);
  return BigInt(raw);
}

export class DepartmentController {
  constructor(
    private readonly service: DepartmentService,
    private readonly importService: DepartmentImportService,
  ) {}

  list = asyncHandler(async (req: Request, res: Response) => {
    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 20);
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const isActive =
      req.query.isActive === "true" ? true : req.query.isActive === "false" ? false : undefined;
    const result = await this.service.list({ page, pageSize, sortDir: "asc" }, { search, isActive });
    sendSuccess(res, toPublicJson(result.items), {
      requestId: getRequestId(req),
      ...paginationMeta(page, pageSize, result.total),
    });
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const row = await this.service.getById(parseId(String(req.params.id)));
    sendSuccess(res, toPublicJson(row), { requestId: getRequestId(req) });
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const row = await this.service.create(req.body as CreateBody, req.principal?.userId, getRequestId(req));
    sendSuccess(res, toPublicJson(row), { requestId: getRequestId(req) }, 201);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const row = await this.service.update(
      parseId(String(req.params.id)),
      req.body as UpdateBody,
      req.principal?.userId,
      getRequestId(req),
    );
    sendSuccess(res, toPublicJson(row), { requestId: getRequestId(req) });
  });

  exportList = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.service.list({ page: 1, pageSize: 5000, sortDir: "asc" }, {
      search: typeof req.query.search === "string" ? req.query.search : undefined,
      isActive:
        req.query.isActive === "true" ? true : req.query.isActive === "false" ? false : undefined,
    });
    const header = ["departmentCode", "departmentName", "description", "isActive", "employeeCount"];
    const rows = result.items.map((d) => [
      d.departmentCode,
      d.departmentName,
      d.description ?? "",
      d.isActive ? "yes" : "no",
      String(d._count.employees),
    ]);
    res.setHeader("Content-Type", "text/csv");
    res.send(csvFromRows(header, rows));
  });

  importSpreadsheet = [
    upload.single("file"),
    asyncHandler(async (req: Request, res: Response) => {
      const file = req.file;
      if (!file?.buffer) throw new AppError(ErrorCodes.VALIDATION_ERROR, "Missing import file", 422);
      const data = await this.importService.importBuffer(
        file.buffer,
        file.originalname,
        req.principal?.userId,
        getRequestId(req),
      );
      sendSuccess(res, data, { requestId: getRequestId(req) });
    }),
  ];
}
