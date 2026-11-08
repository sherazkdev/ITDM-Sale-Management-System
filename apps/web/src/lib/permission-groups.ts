import { PermissionKeys, type PermissionKey } from "@/lib/permissions";

export type PermissionMatrixEntry = {
  key: PermissionKey;
  label: string;
  description: string;
  /** When false, omitted from role create/edit toggles (still shown in read-only matrix). */
  selectable?: boolean;
};

export type PermissionGroup = {
  label: string;
  permissions: PermissionMatrixEntry[];
};

function entry(
  key: keyof typeof PermissionKeys,
  label: string,
  description: string,
  options?: { selectable?: boolean },
): PermissionMatrixEntry {
  return {
    key: PermissionKeys[key],
    label,
    description,
    selectable: options?.selectable,
  };
}

/** Grouped permission catalog for role matrix UI — mirrors all `PermissionKeys`. */
export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    label: "People",
    permissions: [
      entry("employeesRead", "View employees", "List and open employee directory records."),
      entry("employeesWrite", "Manage employees", "Create, edit, and deactivate employees."),
      entry("departmentsRead", "View departments", "Browse the department catalog."),
      entry("departmentsManage", "Manage departments", "Create, edit, and import departments."),
    ],
  },
  {
    label: "Access & administration",
    permissions: [
      entry("rolesManage", "Manage roles", "Create custom roles and edit permission assignments."),
      entry("usersManage", "User administration", "Provision users and assign roles."),
      entry("auditRead", "View audit log", "Read security and change audit entries."),
    ],
  },
  {
    label: "Vendors",
    permissions: [
      entry("vendorsRead", "View vendors", "List vendor records."),
      entry("vendorsManage", "Manage vendors", "Create and maintain vendor records."),
    ],
  },
  {
    label: "Assets",
    permissions: [
      entry("assetsRead", "View assets", "Browse the asset register."),
      entry("assetsManage", "Manage assets", "Create and edit asset records."),
      entry("assetsFinancialsRead", "View asset financials", "See cost and depreciation fields on assets."),
      entry("assetsIssue", "Issue assets", "Assign assets to employees."),
      entry("assetsReturn", "Return assets", "Process asset returns and custody changes."),
    ],
  },
  {
    label: "Contracts & procurement",
    permissions: [
      entry("contractsRead", "View contracts", "List contracts and agreements."),
      entry("contractsManage", "Manage contracts", "Create and update contracts."),
      entry("purchaseOrdersRead", "View purchase orders", "List purchase orders."),
      entry("purchaseOrdersManage", "Manage purchase orders", "Create and maintain purchase orders."),
    ],
  },
  {
    label: "Finance",
    permissions: [
      entry("invoicesRead", "View invoices", "List invoices and payment status."),
      entry("invoicesManage", "Manage invoices", "Create and update invoices."),
      entry("budgetsRead", "View budgets", "Browse budget plans and utilization."),
      entry("budgetsManage", "Manage budgets", "Create and adjust budgets."),
      entry(
        "financialCorrections",
        "Financial corrections (admin-only)",
        "Reserved for the protected Admin role — post-payment ledger corrections. Not assignable via custom roles.",
        { selectable: false },
      ),
    ],
  },
  {
    label: "Maintenance & licenses",
    permissions: [
      entry("maintenanceRead", "View maintenance", "List maintenance records."),
      entry("maintenanceManage", "Manage maintenance", "Create and update maintenance work."),
      entry("licensesRead", "View licenses", "Browse software license inventory."),
      entry("licensesManage", "Manage licenses", "Create and update license records."),
    ],
  },
  {
    label: "Documents & search",
    permissions: [
      entry("documentsRead", "View documents", "Access attached documents."),
      entry("documentsManage", "Manage documents", "Upload and manage document metadata."),
      entry("searchRead", "Global search", "Use cross-module search."),
    ],
  },
  {
    label: "Reporting & operations",
    permissions: [
      entry("notificationsRead", "Notifications", "View in-app notifications."),
      entry("reportsRead", "Reports & exports", "Run reports and download exports."),
      entry("jobsRun", "Run background jobs", "Trigger approved maintenance or batch jobs."),
    ],
  },
];

export const ALL_MATRIX_PERMISSION_KEYS: PermissionKey[] = PERMISSION_GROUPS.flatMap((g) =>
  g.permissions.map((p) => p.key),
);

export const SELECTABLE_PERMISSION_GROUPS: PermissionGroup[] = PERMISSION_GROUPS.map((group) => ({
  label: group.label,
  permissions: group.permissions.filter((p) => p.selectable !== false),
}));

export function permissionLabel(key: PermissionKey): string {
  for (const group of PERMISSION_GROUPS) {
    const hit = group.permissions.find((p) => p.key === key);
    if (hit) return hit.label;
  }
  return key;
}
