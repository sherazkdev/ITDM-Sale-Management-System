"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Lock,
  Palette,
  ScrollText,
  Settings as SettingsIcon,
  ShieldCheck,
  SlidersHorizontal,
  User,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/common/PageHeader";
import { useAuth } from "@/components/providers/AuthProvider";
import { PermissionKeys } from "@/lib/permissions";

type SettingsNavItem = {
  label: string;
  href: string;
  icon: typeof User;
  group: "Account" | "Administration";
  permission?: (typeof PermissionKeys)[keyof typeof PermissionKeys];
};

const NAV: SettingsNavItem[] = [
  { label: "Profile", href: "/settings/profile", icon: User, group: "Account" },
  { label: "Security", href: "/settings/security", icon: Lock, group: "Account" },
  { label: "Theme", href: "/settings/theme", icon: Palette, group: "Account" },
  { label: "Preferences", href: "/settings/preferences", icon: SlidersHorizontal, group: "Account" },
  {
    label: "Users",
    href: "/admin",
    icon: Users,
    group: "Administration",
    permission: PermissionKeys.usersManage,
  },
  {
    label: "Roles",
    href: "/settings/roles",
    icon: ShieldCheck,
    group: "Administration",
    permission: PermissionKeys.rolesManage,
  },
  {
    label: "Departments",
    href: "/departments",
    icon: Building2,
    group: "Administration",
    permission: PermissionKeys.departmentsRead,
  },
  {
    label: "Audit",
    href: "/admin/audit",
    icon: ScrollText,
    group: "Administration",
    permission: PermissionKeys.auditRead,
  },
];

const GROUP_ORDER = ["Account", "Administration"] as const;

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { hasPermission } = useAuth();

  const visible = NAV.filter((item) => !item.permission || hasPermission(item.permission));
  const grouped = GROUP_ORDER.map((g) => ({
    group: g,
    items: visible.filter((n) => n.group === g),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Settings"
        description="Account profile, security, and appearance for ITDMS."
        breadcrumbs={[{ label: "Settings" }]}
        actions={<SettingsIcon className="hidden sm:block h-6 w-6 text-muted-foreground" />}
      />
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
        <aside className="lg:sticky lg:top-[88px] self-start">
          <nav className="rounded-xl border border-border bg-card shadow-card p-2">
            {grouped.map((g, idx) => (
              <div key={g.group} className={cn(idx > 0 && "mt-2 pt-2 border-t border-border")}>
                <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {g.group}
                </p>
                <ul className="flex flex-col gap-0.5">
                  {g.items.map((item) => {
                    const Icon = item.icon;
                    const active =
                      pathname === item.href ||
                      (item.href !== "/settings" && pathname.startsWith(item.href));
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors",
                            active
                              ? "bg-accent text-primary font-medium"
                              : "text-foreground hover:bg-muted",
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="flex-1 truncate">{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
