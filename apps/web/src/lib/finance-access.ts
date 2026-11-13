import { PermissionKeys } from "@/lib/permissions";

export function canViewInvoiceFinancials(hasPermission: (k: string) => boolean): boolean {
  return hasPermission(PermissionKeys.invoicesRead);
}

export function canViewBudgetFinancials(hasPermission: (k: string) => boolean): boolean {
  return hasPermission(PermissionKeys.budgetsRead);
}
