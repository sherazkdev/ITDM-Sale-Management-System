"use client";

import { useQuery } from "@tanstack/react-query";
import { SearchableSelect } from "@/components/forms/SearchableSelect";
import { fetchDepartmentSelectOptions } from "@/lib/api/departments";

type DepartmentSelectProps = {
  value: string;
  onChange: (departmentId: string) => void;
  /** Free-text department when no `departmentId` is linked (legacy records). */
  legacyDepartment?: string | null;
  disabled?: boolean;
  className?: string;
};

export function DepartmentSelect({
  value,
  onChange,
  legacyDepartment,
  disabled,
  className,
}: DepartmentSelectProps) {
  const { data: options = [], isLoading } = useQuery({
    queryKey: ["departments", "select-options"],
    queryFn: () => fetchDepartmentSelectOptions(),
    staleTime: 60_000,
  });

  return (
    <div className="flex flex-col gap-1.5">
      <SearchableSelect
        value={value}
        onChange={onChange}
        options={options}
        placeholder={isLoading ? "Loading departments…" : "Select department…"}
        searchPlaceholder="Search departments…"
        disabled={disabled || isLoading}
        className={className}
        aria-label="Department"
        emptyMessage={isLoading ? "Loading…" : "No departments found."}
      />
      {!value && legacyDepartment ? (
        <p className="text-xs text-muted-foreground">
          Legacy label on record: <span className="font-medium text-foreground">{legacyDepartment}</span>
          {" — "}
          pick a catalog department to link this employee.
        </p>
      ) : null}
    </div>
  );
}
