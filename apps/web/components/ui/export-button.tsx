"use client";

import { useState } from "react";
import Papa from "papaparse";
import { useAnalytics } from "@/hooks/use-analytics";

type ExportButtonProps<T> = {
  data: T[];
  filename: string;
  columns: {
    key: keyof T | string;
    label: string;
    transform?: (item: T) => string;
  }[];
  disabled?: boolean;
  maxRows?: number;
  resourceType?: string;
  testId?: string;
};

const numberFormatter = new Intl.NumberFormat("es-ES");
const formatNumber = (value: number) => numberFormatter.format(value);

export function ExportButton<T extends Record<string, unknown>>({
  data,
  filename,
  columns,
  disabled = false,
  maxRows = 10000,
  resourceType = "data",
  testId,
}: ExportButtonProps<T>) {
  const [isExporting, setIsExporting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { trackEvent } = useAnalytics();

  const performExport = () => {
    setIsExporting(true);
    setShowConfirmation(false);

    try {
      // Limitar a maxRows
      const dataToExport = data.slice(0, maxRows);

      // Transformar datos según configuración de columnas
      const csvData = dataToExport.map((item) => {
        const row: Record<string, string> = {};
        columns.forEach((col) => {
          if (col.transform) {
            row[col.label] = col.transform(item);
          } else {
            const value = item[col.key as keyof T];
            row[col.label] =
              value !== null && value !== undefined ? String(value) : "";
          }
        });
        return row;
      });

      // Generar CSV
      const csv = Papa.unparse(csvData, {
        quotes: true,
        delimiter: ",",
        header: true,
      });

      // Crear blob y descargar
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute("download", `${filename}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Track export event
      trackEvent("csv_export", {
        resourceType,
        rowCount: dataToExport.length,
        totalRows: data.length,
        filename,
      });
    } catch (error) {
      console.error("Error exporting CSV:", error);
      trackEvent("csv_export_error", {
        resourceType,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExport = () => {
    // Show confirmation for large exports (>5000 rows)
    if (data.length > 5000) {
      setShowConfirmation(true);
    } else {
      performExport();
    }
  };

  const hasData = data.length > 0;
  const isDisabled = disabled || !hasData;
  const exportCount = Math.min(data.length, maxRows);
  const formattedExportCount = formatNumber(exportCount);
  const formattedTotalRows = formatNumber(data.length);
  const formattedMaxRows = formatNumber(maxRows);

  if (showConfirmation) {
    return (
      <div
        className="inline-flex flex-col gap-2 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950"
        role="alert"
        aria-live="polite"
      >
        <div className="flex items-start gap-3">
          <svg
            className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Exportación grande
            </h3>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
              Se exportarán {formattedExportCount} filas
              {data.length > maxRows && ` (de ${formattedTotalRows} totales)`}.
              ¿Deseas continuar?
            </p>
          </div>
        </div>
        <div className="flex gap-2 ml-8">
          <button
            onClick={performExport}
            className="inline-flex items-center gap-2 rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:bg-amber-700 dark:hover:bg-amber-600"
            aria-label={`Confirmar exportación de ${formattedExportCount} filas`}
          >
            Sí, exportar
          </button>
          <button
            onClick={() => setShowConfirmation(false)}
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:border-brisa-700 dark:bg-brisa-900 dark:text-brisa-200 dark:hover:bg-brisa-800"
            aria-label="Cancelar exportación"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      data-testid={testId}
      onClick={handleExport}
      disabled={isDisabled || isExporting}
      className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-brisa-700 dark:bg-brisa-900 dark:text-brisa-200 dark:hover:bg-brisa-800"
      title={
        !hasData
          ? "No hay datos para exportar"
          : data.length > maxRows
            ? `Se exportarán los primeros ${formattedMaxRows} registros`
            : undefined
      }
      aria-label={
        !hasData
          ? "No hay datos para exportar"
          : `Exportar ${formattedExportCount} ${exportCount === 1 ? "fila" : "filas"} a CSV`
      }
      aria-busy={isExporting}
    >
      {isExporting ? (
        <>
          <svg
            className="h-4 w-4 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Exportando...
        </>
      ) : (
        <>
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Exportar CSV
          {data.length > 0 && (
            <span className="text-xs text-gray-500" aria-hidden="true">
              ({formattedExportCount})
            </span>
          )}
        </>
      )}
    </button>
  );
}
