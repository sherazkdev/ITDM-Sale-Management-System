"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";

export type SearchableSelectOption = { value: string; label: string; hint?: string };

type SearchableSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  "aria-label"?: string;
  emptyMessage?: string;
  /** When false, hides the search field (short lists). Default: on when options.length > 7. */
  searchable?: boolean;
  size?: "sm" | "md";
  /** Radix modal mode — use inside dialogs to avoid focus traps clipping. */
  modal?: boolean;
  clearable?: boolean;
};

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  disabled,
  className,
  triggerClassName,
  "aria-label": ariaLabel,
  emptyMessage = "No matches.",
  searchable,
  size = "md",
  modal = false,
  clearable = false,
}: SearchableSelectProps) {
  const reducedMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const showSearch = searchable ?? options.length > 7;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q),
    );
  }, [options, query]);

  const selected = options.find((o) => o.value === value);

  const selectOption = useCallback(
    (next: string) => {
      onChange(next);
      setOpen(false);
      setQuery("");
      setHighlight(0);
    },
    [onChange],
  );

  useEffect(() => {
    if (!open) return;
    setHighlight(0);
  }, [open, query]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-option-index="${highlight}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [highlight, open]);

  const onListKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, Math.max(0, filtered.length - 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter" && filtered[highlight]) {
      e.preventDefault();
      selectOption(filtered[highlight]!.value);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  const heightClass = size === "sm" ? "h-9 text-sm" : "h-10 text-sm";

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={modal}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-between gap-2 font-normal rounded-lg border-input bg-card shadow-card",
            heightClass,
            triggerClassName,
            className,
          )}
          aria-label={ariaLabel ?? placeholder}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className="truncate text-left">{selected?.label ?? placeholder}</span>
          <span className="flex shrink-0 items-center gap-0.5">
            {clearable && value ? (
              <span
                role="button"
                tabIndex={-1}
                className="rounded p-0.5 hover:bg-muted"
                aria-label="Clear selection"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange("");
                }}
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </span>
            ) : null}
            <ChevronDown
              className={cn(
                "h-4 w-4 opacity-50 transition-transform duration-200",
                open && !reducedMotion && "rotate-180",
              )}
            />
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={4}
        className={cn(
          "w-[var(--radix-dropdown-menu-trigger-width)] min-w-[12rem] p-2 rounded-lg border bg-popover shadow-soft",
          !reducedMotion &&
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2",
        )}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {showSearch ? (
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="mb-2 h-9"
            aria-label="Filter options"
            onKeyDown={(e) => {
              e.stopPropagation();
              onListKeyDown(e);
            }}
            autoFocus
          />
        ) : null}
        <ul
          ref={listRef}
          className="max-h-56 overflow-y-auto space-y-0.5"
          role="listbox"
          aria-label={ariaLabel ?? "Options"}
          tabIndex={-1}
          onKeyDown={onListKeyDown}
        >
          {filtered.length === 0 ? (
            <li className="px-2 py-3 text-sm text-muted-foreground text-center">{emptyMessage}</li>
          ) : (
            filtered.map((opt, index) => (
              <li key={opt.value || "__empty__"}>
                <button
                  type="button"
                  role="option"
                  data-option-index={index}
                  aria-selected={opt.value === value}
                  className={cn(
                    "flex w-full items-start gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors",
                    "hover:bg-muted focus-visible:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    (opt.value === value || index === highlight) && "bg-muted/80",
                  )}
                  onMouseEnter={() => setHighlight(index)}
                  onClick={() => selectOption(opt.value)}
                >
                  <span className="flex-1 min-w-0">
                    <span className="block truncate">{opt.label}</span>
                    {opt.hint ? (
                      <span className="block text-xs text-muted-foreground truncate">{opt.hint}</span>
                    ) : null}
                  </span>
                  {opt.value === value ? (
                    <Check className="h-4 w-4 shrink-0 text-primary mt-0.5" aria-hidden />
                  ) : null}
                </button>
              </li>
            ))
          )}
        </ul>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Canonical app select — same behavior as SearchableSelect (enterprise combobox). */
export const AppSelect = SearchableSelect;
