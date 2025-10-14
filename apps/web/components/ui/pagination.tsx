"use client";

import { Button } from "./button";

type PaginationProps = {
  count: number;
  hasMore: boolean;
  onLoadMore?: () => void | Promise<void>;
  isLoading?: boolean;
  className?: string;
  total?: number | string;
  label?: string;
};

/**
 * Simple pagination control that surfaces the current count of elementos y
 * un botón "Cargar más" cuando hay más resultados disponibles.
 */
export function Pagination({
  count,
  hasMore,
  onLoadMore,
  isLoading = false,
  className = "",
  total,
  label = "registros",
}: PaginationProps) {
  const displayTotal =
    total ?? (hasMore ? `${count}+` : count === 1 ? "1" : String(count));

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 ${className}`}
    >
      <span className="ui-caption text-brisa-200">
        {count === 0
          ? `No hay ${label} para mostrar`
          : hasMore
            ? `Mostrando ${count} de ${displayTotal} ${label}`
            : `Mostrando ${count} ${label}`}
      </span>

      {hasMore ? (
        <Button
          type="button"
          variant="ghost"
          className="max-w-fit"
          isLoading={isLoading}
          disabled={isLoading}
          onClick={() => onLoadMore?.()}
        >
          {isLoading ? "Cargando..." : "Cargar más"}
        </Button>
      ) : count > 0 ? (
        <span className="ui-caption text-brisa-300">No hay más resultados</span>
      ) : null}
    </div>
  );
}
