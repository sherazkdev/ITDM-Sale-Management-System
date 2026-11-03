"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { findNavItemForPath } from "@/config/itdms-navigation";
import { getWritePermissionForPath } from "@/config/route-write-permissions";
import { AccessDeniedView } from "@/components/shell/AccessDeniedView";

export function RouteAccessGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { session, hasPermission } = useAuth();

  if (session.status !== "authenticated") {
    return null;
  }

  const navItem = findNavItemForPath(pathname);
  if (navItem?.permission && !hasPermission(navItem.permission)) {
    return (
      <AccessDeniedView
        description={`You need the “${navItem.permission}” permission to open ${navItem.label}. Authorization is enforced by the API on every request.`}
      />
    );
  }

  const writePermission = getWritePermissionForPath(pathname);
  if (writePermission && !hasPermission(writePermission)) {
    return (
      <AccessDeniedView
        description={`You need the “${writePermission}” permission for this page. You may still have read access to related lists.`}
      />
    );
  }

  return children;
}
