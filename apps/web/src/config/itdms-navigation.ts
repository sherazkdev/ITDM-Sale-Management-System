import {
  LayoutDashboard,
  Users,
  Package,
  FolderTree,
  History,
  ArrowLeftRight,
  Building2,
  FileText,
  Handshake,
  Receipt,
  PiggyBank,
  Wrench,
  KeyRound,
  Search,
  Files,
  BarChart3,
  Bell,
  Shield,
  ScrollText,
  type LucideIcon,
} from "lucide-react";
import { PermissionKeys, type PermissionKey } from "@/lib/permissions";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number | string;
  /** When set, item is shown only if the user has this permission (UI02+). */
  permission?: PermissionKey;
};

export type NavSection = {
  title?: string;
  items: NavItem[];
};

/**
 * ITDMS primary navigation — CRM sidebar layout preserved; routes map to future modules.
 * Source pattern: `D:\employee-management-system\src\config\navigation.ts`
 */
export const ITDMS_NAV: NavSection[] = [
  {
    items: [
      {
        label: "Overview",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "People & assets",
    items: [
      {
        label: "Employees",
        href: "/employees",
        icon: Users,
        permission: PermissionKeys.employeesRead,
      },
      {
        label: "Assets",
        href: "/assets",
        icon: Package,
        permission: PermissionKeys.assetsRead,
      },
      {
        label: "Asset categories",
        href: "/asset-categories",
        icon: FolderTree,
        permission: PermissionKeys.assetsRead,
      },
      {
        label: "Asset history",
        href: "/asset-history",
        icon: History,
        permission: PermissionKeys.assetsRead,
      },
      {
        label: "Issuance & returns",
        href: "/asset-issuance",
        icon: ArrowLeftRight,
        permission: PermissionKeys.assetsIssue,
      },
    ],
  },
  {
    title: "Procurement",
    items: [
      {
        label: "Vendors",
        href: "/vendors",
        icon: Building2,
        permission: PermissionKeys.vendorsRead,
      },
      {
        label: "Purchase orders",
        href: "/purchase-orders",
        icon: FileText,
        permission: PermissionKeys.purchaseOrdersRead,
      },
      {
        label: "Contracts",
        href: "/contracts",
        icon: Handshake,
        permission: PermissionKeys.contractsRead,
      },
    ],
  },
  {
    title: "Finance",
    items: [
      {
        label: "Invoices & payments",
        href: "/invoices",
        icon: Receipt,
        permission: PermissionKeys.invoicesRead,
      },
      {
        label: "Annual budgets",
        href: "/budgets",
        icon: PiggyBank,
        permission: PermissionKeys.budgetsRead,
      },
    ],
  },
  {
    title: "Operations",
    items: [
      {
        label: "Maintenance",
        href: "/maintenance",
        icon: Wrench,
        permission: PermissionKeys.maintenanceRead,
      },
      {
        label: "Software licenses",
        href: "/software-licenses",
        icon: KeyRound,
        permission: PermissionKeys.licensesRead,
      },
      {
        label: "PO search",
        href: "/search",
        icon: Search,
        permission: PermissionKeys.searchRead,
      },
      {
        label: "Documents",
        href: "/documents",
        icon: Files,
        permission: PermissionKeys.documentsRead,
      },
      {
        label: "Reports",
        href: "/reports",
        icon: BarChart3,
        permission: PermissionKeys.reportsRead,
      },
      {
        label: "Notifications",
        href: "/notifications",
        icon: Bell,
        permission: PermissionKeys.notificationsRead,
      },
    ],
  },
  {
    title: "Administration",
    items: [
      {
        label: "Administration",
        href: "/admin",
        icon: Shield,
        permission: PermissionKeys.usersManage,
      },
      {
        label: "Audit log",
        href: "/admin/audit",
        icon: ScrollText,
        permission: PermissionKeys.auditRead,
      },
    ],
  },
];

export function filterNavByPermissions(
  sections: NavSection[],
  permissions: readonly string[],
): NavSection[] {
  const set = new Set(permissions);
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.permission || set.has(item.permission)),
    }))
    .filter((section) => section.items.length > 0);
}

export function flattenNavItems(): NavItem[] {
  return ITDMS_NAV.flatMap((section) => section.items);
}

/** Longest-prefix match for route → nav item (permission gate). */
export function findNavItemForPath(pathname: string): NavItem | undefined {
  const items = flattenNavItems();
  return items
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];
}

export function hasPermission(permissions: readonly string[], key: PermissionKey): boolean {
  return permissions.includes(key);
}
