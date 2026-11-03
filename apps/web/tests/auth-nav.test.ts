import { describe, expect, it } from "vitest";
import { ApiClientError } from "../src/lib/api/client";

describe("ApiClientError", () => {
  it("carries status and code", () => {
    const err = new ApiClientError("Invalid credentials", 401, "UNAUTHORIZED");
    expect(err.status).toBe(401);
    expect(err.code).toBe("UNAUTHORIZED");
    expect(err.message).toBe("Invalid credentials");
  });
});

describe("filterNavByPermissions", () => {
  it("hides items without permission", async () => {
    const { filterNavByPermissions, ITDMS_NAV } = await import("../src/config/itdms-navigation");
    const { PermissionKeys } = await import("../src/lib/permissions");
    const filtered = filterNavByPermissions(ITDMS_NAV, [PermissionKeys.employeesRead]);
    const labels = filtered.flatMap((s) => s.items.map((i) => i.href));
    expect(labels).toContain("/employees");
    expect(labels).not.toContain("/vendors");
    expect(labels).toContain("/dashboard");
  });
});

describe("findNavItemForPath", () => {
  it("resolves the most specific nav item for a path", async () => {
    const { findNavItemForPath } = await import("../src/config/itdms-navigation");
    const { PermissionKeys } = await import("../src/lib/permissions");
    expect(findNavItemForPath("/admin")?.permission).toBe(PermissionKeys.usersManage);
    expect(findNavItemForPath("/employees")?.permission).toBe(PermissionKeys.employeesRead);
    expect(findNavItemForPath("/dashboard")?.permission).toBeUndefined();
  });
});

describe("getWritePermissionForPath", () => {
  it("requires write/manage permission for create routes", async () => {
    const { getWritePermissionForPath } = await import("../src/config/route-write-permissions");
    const { PermissionKeys } = await import("../src/lib/permissions");
    expect(getWritePermissionForPath("/employees/new")).toBe(PermissionKeys.employeesWrite);
    expect(getWritePermissionForPath("/employees")).toBeUndefined();
    expect(getWritePermissionForPath("/vendors/new")).toBe(PermissionKeys.vendorsManage);
  });
});
