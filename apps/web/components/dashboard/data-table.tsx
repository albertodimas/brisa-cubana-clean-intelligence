"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export interface Column<T> {
  /**
   * Clave de la columna (debe coincidir con la clave del objeto de datos)
   */
  key: keyof T | string;
  /**
   * Título de la columna
   */
  header: string;
  /**
   * Función para renderizar custom content
   */
  render?: (value: unknown, row: T) => React.ReactNode;
  /**
   * Si la columna es sortable
   */
  sortable?: boolean;
  /**
   * Si la columna es filtrable
   */
  filterable?: boolean;
  /**
   * Ancho de la columna
   */
  width?: string;
  /**
   * Alineación del contenido
   */
  align?: "left" | "center" | "right";
}

export interface DataTableProps<T> {
  /**
   * Columnas de la tabla
   */
  columns: Column<T>[];
  /**
   * Datos de la tabla
   */
  data: T[];
  /**
   * Título de la tabla
   */
  title?: string;
  /**
   * Descripción de la tabla
   */
  description?: string;
  /**
   * Habilitar búsqueda
   */
  searchable?: boolean;
  /**
   * Placeholder de la búsqueda
   */
  searchPlaceholder?: string;
  /**
   * Habilitar paginación
   */
  paginated?: boolean;
  /**
   * Filas por página
   */
  pageSize?: number;
  /**
   * Acciones por fila
   */
  actions?: (row: T) => React.ReactNode;
  /**
   * Callback al seleccionar una fila
   */
  onRowClick?: (row: T) => void;
  /**
   * Clave única para cada fila
   */
  rowKey: keyof T;
  /**
   * Clases adicionales
   */
  className?: string;
  /**
   * Mensaje cuando no hay datos
   */
  emptyMessage?: string;
}

/**
 * Data Table moderna con búsqueda, sorting y paginación
 */
export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  title,
  description,
  searchable = true,
  searchPlaceholder = "Buscar...",
  paginated = true,
  pageSize = 10,
  actions,
  onRowClick,
  rowKey,
  className,
  emptyMessage = "No se encontraron resultados",
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortConfig, setSortConfig] = React.useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);

  // Filtrar datos por búsqueda
  const filteredData = React.useMemo(() => {
    if (!searchQuery) return data;

    return data.filter((row) => {
      return columns.some((column) => {
        const value = row[column.key];
        return value
          ?.toString()
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      });
    });
  }, [data, searchQuery, columns]);

  // Ordenar datos
  const sortedData = React.useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Paginación
  const paginatedData = React.useMemo(() => {
    if (!paginated) return sortedData;

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, pageSize, paginated]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = (columnKey: string) => {
    setSortConfig((current) => {
      if (current?.key === columnKey) {
        return {
          key: columnKey,
          direction: current.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key: columnKey, direction: "asc" };
    });
  };

  const getSortIcon = (columnKey: string) => {
    if (sortConfig?.key !== columnKey) {
      return <ChevronsUpDown className="w-4 h-4 text-brisa-500" />;
    }
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="w-4 h-4 text-brisa-400" />
    ) : (
      <ChevronDown className="w-4 h-4 text-brisa-400" />
    );
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      {/* Header */}
      <div className="p-6 border-b border-brisa-700/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            {title && (
              <h3 className="text-xl font-semibold text-brisa-50">{title}</h3>
            )}
            {description && (
              <p className="text-sm text-brisa-400 mt-1">{description}</p>
            )}
          </div>

          {searchable && (
            <div className="w-full sm:w-auto sm:min-w-[300px]">
              <Input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                prefixIcon={<Search className="w-4 h-4" />}
              />
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-brisa-900/50 border-b border-brisa-700/30">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={cn(
                    "px-6 py-3 text-left text-xs font-semibold text-brisa-300 uppercase tracking-wider",
                    column.align === "center" && "text-center",
                    column.align === "right" && "text-right",
                    column.sortable && "cursor-pointer hover:text-brisa-200",
                  )}
                  style={{ width: column.width }}
                  onClick={() =>
                    column.sortable && handleSort(String(column.key))
                  }
                >
                  <div className="flex items-center gap-2">
                    {column.header}
                    {column.sortable && getSortIcon(String(column.key))}
                  </div>
                </th>
              ))}
              {actions && (
                <th className="px-6 py-3 text-right text-xs font-semibold text-brisa-300 uppercase tracking-wider">
                  Acciones
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-brisa-700/30">
            <AnimatePresence mode="popLayout">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (actions ? 1 : 0)}>
                    <EmptyState
                      variant="search"
                      title="No hay resultados"
                      description={emptyMessage}
                      className="py-12"
                    />
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, idx) => (
                  <motion.tr
                    key={String(row[rowKey])}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2, delay: idx * 0.03 }}
                    className={cn(
                      "hover:bg-brisa-900/30 transition-colors",
                      onRowClick && "cursor-pointer",
                    )}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map((column) => (
                      <td
                        key={String(column.key)}
                        className={cn(
                          "px-6 py-4 whitespace-nowrap text-sm text-brisa-200",
                          column.align === "center" && "text-center",
                          column.align === "right" && "text-right",
                        )}
                      >
                        {column.render
                          ? column.render(row[column.key], row)
                          : String(row[column.key] ?? "-")}
                      </td>
                    ))}
                    {actions && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div
                          className="flex items-center justify-end gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {actions(row)}
                        </div>
                      </td>
                    )}
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {paginated && totalPages > 1 && (
        <div className="px-6 py-4 border-t border-brisa-700/30 flex items-center justify-between">
          <p className="text-sm text-brisa-400">
            Mostrando {(currentPage - 1) * pageSize + 1} a{" "}
            {Math.min(currentPage * pageSize, sortedData.length)} de{" "}
            {sortedData.length} resultados
          </p>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
