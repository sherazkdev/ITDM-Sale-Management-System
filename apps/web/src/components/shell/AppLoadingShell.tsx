import { Skeleton } from "@/components/ui/skeleton";

/** Full-viewport placeholder while session resolves — avoids protected content flash. */
export function AppLoadingShell() {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden md:flex w-[240px] flex-col border-r border-border p-4 gap-3">
        <Skeleton className="h-8 w-32" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <Skeleton className="h-16 w-full rounded-none" />
        <div className="p-6 space-y-4">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
