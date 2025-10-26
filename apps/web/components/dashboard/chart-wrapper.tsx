"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

const BRISA_COLORS = {
  primary: "#4a9d8e",
  secondary: "#7ee7c4",
  tertiary: "#2d7a6e",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",
};

const CHART_COLORS = [
  BRISA_COLORS.primary,
  BRISA_COLORS.secondary,
  BRISA_COLORS.tertiary,
  BRISA_COLORS.success,
  BRISA_COLORS.warning,
  BRISA_COLORS.info,
];

interface BaseChartProps {
  /**
   * Título del chart
   */
  title?: string;
  /**
   * Descripción del chart
   */
  description?: string;
  /**
   * Datos para el chart
   */
  data: any[];
  /**
   * Altura del chart en pixeles
   */
  height?: number;
  /**
   * Mostrar leyenda
   */
  showLegend?: boolean;
  /**
   * Mostrar grid
   */
  showGrid?: boolean;
  /**
   * Clases adicionales
   */
  className?: string;
}

/**
 * Custom tooltip props interface for recharts
 */
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number | string;
    color: string;
  }>;
  label?: string;
}

/**
 * Tooltip personalizado para los charts
 */
function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-brisa-900/95 backdrop-blur-md border border-brisa-700/50 rounded-lg p-3 shadow-xl">
      <p className="text-sm font-semibold text-brisa-100 mb-2">{label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-brisa-300">{entry.name}:</span>
          <span className="text-brisa-50 font-semibold">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export interface LineChartProps extends BaseChartProps {
  /**
   * Clave del eje X
   */
  xKey: string;
  /**
   * Claves de las líneas a mostrar
   */
  lines: Array<{
    key: string;
    name?: string;
    color?: string;
    strokeWidth?: number;
  }>;
}

/**
 * Line Chart con diseño moderno
 */
export function ModernLineChart({
  title,
  description,
  data,
  xKey,
  lines,
  height = 300,
  showLegend = true,
  showGrid = true,
  className,
}: LineChartProps) {
  return (
    <Card className={className}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data}>
            {showGrid && (
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#2d7a6e"
                opacity={0.2}
              />
            )}
            <XAxis
              dataKey={xKey}
              stroke="#7ee7c4"
              style={{ fontSize: "12px" }}
            />
            <YAxis stroke="#7ee7c4" style={{ fontSize: "12px" }} />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend wrapperStyle={{ paddingTop: "20px" }} />}
            {lines.map((line, idx) => (
              <Line
                key={line.key}
                type="monotone"
                dataKey={line.key}
                name={line.name || line.key}
                stroke={line.color || CHART_COLORS[idx % CHART_COLORS.length]}
                strokeWidth={line.strokeWidth || 2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export interface AreaChartProps extends BaseChartProps {
  xKey: string;
  areas: Array<{
    key: string;
    name?: string;
    color?: string;
  }>;
}

/**
 * Area Chart con gradiente
 */
export function ModernAreaChart({
  title,
  description,
  data,
  xKey,
  areas,
  height = 300,
  showLegend = true,
  showGrid = true,
  className,
}: AreaChartProps) {
  return (
    <Card className={className}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={data}>
            <defs>
              {areas.map((area, idx) => {
                const color =
                  area.color || CHART_COLORS[idx % CHART_COLORS.length];
                return (
                  <linearGradient
                    key={area.key}
                    id={`gradient-${area.key}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={color} stopOpacity={0.1} />
                  </linearGradient>
                );
              })}
            </defs>
            {showGrid && (
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#2d7a6e"
                opacity={0.2}
              />
            )}
            <XAxis
              dataKey={xKey}
              stroke="#7ee7c4"
              style={{ fontSize: "12px" }}
            />
            <YAxis stroke="#7ee7c4" style={{ fontSize: "12px" }} />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend wrapperStyle={{ paddingTop: "20px" }} />}
            {areas.map((area, idx) => (
              <Area
                key={area.key}
                type="monotone"
                dataKey={area.key}
                name={area.name || area.key}
                stroke={area.color || CHART_COLORS[idx % CHART_COLORS.length]}
                fillOpacity={1}
                fill={`url(#gradient-${area.key})`}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export interface BarChartProps extends BaseChartProps {
  xKey: string;
  bars: Array<{
    key: string;
    name?: string;
    color?: string;
  }>;
}

/**
 * Bar Chart con diseño moderno
 */
export function ModernBarChart({
  title,
  description,
  data,
  xKey,
  bars,
  height = 300,
  showLegend = true,
  showGrid = true,
  className,
}: BarChartProps) {
  return (
    <Card className={className}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data}>
            {showGrid && (
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#2d7a6e"
                opacity={0.2}
              />
            )}
            <XAxis
              dataKey={xKey}
              stroke="#7ee7c4"
              style={{ fontSize: "12px" }}
            />
            <YAxis stroke="#7ee7c4" style={{ fontSize: "12px" }} />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend wrapperStyle={{ paddingTop: "20px" }} />}
            {bars.map((bar, idx) => (
              <Bar
                key={bar.key}
                dataKey={bar.key}
                name={bar.name || bar.key}
                fill={bar.color || CHART_COLORS[idx % CHART_COLORS.length]}
                radius={[8, 8, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export interface PieChartProps extends BaseChartProps {
  /**
   * Clave del valor
   */
  valueKey: string;
  /**
   * Clave del nombre
   */
  nameKey: string;
  /**
   * Colores personalizados
   */
  colors?: string[];
}

/**
 * Pie Chart con diseño moderno
 */
export function ModernPieChart({
  title,
  description,
  data,
  valueKey,
  nameKey,
  colors = CHART_COLORS,
  height = 300,
  showLegend = true,
  className,
}: PieChartProps) {
  return (
    <Card className={className}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              dataKey={valueKey}
              nameKey={nameKey}
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
