import { describe, expect, it } from "vitest";

import { countDashboardActiveFilters, resolveDashboardRange } from "@/components/dashboard/DashboardFilterBar";
import { SELECTABLE_PERMISSION_GROUPS } from "@/lib/permission-groups";
import { PermissionKeys } from "@/lib/permissions";

describe("prompt14 dashboard filter helpers", () => {
  it("countDashboardActiveFilters counts scoped URL params", () => {
    const range = resolveDashboardRange("current_month");
    const sp = new URLSearchParams("departmentId=abc&poStatus=DRAFT");
    expect(countDashboardActiveFilters(sp, range)).toBe(2);
  });

  it("countDashboardActiveFilters includes non-default date preset", () => {
    const range = resolveDashboardRange("last_30");
    expect(countDashboardActiveFilters(new URLSearchParams(), range)).toBe(1);
  });
});

describe("prompt14 permission matrix safety", () => {
  it("financial.corrections is not selectable in role form groups", () => {
    const selectable = SELECTABLE_PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => p.key));
    expect(selectable).not.toContain(PermissionKeys.financialCorrections);
  });

  it("selectable groups still expose employee permissions", () => {
    const selectable = SELECTABLE_PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => p.key));
    expect(selectable).toContain(PermissionKeys.employeesWrite);
  });
});
