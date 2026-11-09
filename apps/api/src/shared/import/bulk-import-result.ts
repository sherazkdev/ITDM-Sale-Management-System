export type BulkImportError = { row: number; message: string };

export type BulkImportResult = {
  imported: number;
  skipped: number;
  errors: BulkImportError[];
};

export type BulkImportPreviewRow = {
  row: number;
  status: "valid" | "duplicate" | "invalid";
  values: Record<string, string>;
  message?: string;
};

export type BulkImportPreviewResult = {
  totalRows: number;
  validCount: number;
  duplicateCount: number;
  invalidCount: number;
  rows: BulkImportPreviewRow[];
};
