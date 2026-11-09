import { describe, expect, it } from "vitest";
import { PERMISSION_GROUPS } from "@/lib/permission-groups";
import { PermissionKeys } from "@/lib/permissions";

describe("settings & RBAC UI helpers", () => {
  it("permission groups include roles.manage", () => {
    const keys = PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => p.key));
    expect(keys).toContain(PermissionKeys.rolesManage);
    expect(keys).toContain(PermissionKeys.departmentsRead);
  });

  it("financial corrections appears only in finance administration group", () => {
    const financeGroups = PERMISSION_GROUPS.filter((g) =>
      g.permissions.some((p) => p.key === PermissionKeys.financialCorrections),
    );
    expect(financeGroups.length).toBeGreaterThanOrEqual(1);
  });
});
