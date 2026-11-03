"use client";

import Link from "next/link";
import {
  Bell,
  Briefcase,
  Calendar,
  Check,
  FileText,
  MessageSquare,
  Package,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/providers/AuthProvider";
import { PermissionKeys } from "@/lib/permissions";
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  type NotificationEvent,
} from "@/lib/api/notifications";
import { cn } from "@/lib/utils";

const ENTITY_ICON: Record<string, LucideIcon> = {
  purchase_order: Briefcase,
  contract: FileText,
  asset: Package,
  maintenance: Wrench,
  software_license: Calendar,
};

const ENTITY_TONE: Record<string, string> = {
  purchase_order: "bg-info-soft text-info-softFg",
  contract: "bg-primary/10 text-primary",
  asset: "bg-success-soft text-success-softFg",
  maintenance: "bg-warning-soft text-warning-softFg",
  software_license: "bg-primary/10 text-primary",
};

function toneFor(item: NotificationEvent) {
  return ENTITY_TONE[item.entityType] ?? "bg-muted text-muted-foreground";
}

function iconFor(item: NotificationEvent) {
  return ENTITY_ICON[item.entityType] ?? MessageSquare;
}

function titleFor(item: NotificationEvent) {
  return item.eventType.replace(/_/g, " ");
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

/** CRM-aligned notification dropdown (`NotificationBell.tsx` in employee-management-system). */
export function NotificationBell() {
  const { session, hasPermission } = useAuth();
  const enabled =
    session.status === "authenticated" && hasPermission(PermissionKeys.notificationsRead);

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: fetchUnreadNotificationCount,
    enabled,
    refetchInterval: 60_000,
  });

  const { data: page, isLoading } = useQuery({
    queryKey: ["notifications", "bell-preview"],
    queryFn: () => fetchNotifications({ page: 1, pageSize: 8 }),
    enabled,
  });

  const items = page?.data ?? [];
  const unread = enabled ? unreadCount : 0;

  if (!enabled) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unread > 0 ? (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-[10px] justify-center"
            >
              {unread > 99 ? "99+" : unread}
            </Badge>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-border">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">Notifications</p>
            {unread > 0 ? (
              <Badge variant="default" className="h-5 min-w-5 px-1.5 justify-center">
                {unread}
              </Badge>
            ) : null}
          </div>
          <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
            <Link href="/notifications">
              <Check className="h-3.5 w-3.5" /> Manage
            </Link>
          </Button>
        </div>

        <div className="max-h-[480px] overflow-y-auto scrollbar-thin">
          {isLoading ? (
            <div className="flex flex-col gap-2 p-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="px-3 py-10 text-center text-sm text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              You&apos;re all caught up!
            </div>
          ) : (
            <ul>
              {items.map((n) => (
                <NotificationRow key={n.notificationEventId} item={n} />
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-border p-2">
          <Button asChild variant="ghost" size="sm" className="w-full justify-center">
            <Link href="/notifications">See all notifications</Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotificationRow({ item }: { item: NotificationEvent }) {
  const Icon = iconFor(item);
  const inner = (
    <div className="flex items-start gap-3 px-3 py-2.5 hover:bg-muted/60 transition-colors">
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          toneFor(item),
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm leading-snug capitalize", !item.readAt && "font-medium")}>
          {titleFor(item)}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
          {item.entityType.replace(/_/g, " ")} · due {item.dueOn}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground tabular">{timeAgo(item.createdAt)}</p>
      </div>
      {!item.readAt ? (
        <span className="h-2 w-2 mt-2 rounded-full bg-primary shrink-0" aria-label="Unread" />
      ) : null}
    </div>
  );

  return (
    <li>
      <Link href="/notifications">{inner}</Link>
    </li>
  );
}
