"use client";

import { cn } from "@/lib/utils";
import { AppSelect, type SearchableSelectOption } from "@/components/forms/SearchableSelect";

type FilterSelectOption = { value: string; label: string };

type FilterSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: FilterSelectOption[];
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
  searchable?: boolean;
  size?: "sm" | "md";
};

/**
 * Toolbar / list-page filter control — premium floating select (replaces native `<select>`).
 */
export function FilterSelect({
  value,
  onChange,
  options,
  placeholder = "All",
  className,
  "aria-label": ariaLabel,
  searchable,
  size = "sm",
}: FilterSelectProps) {
  const normalized: SearchableSelectOption[] = options.map((o) => ({
    value: o.value,
    label: o.label,
  }));

  const resolvedValue = value;
  const selected = normalized.find((o) => o.value === resolvedValue);
  const triggerPlaceholder =
    selected?.label ??
    (normalized.find((o) => o.value === "")?.label || placeholder);

  return (
    <div className={cn("inline-flex min-w-[8rem]", className)}>
      <AppSelect
        value={resolvedValue}
        onChange={onChange}
        options={normalized}
        placeholder={triggerPlaceholder}
        searchPlaceholder="Filter…"
        aria-label={ariaLabel}
        searchable={searchable ?? normalized.length > 6}
        size={size}
        className="w-full"
      />
    </div>
  );
}
