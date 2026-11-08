"use client";

import { Columns3, ChevronUp, ChevronDown, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Column } from "./DataTable";

type DataTableColumnMenuProps<T> = {
  tableId: string;
  columns: Column<T>[];
  hiddenKeys: string[];
  columnOrder: string[];
  onToggle: (key: string) => void;
  onMove: (key: string, direction: "up" | "down") => void;
  onReset: () => void;
};

export function DataTableColumnMenu<T>({
  columns,
  hiddenKeys,
  columnOrder,
  onToggle,
  onMove,
  onReset,
}: DataTableColumnMenuProps<T>) {
  const ordered = columnOrder
    .map((key) => columns.find((c) => c.key === key))
    .filter((c): c is Column<T> => Boolean(c));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="h-9 gap-1.5" aria-label="Columns">
          <Columns3 className="h-4 w-4" />
          Columns
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
        {ordered.map((col) => {
          const visible = !hiddenKeys.includes(col.key);
          const label = typeof col.header === "string" ? col.header : col.key;
          return (
            <DropdownMenuItem
              key={col.key}
              className="flex items-center justify-between gap-2"
              onSelect={(e) => {
                e.preventDefault();
                onToggle(col.key);
              }}
            >
              <span className="flex items-center gap-2">
                <span
                  className="inline-flex h-4 w-4 items-center justify-center rounded border border-border text-[10px]"
                  aria-hidden
                >
                  {visible ? "✓" : ""}
                </span>
                {label}
              </span>
              <span className="flex gap-0.5">
                <button
                  type="button"
                  className="rounded p-0.5 hover:bg-muted"
                  aria-label={`Move ${label} up`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onMove(col.key, "up");
                  }}
                >
                  <ChevronUp className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  className="rounded p-0.5 hover:bg-muted"
                  aria-label={`Move ${label} down`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onMove(col.key, "down");
                  }}
                >
                  <ChevronDown className="h-3 w-3" />
                </button>
              </span>
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onReset}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset layout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
