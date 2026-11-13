import { PermissionKeys } from "./permissions.js";
import type { AuthPrincipal } from "./principal.js";

const FINANCE_READ = [
  PermissionKeys.invoicesRead,
  PermissionKeys.budgetsRead,
  PermissionKeys.assetsFinancialsRead,
] as const;

const FINANCE_WRITE = [PermissionKeys.invoicesManage, PermissionKeys.budgetsManage] as const;

export function hasFinanceRead(permissions: Set<string>): boolean {
  return FINANCE_READ.some((k) => permissions.has(k));
}

export function hasFinanceWrite(permissions: Set<string>): boolean {
  return FINANCE_WRITE.some((k) => permissions.has(k));
}

export function canViewInvoiceFinancials(permissions: Set<string>): boolean {
  return permissions.has(PermissionKeys.invoicesRead);
}

export function canViewBudgetFinancials(permissions: Set<string>): boolean {
  return permissions.has(PermissionKeys.budgetsRead);
}

export function canViewAssetPurchaseCosts(permissions: Set<string>): boolean {
  return permissions.has(PermissionKeys.assetsFinancialsRead);
}

export function isSuperAdminPrincipal(principal: AuthPrincipal): boolean {
  return principal.permissions.has(PermissionKeys.financialCorrections);
}
