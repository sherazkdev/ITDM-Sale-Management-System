export type BulkImportError = { row: number; message: string };

export type BulkImportResult = {
  imported: number;
  skipped: number;
  errors: BulkImportError[];
};
