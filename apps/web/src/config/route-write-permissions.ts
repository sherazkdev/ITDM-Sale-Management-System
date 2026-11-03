import { PermissionKeys, type PermissionKey } from "@/lib/permissions";

/**
 * Stricter permission than list nav for create/edit routes (uses existing API permission keys).
 */
const WRITE_PATH_RULES: { test: (pathname: string) => boolean; permission: PermissionKey }[] = [
  { test: (p) => p === "/employees/new", permission: PermissionKeys.employeesWrite },
  { test: (p) => p === "/vendors/new", permission: PermissionKeys.vendorsManage },
  { test: (p) => p === "/assets/new", permission: PermissionKeys.assetsManage },
  { test: (p) => p === "/contracts/new", permission: PermissionKeys.contractsManage },
  { test: (p) => p === "/purchase-orders/new", permission: PermissionKeys.purchaseOrdersManage },
  { test: (p) => p === "/invoices/new", permission: PermissionKeys.invoicesManage },
  { test: (p) => p === "/maintenance/new", permission: PermissionKeys.maintenanceManage },
  { test: (p) => p === "/software-licenses/new", permission: PermissionKeys.licensesManage },
  { test: (p) => p === "/asset-issuance", permission: PermissionKeys.assetsIssue },
  { test: (p) => p.startsWith("/asset-issuance/"), permission: PermissionKeys.assetsIssue },
];

export function getWritePermissionForPath(pathname: string): PermissionKey | undefined {
  const normalized = pathname.split("?")[0]?.replace(/\/$/, "") || pathname;
  for (const rule of WRITE_PATH_RULES) {
    if (rule.test(normalized)) {
      return rule.permission;
    }
  }
  return undefined;
}
