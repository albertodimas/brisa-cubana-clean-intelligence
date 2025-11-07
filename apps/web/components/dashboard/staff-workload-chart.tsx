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

type StaffWorkloadChartProps = {
  data: DashboardStats["staffWorkload"];
};

export function StaffWorkloadChart({ data }: StaffWorkloadChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-brisa-800 bg-white dark:bg-brisa-900/60 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Carga de Trabajo por Staff
        </h3>
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-brisa-400">
          No hay staff asignado a reservas
        </div>
      </div>
    );
  }

  // Limitar a top 10 staff
  const chartData = data.slice(0, 10).map((item) => ({
    name: item.staffName,
    bookings: item.bookingsCount,
  }));

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-brisa-800 bg-white dark:bg-brisa-900/60 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Carga de Trabajo por Staff
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
            formatter={(value: number) => [`${value} reservas`, "Asignadas"]}
          />
          <Bar dataKey="bookings" fill="#8b5cf6" radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
