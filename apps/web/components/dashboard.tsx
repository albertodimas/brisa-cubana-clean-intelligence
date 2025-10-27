"use client";

import type { Booking, Service } from "@/lib/api";
import { DollarSign, Calendar, Briefcase, Users } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, KPICard, Badge } from "./ui";
import {
  type BookingStatus,
  getBookingStatusBadgeVariant,
  getBookingStatusLabel,
  formatCurrency,
} from "@/lib/status-helpers";

type DashboardProps = {
  bookings: Booking[];
  services: Service[];
  customersCount: number;
};

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

  return (
    <div className="grid gap-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-brisa-50 m-0">
        Dashboard de Métricas
      </h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Reservas"
          value={bookings.length}
          description={`${completedBookings} completadas`}
          icon={<Calendar className="w-5 h-5" />}
          cardVariant="elevated"
          hoverable
        />

        <KPICard
          title="Ingresos Totales"
          value={formatCurrency(totalRevenue)}
          description="De reservas completadas"
          icon={<DollarSign className="w-5 h-5" />}
          cardVariant="elevated"
          trend="up"
          hoverable
        />

        <KPICard
          title="Servicios Activos"
          value={activeServices}
          description={`De ${services.length} totales`}
          icon={<Briefcase className="w-5 h-5" />}
          cardVariant="elevated"
          hoverable
        />

        <KPICard
          title="Clientes"
          value={customersCount}
          description="Clientes registrados"
          icon={<Users className="w-5 h-5" />}
          cardVariant="elevated"
          hoverable
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card variant="default" padding="md">
          <CardHeader>
            <CardTitle className="text-lg">Distribución por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {(
                [
                  "PENDING",
                  "CONFIRMED",
                  "IN_PROGRESS",
                  "COMPLETED",
                  "CANCELLED",
                ] as BookingStatus[]
              ).map((status) => {
                const count = statusCounts[status] || 0;
                const percentage =
                  bookings.length > 0
                    ? ((count / bookings.length) * 100).toFixed(1)
                    : "0";

                return (
                  <div key={status} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-sm">
                      <Badge variant={getBookingStatusBadgeVariant(status)}>
                        {getBookingStatusLabel(status)}
                      </Badge>
                      <span className="text-gray-600 dark:text-brisa-300 font-medium">
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-brisa-900 rounded-full h-2">
                      <div
                        className="bg-brisa-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top Services */}
        <Card variant="default" padding="md">
          <CardHeader>
            <CardTitle className="text-lg">Servicios Más Solicitados</CardTitle>
          </CardHeader>
          <CardContent>
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
                    <div key={service.name} className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-700 dark:text-brisa-200 flex items-center gap-2">
                          <Badge variant="secondary" size="sm">
                            #{index + 1}
                          </Badge>
                          {service.name}
                        </span>
                        <span className="text-gray-600 dark:text-brisa-300 font-medium">
                          {service.count} reservas
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-brisa-900 rounded-full h-2">
                        <div
                          className="bg-brisa-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
