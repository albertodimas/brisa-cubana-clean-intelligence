import { redirect } from "next/navigation";
import { Badge, Button, Card, Section } from "@brisa/ui";
import { auth } from "@/server/auth/config";
import { Calendar, MapPin, DollarSign, Clock, User } from "lucide-react";
import type { Booking } from "@/types/api";
import BookingActions from "../components/BookingActions";
import { isFakeDataEnabled } from "@/server/utils/fake";

interface BookingWithDetails extends Booking {
  service: {
    id: string;
    name: string;
    duration: number;
    description?: string;
  };
  property: {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  user: {
    id: string;
    email: string;
    name: string | null;
  };
}

async function getBooking(
  id: string,
  accessToken: string,
): Promise<BookingWithDetails> {
  const useFakeData =
    isFakeDataEnabled() ||
    accessToken.startsWith("fake.") ||
    id.startsWith("fake-");

  if (useFakeData) {
    const now = new Date().toISOString();
    return {
      id,
      userId: "fake-admin",
      propertyId: id.startsWith("fake-")
        ? id.replace("fake-", "prop-")
        : "fake-property-1",
      serviceId: "fake-service-1",
      scheduledAt: now,
      completedAt: null,
      status: "CONFIRMED",
      totalPrice: "149.99",
      notes: "Revisar terraza y reponer amenities",
      paymentStatus: "PENDING_PAYMENT",
      createdAt: now,
      updatedAt: now,
      service: {
        id: "fake-service-1",
        name: "Limpieza Profunda",
        duration: 180,
        description: "Limpieza detallada incluyendo áreas difíciles",
      },
      property: {
        id: "fake-property-1",
        name: "Brickell Luxury Apartment",
        address: "1234 Brickell Ave, Unit 2501",
        city: "Miami",
        state: "FL",
        zipCode: "33131",
      },
      user: {
        id: "fake-admin",
        email: "client@brisacubanaclean.com",
        name: "Client Demo",
      },
    } satisfies BookingWithDetails;
  }

  const API_BASE_URL =
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:3001";

  console.log("[bookings/[id]] fetching real booking", {
    tokenSample: accessToken.slice(0, 10),
    useFakeFlag: isFakeDataEnabled(),
  });

  const response = await fetch(`${API_BASE_URL}/api/bookings/${id}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch booking");
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

const paymentStatusTones: Record<string, "teal" | "neutral" | "sunset"> = {
  PENDING_PAYMENT: "sunset",
  PAID: "teal",
  FAILED: "sunset",
  REFUNDED: "neutral",
};

interface BookingDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function BookingDetailPage({
  params,
}: BookingDetailPageProps) {
  const session = await auth();

  if (!session?.user || !session.user.accessToken) {
    redirect("/auth/signin");
  }

  const { id } = await params;
  const booking = await getBooking(id, session.user.accessToken);

  const isAdmin = session.user.role === "ADMIN";
  const isStaff = session.user.role === "STAFF";
  const canManageStatus = isAdmin || isStaff;

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 py-16 text-neutral-100">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-teal-300">
          Brisa Cubana · Reserva
        </p>
        <div className="mt-3 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-semibold text-white">
              {booking.service.name}
            </h1>
            <div className="mt-2 flex gap-2">
              <Badge tone={statusTones[booking.status] ?? "neutral"}>
                {statusLabels[booking.status] ?? booking.status}
              </Badge>
              <Badge
                tone={paymentStatusTones[booking.paymentStatus] ?? "neutral"}
              >
                {paymentStatusLabels[booking.paymentStatus] ??
                  booking.paymentStatus}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Información del Servicio">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-neutral-400">Servicio</h3>
              <p className="mt-1 text-white">{booking.service.name}</p>
              {booking.service.description && (
                <p className="mt-1 text-sm text-neutral-400">
                  {booking.service.description}
                </p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-medium text-neutral-400">
                Fecha y Hora
              </h3>
              <p className="mt-1 flex items-center gap-2 text-white">
                <Calendar className="h-4 w-4 text-teal-300" />
                {new Date(booking.scheduledAt).toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-neutral-400">Duración</h3>
              <p className="mt-1 flex items-center gap-2 text-white">
                <Clock className="h-4 w-4 text-teal-300" />
                {booking.service.duration} minutos
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-neutral-400">
                Precio Total
              </h3>
              <p className="mt-1 flex items-center gap-2 text-white">
                <DollarSign className="h-4 w-4 text-teal-300" />$
                {Number(booking.totalPrice).toFixed(2)}
              </p>
            </div>

            {booking.completedAt && (
              <div>
                <h3 className="text-sm font-medium text-neutral-400">
                  Completada el
                </h3>
                <p className="mt-1 text-white">
                  {new Date(booking.completedAt).toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            )}
          </div>
        </Card>

        <Card title="Propiedad">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-neutral-400">Nombre</h3>
              <p className="mt-1 text-white">{booking.property.name}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-neutral-400">
                Dirección
              </h3>
              <p className="mt-1 flex items-start gap-2 text-white">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-300" />
                <span>
                  {booking.property.address}
                  <br />
                  {booking.property.city}, {booking.property.state}{" "}
                  {booking.property.zipCode}
                </span>
              </p>
            </div>

            <div className="pt-2">
              <Button
                intent="ghost"
                as="a"
                href={`/dashboard/properties/${booking.property.id}`}
              >
                Ver detalles de la propiedad
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {booking.user && (
        <Card title="Cliente">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-medium text-neutral-400">Nombre</h3>
              <p className="mt-1 flex items-center gap-2 text-white">
                <User className="h-4 w-4 text-teal-300" />
                {booking.user.name ?? "Sin nombre"}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-neutral-400">Email</h3>
              <p className="mt-1 text-white">{booking.user.email}</p>
            </div>
          </div>
        </Card>
      )}

      {booking.notes && (
        <Card title="Notas">
          <p className="text-neutral-300">{booking.notes}</p>
        </Card>
      )}

      {canManageStatus && (
        <Section
          title="Gestión de Estado"
          description="Actualiza el estado de la reserva"
        >
          <BookingActions
            bookingId={booking.id}
            currentStatus={booking.status}
            accessToken={session.user.accessToken}
          />
        </Section>
      )}

      <div className="flex justify-between">
        <Button intent="ghost" as="a" href="/dashboard/bookings">
          ← Volver a Reservas
        </Button>
      </div>
    </section>
  );
}
