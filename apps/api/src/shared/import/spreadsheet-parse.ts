import ExcelJS from "exceljs";
import { AppError } from "../errors/app-error.js";
import { ErrorCodes } from "../errors/error-codes.js";

export function sanitizeCsvCell(value: string): string {
  const trimmed = value.trim();
  if (/^[=+\-@]/.test(trimmed)) {
    return `'${trimmed}`;
  }
  return trimmed;
}

export async function parseSpreadsheetBuffer(
  buffer: Buffer,
  fileName: string,
): Promise<{ header: string[]; rows: string[][] }> {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".csv")) {
    const text = buffer.toString("utf8");
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 1) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, "Empty CSV file", 422);
    }
    const header = lines[0]!.split(",").map((c) => sanitizeCsvCell(c.replace(/^"|"$/g, "")));
    const rows = lines.slice(1).map((line) =>
      line.split(",").map((c) => sanitizeCsvCell(c.replace(/^"|"$/g, ""))),
    );
    return { header, rows };
  }
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const sheet = workbook.worksheets[0];
    if (!sheet || sheet.rowCount < 1) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, "Empty spreadsheet", 422);
    }
    const headerRow = sheet.getRow(1);
    const header: string[] = [];
    headerRow.eachCell({ includeEmpty: true }, (cell, col) => {
      header[col - 1] = sanitizeCsvCell(String(cell.text ?? "").trim());
    });
    const rows: string[][] = [];
    for (let r = 2; r <= sheet.rowCount; r++) {
      const row = sheet.getRow(r);
      const values: string[] = [];
      let empty = true;
      row.eachCell({ includeEmpty: true }, (cell, col) => {
        const v = sanitizeCsvCell(String(cell.text ?? "").trim());
        values[col - 1] = v;
        if (v) empty = false;
      });
      if (!empty) rows.push(values);
    }
    return { header, rows };
  }
  throw new AppError(ErrorCodes.VALIDATION_ERROR, "Unsupported file type", 422);
}

export function mapRowsByHeader(
  header: string[],
  rows: string[][],
): Array<Record<string, string>> {
  const keys = header.map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  return rows.map((row) => {
    const record: Record<string, string> = {};
    keys.forEach((key, i) => {
      record[key] = row[i] ?? "";
    });
    return record;
  });
}
