import { redirect } from "next/navigation";
import { Badge, Button, Card, Section } from "@brisa/ui";
import { auth } from "@/server/auth/config";
import { Calendar, MapPin, DollarSign, Plus } from "lucide-react";
import type { Booking } from "@/types/api";
import { isFakeDataEnabled } from "@/server/utils/fake";

async function getBookings(accessToken: string): Promise<Booking[]> {
  if (isFakeDataEnabled()) {
    const now = new Date().toISOString();
    return [
      {
        id: "fake-booking-1",
        userId: "fake-admin",
        propertyId: "fake-property-1",
        serviceId: "fake-service-1",
        scheduledAt: now,
        completedAt: null,
        status: "CONFIRMED" as const,
        totalPrice: "149.99",
        notes: null,
        paymentStatus: "PENDING_PAYMENT" as const,
        createdAt: now,
        updatedAt: now,
        service: {
          id: "fake-service-1",
          name: "Limpieza Profunda",
          duration: 180,
        },
        property: {
          id: "fake-property-1",
          name: "Brickell Luxury Apartment",
          address: "1234 Brickell Ave, Unit 2501",
        },
      },
      {
        id: "fake-booking-2",
        userId: "fake-admin",
        propertyId: "fake-property-2",
        serviceId: "fake-service-2",
        scheduledAt: new Date(
          Date.now() + 2 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        completedAt: null,
        status: "PENDING" as const,
        totalPrice: "119.99",
        notes: null,
        paymentStatus: "PENDING_PAYMENT" as const,
        createdAt: now,
        updatedAt: now,
        service: {
          id: "fake-service-2",
          name: "Turnover Vacation Rental",
          duration: 90,
        },
        property: {
          id: "fake-property-2",
          name: "Wynwood Vacation Rental",
          address: "567 NW 2nd Ave",
        },
      },
    ];
  }

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
                      <p className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-neutral-500" />
                        {paymentStatusLabels[booking.paymentStatus]}
                      </p>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button
                        intent="secondary"
                        as="a"
                        href={`/dashboard/bookings/${booking.id}`}
                        className="flex-1"
                      >
                        Ver Detalles
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </Section>
          )}

          {inProgress.length > 0 && (
            <Section
              title="En Progreso"
              description={`${inProgress.length} ${inProgress.length === 1 ? "servicio" : "servicios"} en proceso`}
            >
              <div className="grid gap-4 lg:grid-cols-2">
                {inProgress.map((booking) => (
                  <Card
                    key={booking.id}
                    className="border-teal-500/30 bg-teal-500/5"
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
                    </div>

                    <div className="mt-4">
                      <Button
                        intent="primary"
                        as="a"
                        href={`/dashboard/bookings/${booking.id}`}
                        className="w-full"
                      >
                        Ver Detalles
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
                {completed.map((booking) => (
                  <Card key={booking.id} className="bg-white/[0.02]">
                    <h4 className="font-semibold text-neutral-200">
                      {booking.service.name}
                    </h4>
                    <p className="mt-1 text-xs text-neutral-400">
                      {datetimeFormatter.format(new Date(booking.scheduledAt))}
                    </p>
                    <p className="mt-2 text-sm text-teal-300">
                      {currencyFormatter.format(parseFloat(booking.totalPrice))}
                    </p>
                    <Button
                      intent="ghost"
                      as="a"
                      href={`/dashboard/bookings/${booking.id}`}
                      className="mt-3 w-full"
                    >
                      Ver Detalles
                    </Button>
                  </Card>
                ))}
              </div>
            </Section>
          )}

          {cancelled.length > 0 && (
            <Section
              title="Canceladas"
              description={`${cancelled.length} ${cancelled.length === 1 ? "reserva cancelada" : "reservas canceladas"}`}
            >
              <div className="grid gap-4 lg:grid-cols-3">
                {cancelled.map((booking) => (
                  <Card
                    key={booking.id}
                    className="border-neutral-700 bg-neutral-900/30"
                  >
                    <h4 className="font-semibold text-neutral-400">
                      {booking.service.name}
                    </h4>
                    <p className="mt-1 text-xs text-neutral-500">
                      {datetimeFormatter.format(new Date(booking.scheduledAt))}
                    </p>
                    <Badge tone="neutral" className="mt-2">
                      Cancelada
                    </Badge>
                  </Card>
                ))}
              </div>
            </Section>
          )}
        </>
      ) : (
        <Card title="Sin reservas" description="Todavía no tienes reservas">
          <p className="text-sm text-neutral-300">
            Crea tu primera reserva para comenzar a gestionar tus servicios de
            limpieza.
          </p>
          <Button
            intent="primary"
            as="a"
            href="/dashboard/bookings/new"
            className="mt-4"
          >
            Crear Primera Reserva
          </Button>
        </Card>
      )}
    </section>
  );
}
