"use client";

import Link from "next/link";
import { Bell, PanelLeft, Shield } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useUIStore } from "@/stores/uiStore";
import { useAuth } from "@/components/providers/AuthProvider";
import { PermissionKeys } from "@/lib/permissions";

export default function PreferencesSettingsPage() {
  const { sidebarCollapsed, setSidebarCollapsed } = useUIStore();
  const { hasPermission } = useAuth();

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PanelLeft className="h-4 w-4 text-primary" /> Layout
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Compact sidebar</p>
            <p className="text-xs text-muted-foreground">Show icon-only navigation on desktop.</p>
          </div>
          <Switch
            checked={sidebarCollapsed}
            onCheckedChange={setSidebarCollapsed}
            aria-label="Compact sidebar"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" /> Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Operational notifications are managed on the notifications inbox page.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href="/notifications">Open notifications</Link>
          </Button>
        </CardContent>
      </Card>

      {hasPermission(PermissionKeys.usersManage) ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" /> Administration
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              User roles, permissions, and platform admin tools require the admin console.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin">Open administration</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
