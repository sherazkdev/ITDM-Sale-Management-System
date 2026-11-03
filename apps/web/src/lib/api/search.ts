import { apiGet } from "./client";

export type PoSearchResult = {
  purchaseOrder: {
    purchaseOrderId: string;
    poNumber: string;
    poDate: string;
    currency: string;
    status: string;
    validUntil: string | null;
    vendorId: string;
    contractId: string | null;
    vendor?: { vendorId: string; vendorName: string };
    contract?: {
      contractId: string;
      contractNumber: string;
      expiryDate: string | null;
      status: string;
    } | null;
    lines: Array<{
      purchaseOrderLineId: string;
      lineNumber: number;
      description: string;
      quantity: string;
      unitPrice: string;
      lineTotal: string;
    }>;
    invoices: Array<{
      invoiceId: string;
      invoiceNumber: string;
      invoiceAmount: string;
      paymentStatus: string;
    }>;
    assets: Array<{
      assetId: string;
      assetCode: string;
      assetName: string;
      status: string;
      purchasePrice: string | null;
    }>;
  };
  expiryDates: {
    contractExpiry: string | null;
    poValidUntil: string | null;
    note: string;
  };
  supportingDocuments: {
    purchaseOrder: StoredDocumentSummary[];
    contract: StoredDocumentSummary[];
  };
  invoiceFinancials: Array<{
    invoiceId: string;
    invoiceNumber: string;
    invoiceAmount: string;
    paymentStatus: string;
    paidTotal: string;
    outstanding: string;
    paymentCount: number;
  }>;
  movements: Array<{
    assetTransactionId: string;
    transactionType: string;
    transactionDate: string;
    asset?: { assetCode: string; assetName: string };
    employee?: { employeeCode: string; fullName: string } | null;
  }>;
  maintenance: Array<{
    maintenanceRecordId: string;
    maintenanceType: string;
    status: string;
    scheduledDate: string | null;
    completedDate: string | null;
  }>;
  softwareLicenses: Array<{
    licenseId: string;
    productName: string;
    expiryDate: string | null;
    status: string;
  }>;
  budget: {
    allocations: Array<{
      budgetId: string;
      budgetCategory: string;
      yearName: string;
      currency: string;
      allocatedAmount: string;
      ledgerByType: Record<string, string>;
      ledgerTotal: string;
      remainingProvisional: string;
    }>;
    semanticsNote: string;
  };
  truncation: {
    movementsCap: number;
    maintenanceCap: number;
    licensesCap: number;
  };
};

export type StoredDocumentSummary = {
  storedDocumentId: string;
  originalFileName: string;
  mimeType: string;
  sizeBytes: string;
  sha256: string;
  createdAt: string;
};

export async function searchPurchaseOrder(poNumber: string): Promise<PoSearchResult> {
  const trimmed = poNumber.trim();
  if (!trimmed) {
    throw new Error("Enter a purchase order number");
  }
  return apiGet<PoSearchResult>(`/search/purchase-orders/${encodeURIComponent(trimmed)}`);
}
