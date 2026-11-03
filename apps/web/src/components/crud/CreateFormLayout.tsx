"use client";

import { cn } from "@/lib/utils";

type CreateFormLayoutProps = {
  /** Primary column: section cards + footer actions */
  children: React.ReactNode;
  /** Optional ~320px right rail (CRM `leads/new` pattern) */
  aside?: React.ReactNode;
  className?: string;
};

/**
 * CRM-aligned create/edit page grid — `lg:grid-cols-[1fr_320px]`.
 * Source: `employee-management-system` `leads/new/page.tsx`
 */
export function CreateFormLayout({ children, aside, className }: CreateFormLayoutProps) {
  if (!aside) {
    return <div className={cn("flex flex-col gap-6", className)}>{children}</div>;
  }

  return (
    <div className={cn("grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]", className)}>
      <div className="flex min-w-0 flex-col gap-6">{children}</div>
      <div className="flex min-w-0 flex-col gap-4 lg:max-w-[320px]">{aside}</div>
    </div>
  );
}

type CreateFormActionsProps = {
  children: React.ReactNode;
  className?: string;
};

/** CRM footer: cancel left, primary actions right */
export function CreateFormActions({ children, className }: CreateFormActionsProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      {children}
    </div>
  );
}
