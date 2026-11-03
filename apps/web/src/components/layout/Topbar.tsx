"use client";

import { useRouter } from "next/navigation";
import { HelpCircle, Menu, PanelLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserMenu } from "./UserMenu";
import { NotificationBell } from "./NotificationBell";
import { useUIStore } from "@/stores/uiStore";

/** CRM source: `D:\employee-management-system\src\components\layout\Topbar.tsx` */
export function Topbar() {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const setMobileSidebarOpen = useUIStore((s) => s.setMobileSidebarOpen);
  const router = useRouter();

  return (
    <header className="sticky top-0 z-30 flex h-16 min-w-0 items-center gap-3 border-b border-border bg-background/90 px-4 shadow-[0_1px_0_0_hsl(var(--border))] backdrop-blur md:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setMobileSidebarOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="hidden md:inline-flex"
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
      >
        <PanelLeft className="h-5 w-5" />
      </Button>

      <div className="hidden md:block flex-1 max-w-xl min-w-0">
        <Input
          placeholder="Search purchase orders…"
          leftIcon={<Search />}
          readOnly
          onClick={() => router.push("/search")}
          onFocus={() => router.push("/search")}
          rightIcon={
            <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              ⌘K
            </kbd>
          }
        />
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1">
        <Button variant="ghost" size="icon" aria-label="Help" className="relative">
          <HelpCircle className="h-5 w-5 text-muted-foreground" />
        </Button>
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  );
}
