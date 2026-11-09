import { describe, expect, it } from "vitest";
import {
  resolveDashboardRange,
  filterRecentActivityByRange,
} from "@/components/dashboard/DashboardFilterBar";

describe("dashboard filters", () => {
  it("resolveDashboardRange uses current month by default", () => {
    const range = resolveDashboardRange("current_month");
    expect(range.preset).toBe("current_month");
    expect(range.from <= range.to).toBe(true);
  });

  it("filterRecentActivityByRange keeps items inside range", () => {
    const range = resolveDashboardRange("custom", "2026-01-01", "2026-01-31");
    const items = [
      { id: "1", occurredAt: "2026-01-15T12:00:00.000Z" },
      { id: "2", occurredAt: "2025-12-01T12:00:00.000Z" },
    ];
    const filtered = filterRecentActivityByRange(items, range);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.id).toBe("1");
  });
});
