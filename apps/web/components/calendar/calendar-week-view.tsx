"use client";

import { useState, useMemo } from "react";
import { useCalendar, type CalendarBooking } from "@/hooks/use-calendar";
import { Skeleton } from "../ui/skeleton";

type CalendarWeekViewProps = {
  onBookingClick?: (booking: CalendarBooking) => void;
  initialDate?: Date;
  filters?: {
    status?: string;
    propertyId?: string;
    serviceId?: string;
    assignedStaffId?: string;
  };
  refreshToken?: number;
};

const DAYS_OF_WEEK = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

const STATUS_COLORS: Record<string, string> = {
  PENDING:
    "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700",
  CONFIRMED:
    "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700",
  IN_PROGRESS:
    "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-700",
  COMPLETED:
    "bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700",
  CANCELLED:
    "bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-200 dark:border-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmada",
  IN_PROGRESS: "En curso",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
};

// Utility: Get start of week (Sunday)
function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}

// Utility: Get end of week (Saturday)
function getEndOfWeek(date: Date): Date {
  const start = getStartOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return end;
}

export function CalendarWeekView({
  onBookingClick,
  initialDate = new Date(),
  filters,
  refreshToken = 0,
}: CalendarWeekViewProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(
    getStartOfWeek(initialDate),
  );

  // Calculate date range for the week
  const { from, to } = useMemo(() => {
    const weekStart = new Date(currentWeekStart);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = getEndOfWeek(currentWeekStart);
    weekEnd.setHours(23, 59, 59, 999);

    return {
      from: weekStart,
      to: weekEnd,
    };
  }, [currentWeekStart]);

  const { data, isLoading, error } = useCalendar({
    from,
    to,
    ...filters,
    refreshToken,
  });

  // Generate week days
  const weekDays = useMemo(() => {
    const days: Array<{
      date: Date;
      dateKey: string;
      dayName: string;
      isToday: boolean;
      bookings: CalendarBooking[];
    }> = [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      const dateKey = date.toISOString().split("T")[0] || "";
      const isToday = date.getTime() === today.getTime();

      days.push({
        date,
        dateKey,
        dayName: DAYS_OF_WEEK[date.getDay()],
        isToday,
        bookings: data?.bookingsByDate[dateKey] || [],
      });
    }

    return days;
  }, [currentWeekStart, data]);

  const handlePreviousWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() - 7);
    setCurrentWeekStart(newStart);
  };

  const handleNextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + 7);
    setCurrentWeekStart(newStart);
  };

  const handleToday = () => {
    setCurrentWeekStart(getStartOfWeek(new Date()));
  };

  const weekRange = `${currentWeekStart.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  })} - ${getEndOfWeek(currentWeekStart).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
        <p className="text-sm text-red-800 dark:text-red-200">
          Error al cargar el calendario: {error}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {weekRange}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={handleToday}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-brisa-700 dark:bg-brisa-900 dark:text-brisa-200 dark:hover:bg-brisa-800"
          >
            Hoy
          </button>
          <button
            onClick={handlePreviousWeek}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-700 hover:bg-gray-50 dark:border-brisa-700 dark:bg-brisa-900 dark:text-brisa-200 dark:hover:bg-brisa-800"
            aria-label="Semana anterior"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={handleNextWeek}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-700 hover:bg-gray-50 dark:border-brisa-700 dark:bg-brisa-900 dark:text-brisa-200 dark:hover:bg-brisa-800"
            aria-label="Semana siguiente"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      {data && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-brisa-700 dark:bg-brisa-900">
            <p className="text-sm text-gray-600 dark:text-brisa-300">
              Reservas esta Semana
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {data.summary.totalBookings}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-brisa-700 dark:bg-brisa-900">
            <p className="text-sm text-gray-600 dark:text-brisa-300">
              Confirmadas
            </p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {data.summary.statusCounts.CONFIRMED || 0}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-brisa-700 dark:bg-brisa-900">
            <p className="text-sm text-gray-600 dark:text-brisa-300">
              Ingresos
            </p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              ${data.summary.totalRevenue}
            </p>
          </div>
        </div>
      )}

      {/* Week Grid */}
      <div className="grid gap-4 lg:grid-cols-7">
        {isLoading
          ? Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg border border-gray-200 bg-white p-4 dark:border-brisa-700 dark:bg-brisa-900"
              >
                <Skeleton className="mb-2 h-6 w-24" />
                <Skeleton className="mb-2 h-4 w-16" />
                <Skeleton className="mb-2 h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ))
          : weekDays.map((day) => (
              <div
                key={day.dateKey}
                data-testid="calendar-week-gridcell"
                data-date-key={day.dateKey}
                className={`min-h-96 rounded-lg border p-4 ${
                  day.isToday
                    ? "border-blue-400 bg-blue-50 dark:border-blue-600 dark:bg-blue-950"
                    : "border-gray-200 bg-white dark:border-brisa-700 dark:bg-brisa-900"
                }`}
              >
                {/* Day Header */}
                <div className="mb-4 border-b border-gray-200 pb-2 dark:border-brisa-700">
                  <p className="text-sm font-medium text-gray-600 dark:text-brisa-300">
                    {day.dayName}
                  </p>
                  <p
                    className={`text-2xl font-bold ${
                      day.isToday
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-900 dark:text-white"
                    }`}
                  >
                    {day.date.getDate()}
                  </p>
                  {day.bookings.length > 0 && (
                    <p className="text-xs text-gray-500 dark:text-brisa-400">
                      {day.bookings.length}{" "}
                      {day.bookings.length === 1 ? "reserva" : "reservas"}
                    </p>
                  )}
                </div>

                {/* Bookings List */}
                <div className="space-y-2">
                  {day.bookings.length === 0 ? (
                    <p className="text-sm text-gray-400 dark:text-brisa-500">
                      Sin reservas
                    </p>
                  ) : (
                    day.bookings.map((booking) => {
                      const scheduledTime = new Date(
                        booking.scheduledAt,
                      ).toLocaleTimeString("es-ES", {
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                      return (
                        <button
                          key={booking.id}
                          data-booking-id={booking.id}
                          data-booking-status={booking.status}
                          onClick={() => onBookingClick?.(booking)}
                          className={`w-full rounded-lg border p-3 text-left transition-all hover:shadow-md ${
                            STATUS_COLORS[booking.status] ||
                            STATUS_COLORS.PENDING
                          }`}
                        >
                          {/* Time */}
                          <p className="mb-1 text-xs font-semibold">
                            {scheduledTime}
                          </p>

                          {/* Service Name */}
                          <p className="mb-1 truncate font-medium">
                            {booking.service.name}
                          </p>

                          {/* Property */}
                          <p className="mb-1 truncate text-xs opacity-90">
                            📍 {booking.property.label}
                          </p>

                          {/* Customer */}
                          <p className="mb-1 truncate text-xs opacity-90">
                            👤{" "}
                            {booking.customer.fullName ||
                              booking.customer.email}
                          </p>

                          {/* Status Badge */}
                          <span className="mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium opacity-75">
                            {STATUS_LABELS[booking.status] || booking.status}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}
