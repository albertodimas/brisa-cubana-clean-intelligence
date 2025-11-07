"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import type { DashboardStats } from "@/lib/api";

type BookingsByStatusChartProps = {
  data: DashboardStats["bookingsByStatus"];
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b", // amber-500
  CONFIRMED: "#3b82f6", // blue-500
  IN_PROGRESS: "#8b5cf6", // violet-500
  COMPLETED: "#10b981", // green-500
  CANCELLED: "#ef4444", // red-500
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmada",
  IN_PROGRESS: "En progreso",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
};

export function BookingsByStatusChart({ data }: BookingsByStatusChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-brisa-800 bg-white dark:bg-brisa-900/60 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Reservas por Estado
        </h3>
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-brisa-400">
          No hay datos disponibles
        </div>
      </div>
    );
  }

  const chartData = data.map((item) => ({
    name: STATUS_LABELS[item.status] || item.status,
    value: item.count,
    percentage: item.percentage,
  }));

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-brisa-800 bg-white dark:bg-brisa-900/60 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Reservas por Estado
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ percentage }) => `${percentage}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => {
              const originalStatus = data[index].status;
              const color = STATUS_COLORS[originalStatus] || "#6b7280";
              return <Cell key={`cell-${index}`} fill={color} />;
            })}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              border: "none",
              borderRadius: "8px",
              color: "#fff",
            }}
            formatter={(value: number, name: string) => [
              `${value} reservas`,
              name,
            ]}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
