"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { MobileSidebar } from "@/components/layout/MobileSidebar";
import { AppLoadingShell } from "@/components/shell/AppLoadingShell";
import { RouteAccessGuard } from "@/components/shell/RouteAccessGuard";

export function AuthenticatedAppShell({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();

  if (loading) {
    return <AppLoadingShell />;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <MobileSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1720px] w-full mx-auto min-w-0 overflow-x-hidden">
          <RouteAccessGuard>{children}</RouteAccessGuard>
        </main>
      </div>
    </div>
  );
}
