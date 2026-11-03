import { type LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";

type ModulePlaceholderProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  phase?: string;
};

export function ModulePlaceholder({ title, description, icon, phase = "UI04+" }: ModulePlaceholderProps) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      <EmptyState
        icon={icon}
        title="Not implemented yet"
        description={`This module is navigation-only until ${phase}. The API enforces permissions on every action when screens ship.`}
      />
    </div>
  );
}
