"use client";

import { useEffect, useState } from "react";
import { Badge } from "@brisa/ui";
import { ActiveService } from "./active-service";

interface StaffWorkspaceProps {
  userName: string;
}

interface AssignedBooking {
  id: string;
  scheduledAt: string;
  status: string;
  totalPrice: number;
  serviceName: string;
  propertyName: string;
  propertyAddress: string;
  clientName?: string | null;
  clientEmail?: string;
  notes?: string | null;
}

export function StaffWorkspace({ userName }: StaffWorkspaceProps) {
  const [bookings, setBookings] = useState<AssignedBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] =
    useState<AssignedBooking | null>(null);

  useEffect(() => {
    async function loadBookings() {
      try {
        setLoading(true);
        const apiBase =
          process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
        const response = await fetch(`${apiBase}/api/bookings/mine`, {
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to load bookings");
        }

        const data = (await response.json()) as Array<{
          id: string;
          scheduledAt: string;
          status: string;
          totalPrice: string | number;
          notes?: string | null;
          service: { name: string };
          property: { name: string; address: string };
          user?: { name: string | null; email: string };
        }>;

        const mapped: AssignedBooking[] = data.map((booking) => ({
          id: booking.id,
          scheduledAt: booking.scheduledAt,
          status: booking.status,
          totalPrice:
            typeof booking.totalPrice === "string"
              ? Number.parseFloat(booking.totalPrice)
              : booking.totalPrice,
          serviceName: booking.service.name,
          propertyName: booking.property.name,
          propertyAddress: booking.property.address,
          clientName: booking.user?.name,
          clientEmail: booking.user?.email,
          notes: booking.notes,
        }));

        // Filter to show only active bookings (CONFIRMED or IN_PROGRESS)
        const active = mapped.filter(
          (b) => b.status === "CONFIRMED" || b.status === "IN_PROGRESS",
        );

        setBookings(active);
      } catch (error) {
        console.error("Error loading bookings", error);
      } finally {
        setLoading(false);
      }
    }

    void loadBookings();
  }, []);

  if (selectedBooking) {
    return (
      <ActiveService
        booking={selectedBooking}
        onBack={() => setSelectedBooking(null)}
        onComplete={() => {
          setSelectedBooking(null);
          // Remove completed booking from list
          setBookings((prev) =>
            prev.filter((b) => b.id !== selectedBooking.id),
          );
        }}
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.3em] text-teal-300">
          Brisa Cubana · Staff
        </p>
        <h1 className="text-3xl font-semibold text-white">Hola {userName}</h1>
        <p className="text-sm text-neutral-400">Servicios asignados para hoy</p>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] p-12">
          <p className="text-sm text-neutral-400">Cargando servicios...</p>
        </div>
      ) : null}

      {/* Empty State */}
      {!loading && bookings.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-12 text-center">
          <span className="text-4xl">🎉</span>
          <p className="text-lg font-semibold text-white">¡Todo completado!</p>
          <p className="text-sm text-neutral-400">
            No tienes servicios pendientes por el momento.
          </p>
        </div>
      ) : null}

      {/* Booking Cards */}
      {!loading && bookings.length > 0 ? (
        <div className="flex flex-col gap-4">
          {bookings.map((booking) => (
            <button
              type="button"
              key={booking.id}
              onClick={() => setSelectedBooking(booking)}
              className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-left transition hover:border-teal-400/40 hover:bg-white/[0.06] active:scale-[0.98]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-white">
                    {booking.serviceName}
                  </p>
                  <p className="mt-1 text-xs text-neutral-400">
                    {new Date(booking.scheduledAt).toLocaleString("es-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <Badge
                  tone={booking.status === "IN_PROGRESS" ? "sunset" : "teal"}
                >
                  {booking.status === "IN_PROGRESS" ? "EN CURSO" : "CONFIRMADO"}
                </Badge>
              </div>

              <div className="flex flex-col gap-1 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs">
                <p className="font-semibold text-white">
                  {booking.propertyName}
                </p>
                <p className="text-neutral-400">{booking.propertyAddress}</p>
              </div>

              {booking.clientName ? (
                <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">
                  Cliente: {booking.clientName}
                </p>
              ) : null}

              {booking.notes ? (
                <div className="rounded-xl border border-yellow-400/20 bg-yellow-500/10 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-200">
                    Nota importante
                  </p>
                  <p className="mt-1 text-sm text-yellow-100">
                    {booking.notes}
                  </p>
                </div>
              ) : null}

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                  Toca para iniciar
                </span>
                <span className="text-lg font-semibold text-teal-300">→</span>
              </div>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
