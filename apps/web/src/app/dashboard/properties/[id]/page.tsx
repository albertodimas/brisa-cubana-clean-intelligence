import { redirect } from "next/navigation";
import { Badge, Button, Card, Section } from "@brisa/ui";
import { auth } from "@/server/auth/config";
import {
  Home,
  Building2,
  MapPin,
  Bed,
  Bath,
  Calendar,
  Edit,
} from "lucide-react";
import type { Property } from "@/types/api";

interface PropertyWithBookings extends Property {
  bookings: Array<{
    id: string;
    scheduledAt: string;
    status: string;
    service: { name: string };
    totalPrice: string;
  }>;
}

async function getProperty(
  id: string,
  accessToken: string,
): Promise<PropertyWithBookings> {
  const API_BASE_URL =
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:3001";

  const response = await fetch(`${API_BASE_URL}/api/properties/${id}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch property");
  }

  return response.json();
}

const propertyTypeIcons: Record<string, typeof Home> = {
  RESIDENTIAL: Home,
  VACATION_RENTAL: MapPin,
  OFFICE: Building2,
  HOSPITALITY: Building2,
};

const propertyTypeLabels: Record<string, string> = {
  RESIDENTIAL: "Residencial",
  VACATION_RENTAL: "Renta Vacacional",
  OFFICE: "Oficina",
  HOSPITALITY: "Hospitalidad",
};

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

interface PropertyDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PropertyDetailPage({
  params,
}: PropertyDetailPageProps) {
  const session = await auth();

  if (!session?.user || !session.user.accessToken) {
    redirect("/auth/signin");
  }

  const { id } = await params;
  const property = await getProperty(id, session.user.accessToken);

  const Icon = propertyTypeIcons[property.type] ?? Home;
  const typeLabel = propertyTypeLabels[property.type] ?? property.type;

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 py-16 text-neutral-100">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-teal-300">
          Brisa Cubana · Propiedad
        </p>
        <div className="mt-3 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-semibold text-white">
              {property.name}
            </h1>
            <Badge tone="teal" className="mt-2">
              {typeLabel}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              intent="secondary"
              as="a"
              href={`/dashboard/properties/${property.id}/edit`}
            >
              <Edit className="h-4 w-4" />
              Editar
            </Button>
          </div>
        </div>
      </div>

      <Card title="Información de la Propiedad">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-medium text-neutral-400">Dirección</h3>
            <p className="mt-1 flex items-center gap-2 text-white">
              <MapPin className="h-4 w-4 text-teal-300" />
              {property.address}
            </p>
            <p className="mt-1 text-sm text-neutral-300">
              {property.city}, {property.state} {property.zipCode}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-neutral-400">Tipo</h3>
            <p className="mt-1 flex items-center gap-2 text-white">
              <Icon className="h-4 w-4 text-teal-300" />
              {typeLabel}
            </p>
          </div>

          {property.size && (
            <div>
              <h3 className="text-sm font-medium text-neutral-400">Tamaño</h3>
              <p className="mt-1 text-white">
                {property.size.toLocaleString()} ft²
              </p>
            </div>
          )}

          {(property.bedrooms !== null || property.bathrooms !== null) && (
            <div>
              <h3 className="text-sm font-medium text-neutral-400">
                Habitaciones
              </h3>
              <div className="mt-1 flex gap-4">
                {property.bedrooms !== null && (
                  <p className="flex items-center gap-1 text-white">
                    <Bed className="h-4 w-4 text-teal-300" />
                    {property.bedrooms}{" "}
                    {property.bedrooms === 1 ? "habitación" : "habitaciones"}
                  </p>
                )}
                {property.bathrooms !== null && (
                  <p className="flex items-center gap-1 text-white">
                    <Bath className="h-4 w-4 text-teal-300" />
                    {property.bathrooms}{" "}
                    {property.bathrooms === 1 ? "baño" : "baños"}
                  </p>
                )}
              </div>
            </div>
          )}

          {property.notes && (
            <div className="md:col-span-2">
              <h3 className="text-sm font-medium text-neutral-400">Notas</h3>
              <p className="mt-1 rounded-lg border border-neutral-800 bg-neutral-900/60 p-4 text-sm text-neutral-200">
                {property.notes}
              </p>
            </div>
          )}

          {property.user && (
            <div>
              <h3 className="text-sm font-medium text-neutral-400">
                Propietario
              </h3>
              <p className="mt-1 text-white">{property.user.name}</p>
              <p className="text-sm text-neutral-400">{property.user.email}</p>
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium text-neutral-400">Registrada</h3>
            <p className="mt-1 text-white">
              {new Date(property.createdAt).toLocaleDateString("es-ES", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
      </Card>

      <Section
        title={`Historial de Reservas (${property.bookings?.length ?? 0})`}
        description="Servicios agendados para esta propiedad"
      >
        {property.bookings && property.bookings.length > 0 ? (
          <div className="grid gap-4">
            {property.bookings.map((booking) => (
              <Card
                key={booking.id}
                className="group relative overflow-hidden transition hover:border-teal-500/50"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-white">
                      {booking.service.name}
                    </h4>
                    <p className="mt-1 flex items-center gap-2 text-sm text-neutral-400">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(booking.scheduledAt).toLocaleDateString(
                        "es-ES",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge tone={statusTones[booking.status] ?? "neutral"}>
                      {statusLabels[booking.status] ?? booking.status}
                    </Badge>
                    <p className="text-sm font-medium text-teal-300">
                      ${Number(booking.totalPrice).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <Button
                    intent="ghost"
                    as="a"
                    href={`/dashboard/bookings/${booking.id}`}
                  >
                    Ver detalles
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card
            title="No hay reservas registradas"
            description="Aún no se han agendado servicios para esta propiedad"
          >
            <div className="mt-4">
              <Button intent="primary" as="a" href="/dashboard/bookings/new">
                Agendar Servicio
              </Button>
            </div>
          </Card>
        )}
      </Section>

      <div className="flex justify-between">
        <Button intent="ghost" as="a" href="/dashboard/properties">
          ← Volver a Propiedades
        </Button>
      </div>
    </section>
  );
}
