/** Reusable helper copy for enterprise forms (Prompt #19). */
export const FORM_HINTS = {
  employeeNumber: "Enter the unique employee ID used by your organization.",
  employeeDepartment: "Select the department responsible for this employee.",
  employeeEmail: "Work email used for notifications and directory search.",
  departmentCode: "Short code shown in reports and filters (e.g. IT-OPS).",
  vendorName: "Registered supplier or partner organization name.",
  assetCode: "Unique asset tag used for issuance and audit.",
  assetSerial: "Manufacturer serial number when available.",
  poNumber: "Official purchase order reference from procurement.",
  contractNumber: "Agreement reference stored with the vendor contract.",
  invoiceNumber: "Supplier invoice reference linked to the purchase order.",
  invoiceAmount: "Invoiced amount in the original transaction currency.",
  financialYear: "Financial year that owns budget allocations and ledger entries.",
  budgetCategory: "Budget line category (e.g. IT Hardware) within the selected year.",
  licenseQuantity: "Number of seats or entitlements covered by this license.",
} as const;
