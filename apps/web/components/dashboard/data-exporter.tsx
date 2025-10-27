"use client";

import * as React from "react";
import { Download, FileDown, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/toast";

export interface DataExporterProps<T> {
  /**
   * Datos a exportar
   */
  data: T[];
  /**
   * Nombre del archivo (sin extensión)
   */
  filename?: string;
  /**
   * Columnas a exportar (opcional, por defecto todas)
   */
  columns?: Array<{
    key: keyof T | string;
    label: string;
  }>;
  /**
   * Formatos disponibles
   */
  formats?: Array<"csv" | "json" | "txt">;
  /**
   * Tamaño del botón
   */
  size?: "sm" | "md" | "lg";
  /**
   * Variante del botón
   */
  variant?:
    | "primary"
    | "secondary"
    | "danger"
    | "success"
    | "outline"
    | "ghost"
    | "link";
  /**
   * Texto del botón
   */
  label?: string;
  /**
   * Callback después de exportar
   */
  onExport?: (format: string) => void;
}

/**
 * Componente para exportar datos a múltiples formatos
 */
export function DataExporter<T extends Record<string, any>>({
  data,
  filename = "export",
  columns,
  formats = ["csv", "json", "txt"],
  size = "sm",
  variant = "secondary",
  label = "Exportar",
  onExport,
}: DataExporterProps<T>) {
  const { showToast } = useToast();

  const downloadFile = (
    content: string,
    mimeType: string,
    extension: string,
  ) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}-${new Date().toISOString().split("T")[0]}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getColumns = () => {
    if (columns) return columns;
    if (data.length === 0) return [];

    // Auto-generar columnas desde el primer objeto
    const firstItem = data[0];
    return Object.keys(firstItem).map((key) => ({
      key,
      label:
        key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1"),
    }));
  };

  const exportToCSV = () => {
    try {
      const cols = getColumns();
      if (cols.length === 0) {
        showToast("No hay datos para exportar", { type: "error" });
        return;
      }

      // Header
      const headers = cols.map((col) => `"${col.label}"`).join(",");

      // Rows
      const rows = data.map((row) => {
        return cols
          .map((col) => {
            const value = row[col.key];
            // Escape commas and quotes
            const stringValue = String(value ?? "");
            return `"${stringValue.replace(/"/g, '""')}"`;
          })
          .join(",");
      });

      const csv = [headers, ...rows].join("\n");
      downloadFile(csv, "text/csv;charset=utf-8;", "csv");

      showToast(`Exportados ${data.length} registros a CSV`, {
        type: "success",
      });
      onExport?.("csv");
    } catch (error) {
      console.error("Error exporting CSV:", error);
      showToast("Error al exportar CSV", { type: "error" });
    }
  };

  const exportToJSON = () => {
    try {
      const cols = getColumns();
      if (cols.length === 0) {
        showToast("No hay datos para exportar", { type: "error" });
        return;
      }

      // Si hay columnas específicas, filtrar los datos
      const exportData = columns
        ? data.map((row) => {
            const filtered: Record<string, any> = {};
            cols.forEach((col) => {
              filtered[String(col.key)] = row[col.key];
            });
            return filtered;
          })
        : data;

      const json = JSON.stringify(exportData, null, 2);
      downloadFile(json, "application/json", "json");

      showToast(`Exportados ${data.length} registros a JSON`, {
        type: "success",
      });
      onExport?.("json");
    } catch (error) {
      console.error("Error exporting JSON:", error);
      showToast("Error al exportar JSON", { type: "error" });
    }
  };

  const exportToTXT = () => {
    try {
      const cols = getColumns();
      if (cols.length === 0) {
        showToast("No hay datos para exportar", { type: "error" });
        return;
      }

      // Header
      const maxWidths = cols.map((col) => {
        const headerLength = col.label.length;
        const maxDataLength = Math.max(
          ...data.map((row) => String(row[col.key] ?? "").length),
        );
        return Math.max(headerLength, maxDataLength);
      });

      const separator = cols
        .map((_, i) => "-".repeat(maxWidths[i] + 2))
        .join("+");

      const header = cols
        .map((col, i) => col.label.padEnd(maxWidths[i]))
        .join(" | ");

      const rows = data.map((row) => {
        return cols
          .map((col, i) => String(row[col.key] ?? "").padEnd(maxWidths[i]))
          .join(" | ");
      });

      const txt = [header, separator, ...rows].join("\n");
      downloadFile(txt, "text/plain;charset=utf-8;", "txt");

      showToast(`Exportados ${data.length} registros a TXT`, {
        type: "success",
      });
      onExport?.("txt");
    } catch (error) {
      console.error("Error exporting TXT:", error);
      showToast("Error al exportar TXT", { type: "error" });
    }
  };

  const handleExport = (format: "csv" | "json" | "txt") => {
    switch (format) {
      case "csv":
        exportToCSV();
        break;
      case "json":
        exportToJSON();
        break;
      case "txt":
        exportToTXT();
        break;
    }
  };

  const formatIcons = {
    csv: FileSpreadsheet,
    json: FileDown,
    txt: FileText,
  };

  const formatLabels = {
    csv: "Exportar a CSV",
    json: "Exportar a JSON",
    txt: "Exportar a TXT",
  };

  if (data.length === 0) {
    return null;
  }

  // Si solo hay un formato, botón directo
  if (formats.length === 1) {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={() => handleExport(formats[0])}
        icon={<Download className="w-4 h-4" />}
      >
        {label}
      </Button>
    );
  }

  // Dropdown para múltiples formatos
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          icon={<Download className="w-4 h-4" />}
        >
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Formato de exportación</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {formats.map((format) => {
          const Icon = formatIcons[format];
          return (
            <DropdownMenuItem key={format} onClick={() => handleExport(format)}>
              <Icon className="w-4 h-4 mr-2" />
              {formatLabels[format]}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
