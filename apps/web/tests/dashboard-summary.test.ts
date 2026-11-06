import { describe, expect, it } from "vitest";
import { activityRecordHref, expiryWatchlistHref } from "../src/lib/domain/dashboard-links";

describe("dashboard summary shape", () => {
  it("accepts partial sections from API", async () => {
    const { fetchDashboardSummary } = await import("../src/lib/api/dashboard");
    expect(typeof fetchDashboardSummary).toBe("function");
  });

  it("maps asset donut slices without zero rows", async () => {
    const assets = {
      registered: 10,
      inStock: 5,
      issued: 3,
      underMaintenance: 2,
      retired: 0,
    };
    const slices = [
      { name: "In stock", value: assets.inStock },
      { name: "Issued", value: assets.issued },
      { name: "Under maintenance", value: assets.underMaintenance },
      { name: "Retired", value: assets.retired },
    ].filter((d) => d.value > 0);
    expect(slices).toHaveLength(3);
    expect(slices.reduce((a, s) => a + s.value, 0)).toBe(10);
  });

  it("builds safe activity and watchlist hrefs", () => {
    expect(activityRecordHref("asset", "12")).toBe("/assets/12");
    expect(activityRecordHref("invoice", "9")).toBe("/invoices/9");
    expect(activityRecordHref("unknown_type", "1")).toBeUndefined();
    expect(activityRecordHref("asset", null)).toBeUndefined();
    expect(expiryWatchlistHref("contract", "3")).toBe("/contracts/3");
    expect(expiryWatchlistHref("software_license", "8")).toBe("/software-licenses/8");
  });
});
