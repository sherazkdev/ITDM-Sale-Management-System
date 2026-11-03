"use client";

import { ShieldOff } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";

export function AccessDeniedView(props: { title?: string; description: string }) {
  return (
    <div className="space-y-6">
      <PageHeader
        title={props.title ?? "Access denied"}
        description="Your account does not have permission for this action."
      />
      <EmptyState icon={ShieldOff} title="Not authorized" description={props.description} />
    </div>
  );
}
