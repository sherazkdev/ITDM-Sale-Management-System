import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type FilterSelectOption = { value: string; label: string };

type FilterSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: FilterSelectOption[];
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
};

/** Figma-style filter dropdown (bordered pill control). */
export function FilterSelect({
  value,
  onChange,
  options,
  placeholder = "All",
  className,
  "aria-label": ariaLabel,
}: FilterSelectProps) {
  return (
    <div className={cn("relative inline-flex", className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        className={cn(
          "h-10 appearance-none rounded-lg border border-input bg-card pl-3 pr-9 text-sm shadow-card",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring",
          "cursor-pointer",
        )}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}
