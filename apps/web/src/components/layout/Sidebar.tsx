"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { useUIStore } from "@/stores/uiStore";
import { ITDMS_NAV, filterNavByPermissions } from "@/config/itdms-navigation";
import { useNavPermissions } from "@/components/providers/AuthProvider";
import { Wordmark, OrlenBrandLogo } from "@/components/brand/Logo";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** CRM source: `D:\employee-management-system\src\components\layout\Sidebar.tsx` (UpgradeCard removed). */
export function Sidebar() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const pathname = usePathname();
  const permissions = useNavPermissions();
  const nav = useMemo(() => filterNavByPermissions(ITDMS_NAV, permissions), [permissions]);

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col gap-4 sticky top-0 h-screen border-r border-border bg-sidebar text-sidebar-foreground shadow-[1px_0_0_0_hsl(var(--border))] transition-[width] duration-200 ease-out",
        collapsed ? "w-[72px]" : "w-[240px]",
      )}
    >
      <div className="flex items-center px-5 py-4 h-[64px] flex-shrink-0">
        {collapsed ? <OrlenBrandLogo collapsed /> : <Wordmark />}
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 pb-3">
        {nav.map((section, idx) => (
          <div key={idx} className={cn(idx > 0 && "mt-4 pt-4 border-t border-border")}>
            {section.title && !collapsed ? (
              <p className="px-3 mb-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                {section.title}
              </p>
            ) : null}
            <ul className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-brand-gradient text-primary-foreground shadow-pop"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        collapsed && "justify-center px-0",
                      )}
                    >
                      <Icon className="h-[18px] w-[18px] shrink-0" />
                      {!collapsed ? (
                        <>
                          <span className="flex-1 truncate">{item.label}</span>
                          {item.badge ? (
                            <Badge
                              variant={active ? "outline" : "destructive"}
                              className={cn(
                                "h-5 min-w-5 px-1.5 justify-center",
                                active && "border-white/30 bg-white/15 text-white",
                              )}
                            >
                              {item.badge}
                            </Badge>
                          ) : null}
                        </>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
