"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { useUIStore } from "@/stores/uiStore";
import { ITDMS_NAV, filterNavByPermissions } from "@/config/itdms-navigation";
import { useNavPermissions } from "@/components/providers/AuthProvider";
import { Wordmark } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** CRM source: `D:\employee-management-system\src\components\layout\MobileSidebar.tsx` (UpgradeCard removed). */
export function MobileSidebar() {
  const open = useUIStore((s) => s.mobileSidebarOpen);
  const setOpen = useUIStore((s) => s.setMobileSidebarOpen);
  const pathname = usePathname();
  const permissions = useNavPermissions();
  const nav = useMemo(() => filterNavByPermissions(ITDMS_NAV, permissions), [permissions]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <motion.aside
            className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col gap-4 bg-sidebar text-sidebar-foreground shadow-xl md:hidden"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.22, ease: "easeOut" }}
          >
            <div className="flex items-center justify-between px-5 py-4 h-[64px]">
              <Wordmark />
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex-1 overflow-y-auto scrollbar-thin px-3">
              {nav.map((section, idx) => (
                <ul
                  key={idx}
                  className={cn("flex flex-col gap-0.5", idx > 0 && "mt-4 pt-4 border-t border-border")}
                >
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const active =
                      pathname === item.href ||
                      (item.href !== "/" && pathname.startsWith(item.href));
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                            active
                              ? "bg-brand-gradient text-primary-foreground shadow-pop"
                              : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          )}
                        >
                          <Icon className="h-[18px] w-[18px] shrink-0" />
                          <span className="flex-1 truncate">{item.label}</span>
                          {item.badge ? (
                            <Badge variant={active ? "outline" : "destructive"} className="h-5 min-w-5 px-1.5">
                              {item.badge}
                            </Badge>
                          ) : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ))}
            </nav>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
