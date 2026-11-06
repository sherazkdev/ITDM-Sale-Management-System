"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HelpCircle, Menu, PanelLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserMenu } from "./UserMenu";
import { NotificationBell } from "./NotificationBell";
import { useUIStore } from "@/stores/uiStore";

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  // Read-only PO search chrome is a navigation control, not a form field.
  if (target.closest('[aria-label="Open PO search"]')) return false;
  const tag = target.tagName;
  if (tag === "TEXTAREA" || tag === "SELECT") return true;
  if (tag === "INPUT") {
    const input = target as HTMLInputElement;
    return !input.readOnly && !input.disabled;
  }
  if (target.isContentEditable) return true;
  return Boolean(target.closest("[contenteditable='true']"));
}

/** CRM source: `D:\employee-management-system\src\components\layout\Topbar.tsx` */
export function Topbar() {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const setMobileSidebarOpen = useUIStore((s) => s.setMobileSidebarOpen);
  const router = useRouter();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.key === "k" || event.key === "K")) return;
      if (!(event.metaKey || event.ctrlKey)) return;
      // Keep typing uninterrupted in form fields; still allow from non-editable chrome.
      if (isEditableTarget(event.target)) return;
      event.preventDefault();
      router.push("/search");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

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
          placeholder="Search purchase order number…"
          leftIcon={<Search />}
          readOnly
          role="button"
          aria-label="Open PO search"
          onClick={() => router.push("/search")}
          onFocus={() => router.push("/search")}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              router.push("/search");
            }
          }}
          rightIcon={
            <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              ⌘K
            </kbd>
          }
        />
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open PO search"
          onClick={() => router.push("/search")}
        >
          <Search className="h-5 w-5 text-muted-foreground" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Help" asChild>
          <Link href="/help">
            <HelpCircle className="h-5 w-5 text-muted-foreground" />
          </Link>
        </Button>
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  );
}
