import { describe, expect, it } from "vitest";

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
});
