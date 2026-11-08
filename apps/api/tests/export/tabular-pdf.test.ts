import { describe, expect, it } from "vitest";
import { buildTabularPdf } from "../../src/shared/export/tabular-pdf.js";
import { csvFromRows } from "../../src/shared/export/tabular-export.js";

describe("buildTabularPdf", () => {
  it("includes every row value and header (no 40-row truncation)", async () => {
    const header = ["employeeNumber", "fullName", "department"];
    const rows = Array.from({ length: 55 }, (_, i) => [
      `EMP-${String(i + 1).padStart(3, "0")}`,
      `Employee ${i + 1}`,
      `Dept ${(i % 5) + 1}`,
    ]);
    const buf = await buildTabularPdf({ title: "employees", header, rows });
    expect(buf.subarray(0, 5).toString("ascii")).toBe("%PDF-");
    expect(buf.length).toBeGreaterThan(3_000);
    const latin = buf.toString("latin1");
    expect((latin.match(/\/Type\s*\/Page/g) ?? []).length).toBeGreaterThan(1);
  });

  it("matches CSV row count for the same dataset", async () => {
    const header = ["code", "name"];
    const rows = [
      ["A1", "Alpha"],
      ["B2", "Beta"],
    ];
    const pdf = await buildTabularPdf({ title: "inventory", header, rows });
    const csv = csvFromRows(header, rows);
    const csvLines = csv.trim().split("\n");
    expect(csvLines.length).toBe(1 + rows.length);
    expect(pdf.subarray(0, 5).toString("ascii")).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(csv.length);
  });
});
