import { redirect } from "next/navigation";
import { Badge, Button, Card, Section } from "@brisa/ui";
import { auth } from "@/server/auth/config";
import { Calendar, MapPin, DollarSign, Clock, Plus } from "lucide-react";
import type { Booking } from "@/types/api";

async function getBookings(accessToken: string): Promise<Booking[]> {
  const API_BASE_URL =
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:3001";

  const response = await fetch(`${API_BASE_URL}/api/bookings`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch bookings");
  }

  return response.json();
}

const statusLabels: Record<string, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmada",
  IN_PROGRESS: "En Progreso",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
};

const statusTones: Record<string, "teal" | "neutral" | "sunset"> = {
  PENDING: "sunset",
  CONFIRMED: "teal",
  IN_PROGRESS: "teal",
  COMPLETED: "neutral",
  CANCELLED: "sunset",
};

const paymentStatusLabels: Record<string, string> = {
  PENDING_PAYMENT: "Pago Pendiente",
  PAID: "Pagado",
  FAILED: "Fallido",
  REFUNDED: "Reembolsado",
};

const currencyFormatter = new Intl.NumberFormat("es-US", {
  style: "currency",
  currency: "USD",
});

const datetimeFormatter = new Intl.DateTimeFormat("es-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function BookingsPage() {
  const session = await auth();

  if (!session?.user || !session.user.accessToken) {
    redirect("/auth/signin");
  }

  const bookings = await getBookings(session.user.accessToken);
  const hasBookings = bookings.length > 0;

  // Group bookings by status
  const upcoming = bookings.filter(
    (b) => b.status === "CONFIRMED" || b.status === "PENDING",
  );
  const inProgress = bookings.filter((b) => b.status === "IN_PROGRESS");
  const completed = bookings.filter((b) => b.status === "COMPLETED");
  const cancelled = bookings.filter((b) => b.status === "CANCELLED");

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 py-16 text-neutral-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-teal-300">
            Brisa Cubana · Reservas
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-white">
            Mis Reservas
          </h1>
          <p className="text-sm text-neutral-400">
            Gestiona todas tus reservas de servicios de limpieza
          </p>
        </div>
        <Button intent="primary" as="a" href="/dashboard/bookings/new">
          <Plus className="h-4 w-4" />
          Nueva Reserva
        </Button>
      </div>

      {hasBookings ? (
        <>
          {upcoming.length > 0 && (
            <Section
              title="Próximas Reservas"
              description={`${upcoming.length} ${upcoming.length === 1 ? "servicio" : "servicios"} confirmado${upcoming.length === 1 ? "" : "s"} o pendiente${upcoming.length === 1 ? "" : "s"}`}
            >
              <div className="grid gap-4 lg:grid-cols-2">
                {upcoming.map((booking) => (
                  <Card
                    key={booking.id}
                    className="group relative overflow-hidden transition hover:border-teal-500/50"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-white">
                          {booking.service.name}
                        </h3>
                        <Badge
                          tone={statusTones[booking.status]}
                          className="mt-2"
                        >
                          {statusLabels[booking.status]}
                        </Badge>
                      </div>
                      <span className="text-lg font-bold text-teal-300">
                        {currencyFormatter.format(
                          parseFloat(booking.totalPrice),
                        )}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2 text-sm text-neutral-300">
                      <p className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-neutral-500" />
                        {datetimeFormatter.format(
                          new Date(booking.scheduledAt),
                        )}
                      </p>
                      <p className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-neutral-500" />
                        {booking.property.name}
                      </p>
                      <p className="text-xs text-neutral-400 pl-6">
                        {booking.property.address}
                      </p>
                      <p className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-neutral-500" />
                        {booking.service.duration} minutos
                      </p>
                      <p className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-neutral-500" />
                        {paymentStatusLabels[booking.paymentStatus]}
                      </p>
                    </div>

                    <div className="mt-6 flex gap-2">
                      <Button
                        intent="ghost"
                        as="a"
                        href={`/dashboard/bookings/${booking.id}`}
                      >
                        Ver detalles
                      </Button>
                      {booking.status === "PENDING" && (
                        <Button
                          intent="secondary"
                          as="a"
                          href={`/dashboard/bookings/${booking.id}/cancel`}
                        >
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </Section>
          )}

          {inProgress.length > 0 && (
            <Section
              title="En Progreso"
              description={`${inProgress.length} ${inProgress.length === 1 ? "servicio" : "servicios"} actualmente en ejecución`}
            >
              <div className="grid gap-4 lg:grid-cols-2">
                {inProgress.map((booking) => (
                  <Card
                    key={booking.id}
                    className="border-teal-500/50 bg-teal-500/5"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-white">
                          {booking.service.name}
                        </h3>
                        <Badge tone="teal" className="mt-2">
                          {statusLabels[booking.status]}
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2 text-sm text-neutral-300">
                      <p className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-neutral-500" />
                        {booking.property.name}
                      </p>
                      <p className="text-xs text-neutral-400 pl-6">
                        Iniciado:{" "}
                        {datetimeFormatter.format(
                          new Date(booking.scheduledAt),
                        )}
                      </p>
                    </div>

                    <div className="mt-6">
                      <Button
                        intent="primary"
                        as="a"
                        href={`/dashboard/bookings/${booking.id}`}
                      >
                        Ver progreso
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </Section>
          )}

          {completed.length > 0 && (
            <Section
              title="Completadas"
              description={`${completed.length} ${completed.length === 1 ? "servicio completado" : "servicios completados"}`}
            >
              <div className="grid gap-4 lg:grid-cols-3">
                {completed.slice(0, 6).map((booking) => (
                  <Card
                    key={booking.id}
                    className="text-sm opacity-75 hover:opacity-100 transition"
                  >
                    <h3 className="font-semibold text-white text-sm">
                      {booking.service.name}
                    </h3>
                    <p className="text-xs text-neutral-400 mt-1">
                      {booking.completedAt
                        ? new Date(booking.completedAt).toLocaleDateString(
                            "es-US",
                          )
                        : "Sin fecha"}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">
                      {booking.property.name}
                    </p>
                    <div className="mt-4">
                      <Button
                        intent="ghost"
                        as="a"
                        href={`/dashboard/bookings/${booking.id}`}
                      >
                        Ver reporte
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
              {completed.length > 6 && (
                <p className="text-xs text-neutral-400 text-center mt-4">
                  Mostrando 6 de {completed.length} reservas completadas
                </p>
              )}
            </Section>
          )}

          {cancelled.length > 0 && (
            <Section
              title="Canceladas"
              description={`${cancelled.length} ${cancelled.length === 1 ? "reserva cancelada" : "reservas canceladas"}`}
            >
              <div className="grid gap-4 lg:grid-cols-3">
                {cancelled.slice(0, 6).map((booking) => (
                  <Card
                    key={booking.id}
                    className="text-sm opacity-60 hover:opacity-80 transition border-neutral-700/50"
                  >
                    <h3 className="font-semibold text-neutral-300 text-sm">
                      {booking.service.name}
                    </h3>
                    <p className="text-xs text-neutral-500 mt-1">
                      {new Date(booking.scheduledAt).toLocaleDateString(
                        "es-US",
                      )}
                    </p>
                    <Badge tone="sunset" className="mt-2">
                      Cancelada
                    </Badge>
                  </Card>
                ))}
              </div>
            </Section>
          )}
        </>
      ) : (
        <Card
          title="Aún no tienes reservas"
          description="Agenda tu primer servicio de limpieza desde el dashboard"
        >
          <div className="mt-6">
            <Button intent="primary" as="a" href="/dashboard">
              Ir al Dashboard
            </Button>
          </div>
        </Card>
      )}

      <div className="flex justify-center">
        <Button intent="ghost" as="a" href="/dashboard">
          ← Volver al Dashboard
        </Button>
      </div>
    </section>
  );
}
