import type { PrismaClient } from "@prisma/client";
import { createEmployeeSchema } from "./employee.schema.js";
import { mapRowsByHeader, parseSpreadsheetBuffer } from "../../shared/import/spreadsheet-parse.js";
import type { BulkImportResult } from "../../shared/import/bulk-import-result.js";

const HEADER_ALIASES: Record<string, string> = {
  employee_number: "employeeNumber",
  full_name: "fullName",
  contact_number: "contactNumber",
};

function normalizeRecord(raw: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    const key = HEADER_ALIASES[k] ?? k;
    out[key] = v;
  }
  return out;
}

import type { DepartmentService } from "../departments/department.service.js";

export class EmployeeImportService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly departments: DepartmentService,
  ) {}

  async importBuffer(buffer: Buffer, fileName: string): Promise<BulkImportResult> {
    const { header, rows } = await parseSpreadsheetBuffer(buffer, fileName);
    const mapped = mapRowsByHeader(header, rows);
  const result: BulkImportResult = { imported: 0, skipped: 0, errors: [] };

    for (let i = 0; i < mapped.length; i++) {
      const rowIndex = i + 2;
      const normalized = normalizeRecord(mapped[i]!);
      const deptName = (normalized.department || "").trim();
      const departmentId = deptName ? await this.departments.resolveDepartmentIdByName(deptName) : null;
      if (deptName && !departmentId) {
        result.errors.push({
          row: rowIndex,
          message: `Unknown department "${deptName}" — register in Departments first`,
        });
        continue;
      }
      const parsed = createEmployeeSchema.safeParse({
        employeeNumber: normalized.employeeNumber ?? normalized.employeenumber,
        fullName: normalized.fullName ?? normalized.fullname,
        departmentId: departmentId ?? undefined,
        department: deptName || undefined,
        designation: normalized.designation || undefined,
        contactNumber: normalized.contactNumber || undefined,
        email: normalized.email || undefined,
      });
      if (!parsed.success) {
        result.errors.push({ row: rowIndex, message: parsed.error.flatten().formErrors.join("; ") || "Invalid row" });
        continue;
      }
      const existing = await this.prisma.employee.findUnique({
        where: { employeeNumber: parsed.data.employeeNumber },
      });
      if (existing) {
        result.skipped++;
        continue;
      }
      try {
        await this.prisma.employee.create({ data: { ...parsed.data, isActive: true } });
        result.imported++;
      } catch {
        result.errors.push({ row: rowIndex, message: "Failed to create employee" });
      }
    }
    return result;
  }
}
