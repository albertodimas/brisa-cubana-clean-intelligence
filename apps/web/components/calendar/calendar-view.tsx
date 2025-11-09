"use client";

import { useState, useMemo } from "react";
import { useCalendar, type CalendarBooking } from "@/hooks/use-calendar";
import { useDragDrop } from "@/hooks/use-drag-drop";
import { Skeleton } from "../ui/skeleton";

type CalendarViewProps = {
  onBookingClick?: (booking: CalendarBooking) => void;
  onDateClick?: (date: string) => void;
  onBookingReschedule?: (
    bookingId: string,
    newDate: string,
    originalScheduledAt: string,
  ) => void;
  initialMonth?: Date;
  filters?: {
    status?: string;
    propertyId?: string;
    serviceId?: string;
    assignedStaffId?: string;
  };
  refreshToken?: number;
};

const DAYS_OF_WEEK = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

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

export function CalendarView({
  onBookingClick,
  onDateClick,
  onBookingReschedule,
  initialMonth = new Date(),
  filters,
  refreshToken = 0,
}: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const {
    state: dragState,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
  } = useDragDrop();

  // Calculate date range for the month
  const { from, to } = useMemo(() => {
    const firstDay = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1,
    );
    const lastDay = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0,
    );

    return {
      from: firstDay,
      to: lastDay,
    };
  }, [currentMonth]);

  const { data, isLoading, error } = useCalendar({
    from,
    to,
    ...filters,
    refreshToken,
  });

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    if (!data) return [];

    const firstDay = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1,
    );
    const lastDay = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0,
    );

    // Get the day of week for the first day (0 = Sunday, 6 = Saturday)
    const firstDayOfWeek = firstDay.getDay();

    // Calculate days to show from previous month
    const daysFromPrevMonth = firstDayOfWeek;

    // Calculate total days in current month
    const daysInMonth = lastDay.getDate();

    // Calculate days to show from next month to complete the grid
    const totalCells = Math.ceil((daysFromPrevMonth + daysInMonth) / 7) * 7;
    const daysFromNextMonth = totalCells - (daysFromPrevMonth + daysInMonth);

    const days: Array<{
      date: Date;
      dateKey: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      bookings: CalendarBooking[];
    }> = [];

    // Previous month days
    const prevMonthLastDay = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      0,
    );
    for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
      const date = new Date(prevMonthLastDay);
      date.setDate(prevMonthLastDay.getDate() - i);
      const dateKey = date.toISOString().split("T")[0] || "";

      days.push({
        date,
        dateKey,
        isCurrentMonth: false,
        isToday: false,
        bookings: data.bookingsByDate[dateKey] || [],
      });
    }

    // Current month days
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        i,
      );
      const dateKey = date.toISOString().split("T")[0] || "";
      const isToday = date.getTime() === today.getTime();

      days.push({
        date,
        dateKey,
        isCurrentMonth: true,
        isToday,
        bookings: data.bookingsByDate[dateKey] || [],
      });
    }

    // Next month days
    for (let i = 1; i <= daysFromNextMonth; i++) {
      const date = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        i,
      );
      const dateKey = date.toISOString().split("T")[0] || "";

      days.push({
        date,
        dateKey,
        isCurrentMonth: false,
        isToday: false,
        bookings: data.bookingsByDate[dateKey] || [],
      });
    }

    return days;
  }, [data, currentMonth]);

  const handlePreviousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1),
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1),
    );
  };

  const handleToday = () => {
    setCurrentMonth(new Date());
  };

  const monthName = currentMonth.toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });

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
        <h2 className="text-2xl font-bold capitalize text-gray-900 dark:text-white">
          {monthName}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={handleToday}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-brisa-700 dark:bg-brisa-900 dark:text-brisa-200 dark:hover:bg-brisa-800"
          >
            Hoy
          </button>
          <button
            onClick={handlePreviousMonth}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-700 hover:bg-gray-50 dark:border-brisa-700 dark:bg-brisa-900 dark:text-brisa-200 dark:hover:bg-brisa-800"
            aria-label="Mes anterior"
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
            onClick={handleNextMonth}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-700 hover:bg-gray-50 dark:border-brisa-700 dark:bg-brisa-900 dark:text-brisa-200 dark:hover:bg-brisa-800"
            aria-label="Mes siguiente"
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
              Total Reservas
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
              Ingresos del Mes
            </p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              ${data.summary.totalRevenue}
            </p>
          </div>
        </div>
      )}

      {/* Calendar Grid */}
      <div
        role="grid"
        aria-label="Calendario de reservas"
        data-testid="panel-calendar-grid"
        className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-brisa-700 dark:bg-brisa-900"
      >
        {/* Days of week header */}
        <div
          role="row"
          className="grid grid-cols-7 border-b border-gray-200 bg-gray-50 dark:border-brisa-700 dark:bg-brisa-800"
        >
          {DAYS_OF_WEEK.map((day) => (
            <div
              key={day}
              role="columnheader"
              className="border-r border-gray-200 px-2 py-2 text-center text-sm font-semibold text-gray-700 last:border-r-0 dark:border-brisa-700 dark:text-brisa-200"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        {isLoading ? (
          <div className="grid grid-cols-7">
            {Array.from({ length: 35 }).map((_, i) => (
              <div
                key={i}
                className="min-h-32 border-b border-r border-gray-200 p-2 last:border-r-0 dark:border-brisa-700"
              >
                <Skeleton className="mb-2 h-6 w-8" />
                <Skeleton className="mb-1 h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {calendarDays.map((day) => (
              <div
                key={day.dateKey}
                role="gridcell"
                data-testid="calendar-gridcell"
                data-date-key={day.dateKey}
                aria-label={`${day.date.toLocaleDateString("es-ES", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}${day.bookings.length > 0 ? `, ${day.bookings.length} reserva${day.bookings.length !== 1 ? "s" : ""}` : ""}`}
                className={`min-h-32 border-b border-r border-gray-200 p-2 last:border-r-0 dark:border-brisa-700 ${
                  !day.isCurrentMonth
                    ? "bg-gray-50 dark:bg-brisa-950"
                    : day.isToday
                      ? "bg-blue-50 dark:bg-blue-950"
                      : ""
                } ${onDateClick ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-brisa-800" : ""} ${
                  dragState.dropTargetId === day.dateKey && dragState.isDragging
                    ? "ring-2 ring-blue-500 ring-inset bg-blue-100 dark:bg-blue-900"
                    : ""
                }`}
                onClick={() => onDateClick?.(day.dateKey)}
                onDragOver={(e) => {
                  e.preventDefault();
                  handleDragOver(day.dateKey);
                }}
                onDragLeave={handleDragLeave}
                onDrop={(e) => {
                  e.preventDefault();
                  if (
                    dragState.draggedItemId &&
                    dragState.draggedItemData &&
                    onBookingReschedule
                  ) {
                    onBookingReschedule(
                      dragState.draggedItemId,
                      day.dateKey,
                      dragState.draggedItemData,
                    );
                  }
                  handleDragEnd();
                }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm font-medium ${
                      !day.isCurrentMonth
                        ? "text-gray-400 dark:text-brisa-500"
                        : day.isToday
                          ? "flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white"
                          : "text-gray-900 dark:text-white"
                    }`}
                  >
                    {day.date.getDate()}
                  </span>
                  {day.bookings.length > 0 && (
                    <span
                      data-testid="calendar-booking-count"
                      className="text-xs text-gray-500 dark:text-brisa-400"
                    >
                      {day.bookings.length}
                    </span>
                  )}
                </div>

                <div className="mt-1 space-y-1">
                  {day.bookings.slice(0, 3).map((booking) => (
                    <button
                      key={booking.id}
                      data-booking-id={booking.id}
                      data-booking-code={booking.code}
                      draggable={
                        onBookingReschedule !== undefined &&
                        booking.status !== "COMPLETED" &&
                        booking.status !== "CANCELLED"
                      }
                      onDragStart={(e) => {
                        e.stopPropagation();
                        handleDragStart(booking.id, booking.scheduledAt);
                      }}
                      onDragEnd={(e) => {
                        e.stopPropagation();
                        handleDragEnd();
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onBookingClick?.(booking);
                      }}
                      aria-label={`Reserva ${booking.service.name} a las ${new Date(
                        booking.scheduledAt,
                      ).toLocaleTimeString("es-ES", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`}
                      className={`w-full truncate rounded border px-1 py-0.5 text-left text-xs transition-colors hover:opacity-80 ${
                        STATUS_COLORS[booking.status] || STATUS_COLORS.PENDING
                      } ${
                        dragState.draggedItemId === booking.id
                          ? "opacity-50 cursor-grabbing"
                          : onBookingReschedule !== undefined &&
                              booking.status !== "COMPLETED" &&
                              booking.status !== "CANCELLED"
                            ? "cursor-grab"
                            : ""
                      }`}
                    >
                      {new Date(booking.scheduledAt).toLocaleTimeString(
                        "es-ES",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}{" "}
                      {booking.service.name}
                    </button>
                  ))}
                  {day.bookings.length > 3 && (
                    <div className="text-xs text-gray-500 dark:text-brisa-400">
                      +{day.bookings.length - 3} más
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div
        className="flex flex-wrap gap-4"
        data-testid="calendar-status-legend"
      >
        {Object.entries(STATUS_COLORS).map(([status, color]) => {
          const label =
            status === "PENDING"
              ? "Pendiente"
              : status === "CONFIRMED"
                ? "Confirmada"
                : status === "IN_PROGRESS"
                  ? "En curso"
                  : status === "COMPLETED"
                    ? "Completada"
                    : "Cancelada";

          return (
            <div
              key={status}
              className="flex items-center gap-2"
              data-testid={`calendar-status-legend-${status.toLowerCase()}`}
            >
              <div className={`h-3 w-3 rounded border ${color}`} />
              <span className="text-sm text-gray-600 dark:text-brisa-300">
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
