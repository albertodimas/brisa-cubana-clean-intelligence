"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { DashboardStats } from "@/lib/api";

type TopPropertiesChartProps = {
  data: DashboardStats["topProperties"];
};

export function TopPropertiesChart({ data }: TopPropertiesChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-brisa-800 bg-white dark:bg-brisa-900/60 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Top 5 Propiedades Más Solicitadas
        </h3>
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-brisa-400">
          No hay datos disponibles
        </div>
      </div>
    );
  }

  const chartData = data.map((item) => ({
    name: item.propertyLabel,
    bookings: item.bookingsCount,
  }));

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-brisa-800 bg-white dark:bg-brisa-900/60 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Top 5 Propiedades Más Solicitadas
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="horizontal">
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
          <XAxis
            type="number"
            stroke="#9ca3af"
            tick={{ fill: "#9ca3af", fontSize: 12 }}
          />
          <YAxis
            dataKey="name"
            type="category"
            width={150}
            stroke="#9ca3af"
            tick={{ fill: "#9ca3af", fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              border: "none",
              borderRadius: "8px",
              color: "#fff",
            }}
            formatter={(value: number) => [`${value} reservas`, "Total"]}
          />
          <Bar dataKey="bookings" fill="#10b981" radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
