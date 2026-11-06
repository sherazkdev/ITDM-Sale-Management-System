/** Safe deep-links from dashboard activity / watchlist — only known modules. */

export function activityRecordHref(
  targetType: string,
  targetId: string | null | undefined,
): string | undefined {
  if (!targetId) return undefined;
  switch (targetType) {
    case "employee":
      return `/employees/${targetId}`;
    case "asset":
      return `/assets/${targetId}`;
    case "non_asset_stock_item":
      return `/assets/non-asset/${targetId}`;
    case "purchase_order":
      return `/purchase-orders/${targetId}`;
    case "invoice":
      return `/invoices/${targetId}`;
    case "contract":
      return `/contracts/${targetId}`;
    case "software_license":
      return `/software-licenses/${targetId}`;
    case "maintenance_record":
      return `/maintenance/${targetId}`;
    case "vendor":
      return `/vendors/${targetId}`;
    case "asset_movement_document":
      return `/asset-history?documentId=${encodeURIComponent(targetId)}`;
    default:
      return undefined;
  }
}

export function expiryWatchlistHref(kind: "contract" | "software_license", id: string): string {
  return kind === "contract" ? `/contracts/${id}` : `/software-licenses/${id}`;
}

/** YYYY-MM-DD that is `days` ahead of today (UTC date). */
export function utcDatePlusDays(days: number): string {
  const d = new Date();
  const utc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  utc.setUTCDate(utc.getUTCDate() + days);
  return utc.toISOString().slice(0, 10);
}
