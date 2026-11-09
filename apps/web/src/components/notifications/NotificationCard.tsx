"use client";

import { Bell, Calendar, FileText, KeyRound, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { NotificationEvent } from "@/lib/api/notifications";
import { notificationSummary } from "@/lib/api/notifications";

function iconForType(eventType: string) {
  if (eventType === "CONTRACT_EXPIRY") return FileText;
  if (eventType === "LICENSE_EXPIRY") return KeyRound;
  if (eventType === "PO_VALID_UNTIL") return ShoppingCart;
  return Bell;
}

type Props = {
  row: NotificationEvent;
  onMarkRead: (id: string) => void;
  marking: boolean;
};

export function NotificationCard({ row, onMarkRead, marking }: Props) {
  const Icon = iconForType(row.eventType);
  const unread = !row.readAt;
  const title = row.eventType.replace(/_/g, " ");

  return (
    <article
      className={cn(
        "rounded-xl border border-border bg-card p-4 shadow-card transition-colors",
        unread && "border-primary/30 bg-primary/[0.03]",
        "hover:border-border/80",
      )}
    >
      <div className="flex gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            unread ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold capitalize flex items-center gap-2">
                {title.toLowerCase()}
                {unread ? (
                  <span className="inline-flex h-2 w-2 rounded-full bg-primary" aria-label="Unread" />
                ) : (
                  <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Read</span>
                )}
              </h3>
              <p className="text-sm text-foreground mt-0.5">{notificationSummary(row)}</p>
            </div>
            {!unread ? null : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={marking}
                onClick={() => onMarkRead(row.notificationEventId)}
              >
                Mark read
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Due {row.dueOn}
            </span>
            <span>
              {row.entityType} #{row.entityId}
            </span>
          </p>
        </div>
      </div>
    </article>
  );
}
