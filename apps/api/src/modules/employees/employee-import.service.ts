import type { PrismaClient } from "@prisma/client";
import { createEmployeeSchema } from "./employee.schema.js";
import { mapRowsByHeader, parseSpreadsheetBuffer } from "../../shared/import/spreadsheet-parse.js";
import type {
  BulkImportPreviewResult,
  BulkImportPreviewRow,
  BulkImportResult,
} from "../../shared/import/bulk-import-result.js";

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

  async previewBuffer(buffer: Buffer, fileName: string): Promise<BulkImportPreviewResult> {
    const { header, rows } = await parseSpreadsheetBuffer(buffer, fileName);
    const mapped = mapRowsByHeader(header, rows);
    const previewRows: BulkImportPreviewRow[] = [];
    let validCount = 0;
    let duplicateCount = 0;
    let invalidCount = 0;
    const seenInFile = new Set<string>();

    for (let i = 0; i < mapped.length; i++) {
      const rowIndex = i + 2;
      const normalized = normalizeRecord(mapped[i]!);
      const values = {
        employeeNumber: normalized.employeeNumber ?? "",
        fullName: normalized.fullName ?? "",
        department: normalized.department ?? "",
        designation: normalized.designation ?? "",
        email: normalized.email ?? "",
      };
      const deptName = (normalized.department || "").trim();
      const departmentId = deptName ? await this.departments.resolveDepartmentIdByName(deptName) : null;
      if (deptName && !departmentId) {
        invalidCount++;
        previewRows.push({
          row: rowIndex,
          status: "invalid",
          values,
          message: `Unknown department "${deptName}"`,
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
        invalidCount++;
        previewRows.push({
          row: rowIndex,
          status: "invalid",
          values,
          message: parsed.error.flatten().formErrors.join("; ") || "Invalid row",
        });
        continue;
      }
      if (seenInFile.has(parsed.data.employeeNumber)) {
        duplicateCount++;
        previewRows.push({
          row: rowIndex,
          status: "duplicate",
          values,
          message: "Duplicate employee number in file",
        });
        continue;
      }
      const existing = await this.prisma.employee.findUnique({
        where: { employeeNumber: parsed.data.employeeNumber },
      });
      if (existing) {
        duplicateCount++;
        previewRows.push({ row: rowIndex, status: "duplicate", values, message: "Already exists" });
        continue;
      }
      seenInFile.add(parsed.data.employeeNumber);
      validCount++;
      previewRows.push({ row: rowIndex, status: "valid", values });
    }
    return {
      totalRows: mapped.length,
      validCount,
      duplicateCount,
      invalidCount,
      rows: previewRows.slice(0, 200),
    };
  }

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
