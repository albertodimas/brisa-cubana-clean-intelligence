"use client";

import type { Booking, Service } from "@/lib/api";
import { Card } from "./ui/card";

type DashboardProps = {
  bookings: Booking[];
  services: Service[];
  customersCount: number;
};

type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export function Dashboard({
  bookings,
  services,
  customersCount,
}: DashboardProps) {
  // KPIs calculation
  const totalRevenue = bookings
    .filter((b) => b.status === "COMPLETED")
    .reduce((sum, b) => sum + b.totalAmount, 0);

  const activeServices = services.filter((s) => s.active).length;

  const completedBookings = bookings.filter(
    (b) => b.status === "COMPLETED",
  ).length;

  // Status distribution
  const statusCounts = bookings.reduce(
    (acc, booking) => {
      const status = booking.status as BookingStatus;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {} as Record<BookingStatus, number>,
  );

  const statusLabels: Record<BookingStatus, string> = {
    PENDING: "Pendientes",
    CONFIRMED: "Confirmadas",
    IN_PROGRESS: "En curso",
    COMPLETED: "Completadas",
    CANCELLED: "Canceladas",
  };

  const statusColors: Record<BookingStatus, string> = {
    PENDING: "bg-yellow-500 dark:bg-yellow-600",
    CONFIRMED: "bg-blue-500 dark:bg-blue-600",
    IN_PROGRESS: "bg-purple-500 dark:bg-purple-600",
    COMPLETED: "bg-green-500 dark:bg-green-600",
    CANCELLED: "bg-red-500 dark:bg-red-600",
  };

  // Top services
  const serviceCounts = bookings.reduce(
    (acc, booking) => {
      const serviceId = booking.service.id;
      const serviceName = booking.service.name;
      if (!acc[serviceId]) {
        acc[serviceId] = { name: serviceName, count: 0 };
      }
      acc[serviceId].count++;
      return acc;
    },
    {} as Record<string, { name: string; count: number }>,
  );

  const topServices = Object.values(serviceCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const currencyFormatter = new Intl.NumberFormat("es-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return (
    <div className="grid gap-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-brisa-50 m-0">
        Dashboard de Métricas
      </h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-brisa-800/60 border border-gray-200 dark:border-brisa-300/20">
          <div className="flex flex-col gap-2">
            <span className="text-sm text-gray-600 dark:text-brisa-400">
              Total Reservas
            </span>
            <span className="text-3xl font-bold text-gray-900 dark:text-brisa-50">
              {bookings.length}
            </span>
            <span className="text-xs text-gray-500 dark:text-brisa-300">
              {completedBookings} completadas
            </span>
          </div>
        </Card>

        <Card className="bg-white dark:bg-brisa-800/60 border border-gray-200 dark:border-brisa-300/20">
          <div className="flex flex-col gap-2">
            <span className="text-sm text-gray-600 dark:text-brisa-400">
              Ingresos Totales
            </span>
            <span className="text-3xl font-bold text-green-600 dark:text-green-400">
              {currencyFormatter.format(totalRevenue)}
            </span>
            <span className="text-xs text-gray-500 dark:text-brisa-300">
              De reservas completadas
            </span>
          </div>
        </Card>

        <Card className="bg-white dark:bg-brisa-800/60 border border-gray-200 dark:border-brisa-300/20">
          <div className="flex flex-col gap-2">
            <span className="text-sm text-gray-600 dark:text-brisa-400">
              Servicios Activos
            </span>
            <span className="text-3xl font-bold text-gray-900 dark:text-brisa-50">
              {activeServices}
            </span>
            <span className="text-xs text-gray-500 dark:text-brisa-300">
              De {services.length} totales
            </span>
          </div>
        </Card>

        <Card className="bg-white dark:bg-brisa-800/60 border border-gray-200 dark:border-brisa-300/20">
          <div className="flex flex-col gap-2">
            <span className="text-sm text-gray-600 dark:text-brisa-400">
              Clientes
            </span>
            <span className="text-3xl font-bold text-gray-900 dark:text-brisa-50">
              {customersCount}
            </span>
            <span className="text-xs text-gray-500 dark:text-brisa-300">
              Clientes registrados
            </span>
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card
          title="Distribución por Estado"
          className="bg-white dark:bg-brisa-800/60 border border-gray-200 dark:border-brisa-300/20"
        >
          <div className="flex flex-col gap-3">
            {(Object.keys(statusLabels) as BookingStatus[]).map((status) => {
              const count = statusCounts[status] || 0;
              const percentage =
                bookings.length > 0
                  ? ((count / bookings.length) * 100).toFixed(1)
                  : "0";

              return (
                <div key={status} className="flex flex-col gap-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700 dark:text-brisa-200">
                      {statusLabels[status]}
                    </span>
                    <span className="text-gray-600 dark:text-brisa-300 font-medium">
                      {count} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-brisa-900 rounded-full h-2">
                    <div
                      className={`${statusColors[status]} h-2 rounded-full transition-all duration-300`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Top Services */}
        <Card
          title="Servicios Más Solicitados"
          className="bg-white dark:bg-brisa-800/60 border border-gray-200 dark:border-brisa-300/20"
        >
          {topServices.length === 0 ? (
            <p className="text-gray-600 dark:text-brisa-300 text-sm">
              No hay datos de servicios disponibles.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {topServices.map((service, index) => {
                const maxCount = topServices[0].count;
                const percentage = ((service.count / maxCount) * 100).toFixed(
                  1,
                );

                return (
                  <div key={service.name} className="flex flex-col gap-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700 dark:text-brisa-200 flex items-center gap-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brisa-400 dark:bg-brisa-500 text-white text-xs font-bold">
                          {index + 1}
                        </span>
                        {service.name}
                      </span>
                      <span className="text-gray-600 dark:text-brisa-300 font-medium">
                        {service.count} reservas
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-brisa-900 rounded-full h-2">
                      <div
                        className="bg-brisa-400 dark:bg-brisa-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
