"use client";

import { Button } from "./button";
import { Chip } from "./chip";

export type FilterChip = {
  key: string;
  label: string;
  value: string | number | boolean;
};

export type FilterChipsProps = {
  filters: FilterChip[];
  onRemove: (key: string) => void;
  onClearAll?: () => void;
  className?: string;
  clearAllTestId?: string;
};

export function FilterChips({
  filters,
  onRemove,
  onClearAll,
  clearAllTestId,
  className = "",
}: FilterChipsProps) {
  if (filters.length === 0) {
    return null;
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-2 text-sm text-brisa-200 ${className}`}
    >
      {filters.map(({ key, label, value }) => (
        <Chip key={key} className="gap-2">
          <span>
            {label}:{" "}
            <span className="font-semibold">
              {typeof value === "boolean" ? (value ? "Sí" : "No") : value}
            </span>
          </span>
          <button
            type="button"
            onClick={() => onRemove(key)}
            className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-brisa-700 text-brisa-200 hover:bg-brisa-600 focus:outline-none focus:ring-2 focus:ring-brisa-400"
            aria-label={`Quitar filtro ${label}`}
          >
            ×
          </button>
        </Chip>
      ))}
      {filters.length > 1 && onClearAll ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="px-2 py-1 text-xs text-brisa-300 hover:text-brisa-100"
          onClick={onClearAll}
          data-testid={clearAllTestId}
        >
          Limpiar todos
        </Button>
      ) : null}
    </div>
  );
}
