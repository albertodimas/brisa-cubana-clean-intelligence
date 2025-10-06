"use client";

import { useEffect, useState, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventClickArg, DateSelectArg } from "@fullcalendar/core";
import { Badge, Button, Card } from "@brisa/ui";
import { Calendar, Clock, User, MapPin } from "lucide-react";

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  extendedProps: {
    status: string;
    paymentStatus: string;
    serviceName: string;
    propertyName: string;
    propertyAddress: string;
    clientName?: string;
    clientEmail?: string;
    totalPrice: number;
    notes?: string;
  };
}

interface BookingDetail {
  id: string;
  serviceName: string;
  propertyName: string;
  propertyAddress: string;
  clientName?: string;
  clientEmail?: string;
  scheduledAt: string;
  status: string;
  paymentStatus?: string;
  totalPrice: number;
  notes?: string;
}

function getEventColor(status: string): {
  backgroundColor: string;
  borderColor: string;
} {
  switch (status) {
    case "CONFIRMED":
      return { backgroundColor: "#14b8a6", borderColor: "#0d9488" };
    case "PENDING":
      return { backgroundColor: "#f59e0b", borderColor: "#d97706" };
    case "IN_PROGRESS":
      return { backgroundColor: "#3b82f6", borderColor: "#2563eb" };
    case "COMPLETED":
      return { backgroundColor: "#10b981", borderColor: "#059669" };
    case "CANCELLED":
      return { backgroundColor: "#6b7280", borderColor: "#4b5563" };
    default:
      return { backgroundColor: "#6b7280", borderColor: "#4b5563" };
  }
}

export function CalendarView() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<BookingDetail | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const apiBase =
        process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
      const response = await fetch(`${apiBase}/api/bookings?pageSize=100`, {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch bookings");
      }

      const data = (await response.json()) as {
        bookings: Array<{
          id: string;
          scheduledAt: string;
          status: string;
          paymentStatus?: string;
          totalPrice: number;
          notes?: string;
          service: { name: string; duration: number };
          property: { name: string; address: string };
          user: { name: string | null; email: string };
        }>;
      };

      const calendarEvents: CalendarEvent[] = data.bookings.map((booking) => {
        const colors = getEventColor(booking.status);
        const scheduledDate = new Date(booking.scheduledAt);
        const endDate = new Date(
          scheduledDate.getTime() + booking.service.duration * 60000,
        );

        return {
          id: booking.id,
          title: `${booking.service.name} - ${booking.property.name}`,
          start: scheduledDate.toISOString(),
          end: endDate.toISOString(),
          backgroundColor: colors.backgroundColor,
          borderColor: colors.borderColor,
          extendedProps: {
            status: booking.status,
            paymentStatus: booking.paymentStatus ?? "PENDING_PAYMENT",
            serviceName: booking.service.name,
            propertyName: booking.property.name,
            propertyAddress: booking.property.address,
            clientName: booking.user.name ?? undefined,
            clientEmail: booking.user.email,
            totalPrice: Number(booking.totalPrice),
            notes: booking.notes ?? undefined,
          },
        };
      });

      setEvents(calendarEvents);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setError(err instanceof Error ? err.message : "Error al cargar reservas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchBookings();
  }, [fetchBookings]);

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = clickInfo.event;
    const props = event.extendedProps as CalendarEvent["extendedProps"];

    setSelectedBooking({
      id: event.id,
      serviceName: props.serviceName,
      propertyName: props.propertyName,
      propertyAddress: props.propertyAddress,
      clientName: props.clientName,
      clientEmail: props.clientEmail,
      scheduledAt: event.start?.toISOString() ?? "",
      status: props.status,
      paymentStatus: props.paymentStatus,
      totalPrice: props.totalPrice,
      notes: props.notes,
    });
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    // Future: Open modal to create new booking
    console.log("Selected date range:", selectInfo.startStr, selectInfo.endStr);
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Calendar className="mx-auto h-12 w-12 animate-pulse text-teal-400" />
          <p className="mt-4 text-sm text-neutral-400">
            Cargando calendario...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card
        title="Error al cargar calendario"
        description={error}
        className="border-rose-400/40 bg-rose-500/10"
      >
        <Button intent="secondary" onClick={() => void fetchBookings()}>
          Reintentar
        </Button>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      {/* Calendar */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-lg">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          events={events}
          eventClick={handleEventClick}
          select={handleDateSelect}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          height="auto"
          locale="es"
          buttonText={{
            today: "Hoy",
            month: "Mes",
            week: "Semana",
            day: "Día",
          }}
        />
      </div>

      {/* Booking Details Sidebar */}
      <div className="flex flex-col gap-4">
        {/* Legend */}
        <Card title="Estados" className="rounded-2xl">
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-[#14b8a6]" />
              <span className="text-neutral-300">Confirmado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-[#f59e0b]" />
              <span className="text-neutral-300">Pendiente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-[#3b82f6]" />
              <span className="text-neutral-300">En progreso</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-[#10b981]" />
              <span className="text-neutral-300">Completado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-[#6b7280]" />
              <span className="text-neutral-300">Cancelado</span>
            </div>
          </div>
        </Card>

        {/* Selected Booking Details */}
        {selectedBooking ? (
          <Card
            title="Detalles de reserva"
            className="rounded-2xl border-teal-400/30 bg-teal-500/5"
          >
            <div className="flex flex-col gap-4 text-sm">
              <div>
                <div className="flex items-center gap-2 text-white">
                  <Calendar className="h-4 w-4 text-teal-400" />
                  <span className="font-semibold">
                    {selectedBooking.serviceName}
                  </span>
                </div>
                <p className="mt-1 text-xs text-neutral-400">
                  {new Date(selectedBooking.scheduledAt).toLocaleString(
                    "es-US",
                    {
                      dateStyle: "full",
                      timeStyle: "short",
                    },
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  tone={
                    selectedBooking.status === "CONFIRMED" ||
                    selectedBooking.status === "COMPLETED"
                      ? "teal"
                      : "neutral"
                  }
                >
                  {selectedBooking.status}
                </Badge>
                {selectedBooking.paymentStatus && (
                  <Badge
                    tone={
                      selectedBooking.paymentStatus === "PAID"
                        ? "teal"
                        : "sunset"
                    }
                  >
                    {selectedBooking.paymentStatus}
                  </Badge>
                )}
              </div>

              <div className="space-y-2 text-neutral-300">
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 text-neutral-500" />
                  <div>
                    <p className="font-medium">
                      {selectedBooking.propertyName}
                    </p>
                    <p className="text-xs text-neutral-400">
                      {selectedBooking.propertyAddress}
                    </p>
                  </div>
                </div>

                {selectedBooking.clientEmail && (
                  <div className="flex items-start gap-2">
                    <User className="mt-0.5 h-4 w-4 text-neutral-500" />
                    <div>
                      <p className="font-medium">
                        {selectedBooking.clientName ?? "Cliente"}
                      </p>
                      <p className="text-xs text-neutral-400">
                        {selectedBooking.clientEmail}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  <span className="text-xs uppercase tracking-wider text-neutral-400">
                    Total
                  </span>
                  <span className="font-semibold text-white">
                    $
                    {selectedBooking.totalPrice.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>

                {selectedBooking.notes && (
                  <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <p className="text-xs uppercase tracking-wider text-neutral-500">
                      Notas
                    </p>
                    <p className="mt-1 text-sm text-neutral-300">
                      {selectedBooking.notes}
                    </p>
                  </div>
                )}
              </div>

              <Button
                as="a"
                href={`/dashboard?highlight=${selectedBooking.id}`}
                intent="secondary"
                className="w-full"
              >
                Ver en dashboard
              </Button>
            </div>
          </Card>
        ) : (
          <Card
            title="Selecciona una reserva"
            description="Haz clic en cualquier evento del calendario para ver sus detalles."
            className="rounded-2xl"
          >
            <div className="flex items-center justify-center py-8">
              <Clock className="h-12 w-12 text-neutral-600" />
            </div>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="flex flex-col gap-2">
          <Button
            as="a"
            href="/dashboard"
            intent="ghost"
            className="w-full text-sm"
          >
            Volver al dashboard
          </Button>
          <Button
            intent="ghost"
            onClick={() => void fetchBookings()}
            className="w-full text-sm"
          >
            Refrescar calendario
          </Button>
        </div>
      </div>
    </div>
  );
}
