"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { DashboardStats } from "@/lib/api";

type RevenueTrendChartProps = {
  data: DashboardStats["revenueTrend"];
};

export function RevenueTrendChart({ data }: RevenueTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-brisa-800 bg-white dark:bg-brisa-900/60 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Tendencia de Ingresos (Últimos 30 días)
        </h3>
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-brisa-400">
          No hay datos disponibles
        </div>
      </div>
    );
  }

  // Formatear fecha para mostrar
  const chartData = data.map((item) => {
    const date = new Date(item.date);
    return {
      date: date.toLocaleDateString("es-ES", {
        month: "short",
        day: "numeric",
      }),
      amount: item.amount,
      fullDate: item.date,
    };
  });

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-brisa-800 bg-white dark:bg-brisa-900/60 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Tendencia de Ingresos (Últimos 30 días)
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
          <XAxis
            dataKey="date"
            stroke="#9ca3af"
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <YAxis
            stroke="#9ca3af"
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              border: "none",
              borderRadius: "8px",
              color: "#fff",
            }}
            formatter={(value: number) => [`$${value.toFixed(2)}`, "Ingresos"]}
            labelFormatter={(label, payload) => {
              if (payload && payload.length > 0) {
                const fullDate = payload[0].payload.fullDate;
                return new Date(fullDate).toLocaleDateString("es-ES", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                });
              }
              return label;
            }}
          />
          <Line
            type="monotone"
            dataKey="amount"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: "#3b82f6", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
