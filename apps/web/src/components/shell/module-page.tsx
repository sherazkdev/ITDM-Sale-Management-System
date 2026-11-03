import { type LucideIcon } from "lucide-react";
import { ModulePlaceholder } from "@/components/shell/ModulePlaceholder";

type ModulePlaceholderPageProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  phase?: string;
};

export function createModulePlaceholderPage(props: ModulePlaceholderPageProps) {
  return function ModulePage() {
    return <ModulePlaceholder {...props} />;
  };
}
