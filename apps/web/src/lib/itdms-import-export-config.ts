import type { ReportSlug } from "@/lib/api/reports";

export type ItdmsEntityKind = "employees" | "vendors" | "asset-categories" | "departments";

export type ImportColumn = {
  key: string;
  label: string;
  required?: boolean;
  example: string;
};

export type ExportColumn = {
  key: string;
  label: string;
};

export type ExportScope = "all" | "filtered" | "selected";

export type ExportFormat = "csv" | "xlsx" | "pdf";

export type EntityImportConfig = {
  entityLabel: string;
  /** POST multipart `/file` — Phase 7 API. */
  importApiPath: string | null;
  /** Server export: dedicated entity path or reports slug. */
  exportMode: "entity" | "report" | null;
  exportApiPath?: string;
  reportSlug?: ReportSlug;
  reportsHref: string;
  columns: ImportColumn[];
  sampleRow: Record<string, string>;
  exportColumns: ExportColumn[];
  /** React Query keys invalidated after a successful import. */
  invalidateQueryKeys: string[][];
};

const EMPLOYEE_COLUMNS: ImportColumn[] = [
  { key: "employeeNumber", label: "Employee number", required: true, example: "EMP-1001" },
  { key: "fullName", label: "Full name", required: true, example: "Jane Smith" },
  { key: "department", label: "Department", example: "IT" },
  { key: "designation", label: "Designation", example: "Systems Analyst" },
  { key: "contactNumber", label: "Contact number", example: "+92 300 1234567" },
  { key: "email", label: "Email", example: "jane.smith@example.com" },
];

const EMPLOYEE_SAMPLE: Record<string, string> = {
  employeeNumber: "EMP-1001",
  fullName: "Jane Smith",
  department: "IT",
  designation: "Systems Analyst",
  contactNumber: "+92 300 1234567",
  email: "jane.smith@example.com",
};

const EMPLOYEE_EXPORT: ExportColumn[] = [
  { key: "employeeNumber", label: "Employee number" },
  { key: "fullName", label: "Full name" },
  { key: "department", label: "Department" },
  { key: "designation", label: "Designation" },
  { key: "email", label: "Email" },
  { key: "isActive", label: "Active" },
];

const VENDOR_COLUMNS: ImportColumn[] = [
  { key: "vendorName", label: "Vendor name", required: true, example: "Northwind Supplies" },
  { key: "registrationNumber", label: "Registration number", example: "REG-445566" },
  { key: "contactPerson", label: "Contact person", example: "Alex Rivera" },
  { key: "phone", label: "Phone", example: "+92 42 1234567" },
  { key: "email", label: "Email", example: "sales@northwind.example" },
  { key: "address", label: "Address", example: "123 Industrial Ave" },
];

const VENDOR_SAMPLE: Record<string, string> = {
  vendorName: "Northwind Supplies",
  registrationNumber: "REG-445566",
  contactPerson: "Alex Rivera",
  phone: "+92 42 1234567",
  email: "sales@northwind.example",
  address: "123 Industrial Ave",
};

const VENDOR_EXPORT: ExportColumn[] = [
  { key: "vendorName", label: "Vendor" },
  { key: "registrationNumber", label: "Registration" },
  { key: "contactPerson", label: "Contact" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "isActive", label: "Active" },
];

const CATEGORY_COLUMNS: ImportColumn[] = [
  { key: "categoryName", label: "Category name", required: true, example: "Laptops" },
  { key: "description", label: "Description", example: "Portable computers" },
];

const CATEGORY_SAMPLE: Record<string, string> = {
  categoryName: "Laptops",
  description: "Portable computers",
};

const CATEGORY_EXPORT: ExportColumn[] = [
  { key: "categoryName", label: "Category" },
  { key: "description", label: "Description" },
];

const DEPARTMENT_COLUMNS: ImportColumn[] = [
  { key: "departmentName", label: "Department name", required: true, example: "Information Technology" },
  { key: "departmentCode", label: "Department code", example: "it" },
  { key: "description", label: "Description", example: "IT operations and support" },
];

const DEPARTMENT_SAMPLE: Record<string, string> = {
  departmentName: "Information Technology",
  departmentCode: "it",
  description: "IT operations and support",
};

const DEPARTMENT_EXPORT: ExportColumn[] = [
  { key: "departmentCode", label: "Code" },
  { key: "departmentName", label: "Department" },
  { key: "description", label: "Description" },
  { key: "isActive", label: "Active" },
  { key: "employeeCount", label: "Employees" },
];

export const ENTITY_CONFIG: Record<ItdmsEntityKind, EntityImportConfig> = {
  employees: {
    entityLabel: "Employees",
    importApiPath: "/employees/import",
    exportMode: "report",
    reportSlug: "employees",
    reportsHref: "/reports",
    columns: EMPLOYEE_COLUMNS,
    sampleRow: EMPLOYEE_SAMPLE,
    exportColumns: EMPLOYEE_EXPORT,
    invalidateQueryKeys: [["employees"]],
  },
  vendors: {
    entityLabel: "Vendors",
    importApiPath: "/vendors/import",
    exportMode: "entity",
    exportApiPath: "/vendors/export",
    reportsHref: "/reports",
    columns: VENDOR_COLUMNS,
    sampleRow: VENDOR_SAMPLE,
    exportColumns: VENDOR_EXPORT,
    invalidateQueryKeys: [["vendors"]],
  },
  "asset-categories": {
    entityLabel: "Asset categories",
    importApiPath: "/asset-categories/import",
    exportMode: null,
    reportsHref: "/reports",
    columns: CATEGORY_COLUMNS,
    sampleRow: CATEGORY_SAMPLE,
    exportColumns: CATEGORY_EXPORT,
    invalidateQueryKeys: [["asset-categories"]],
  },
  departments: {
    entityLabel: "Departments",
    importApiPath: "/departments/import",
    exportMode: "entity",
    exportApiPath: "/departments/export",
    reportsHref: "/reports",
    columns: DEPARTMENT_COLUMNS,
    sampleRow: DEPARTMENT_SAMPLE,
    exportColumns: DEPARTMENT_EXPORT,
    invalidateQueryKeys: [["departments"]],
  },
};

export const ALLOWED_IMPORT_EXTENSIONS = [".csv", ".xlsx", ".xls"] as const;

export function exportFilename(entity: ItdmsEntityKind, format: ExportFormat): string {
  const date = new Date().toISOString().slice(0, 10);
  const ext = format === "xlsx" ? "xlsx" : format === "pdf" ? "pdf" : "csv";
  return `itdms-${entity}-${date}.${ext}`;
}

export function sampleCsvForEntity(entity: ItdmsEntityKind): string {
  const config = ENTITY_CONFIG[entity];
  const headers = config.columns.map((c) => c.key);
  const row = config.sampleRow;
  return [headers.join(","), headers.map((h) => row[h] ?? "").join(",")].join("\r\n");
}

export function downloadTextFile(content: string, fileName: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
