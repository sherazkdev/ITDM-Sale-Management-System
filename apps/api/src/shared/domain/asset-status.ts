/** PROPOSED lifecycle states (D11 not client-approved). Issuance/return transitions enforced in P09 service. */
export const AssetStatus = {
  inStock: "IN_STOCK",
  issued: "ISSUED",
  underMaintenance: "UNDER_MAINTENANCE",
  retired: "RETIRED",
} as const;

export type AssetStatusValue = (typeof AssetStatus)[keyof typeof AssetStatus];

export function normalizeAssetCode(raw: string): string {
  return raw.trim().toUpperCase();
}

export function canRetireFromStatus(status: string): boolean {
  return status === AssetStatus.inStock;
}

export function assertIssueEligible(status: string): void {
  if (status !== AssetStatus.inStock) {
    throw new Error(`Asset not issue-eligible: ${status}`);
  }
}

export function assertReturnEligible(status: string): void {
  if (status !== AssetStatus.issued) {
    throw new Error(`Asset not return-eligible: ${status}`);
  }
}
