import { redirect } from "next/navigation";
import { Badge, Button, Card, Section } from "@brisa/ui";
import { auth } from "@/server/auth/config";
import { Plus, MapPin, Home, Building2, Bed, Bath } from "lucide-react";
import type { Property } from "@/types/api";

async function getProperties(accessToken: string): Promise<Property[]> {
  const API_BASE_URL =
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:3001";

  const response = await fetch(`${API_BASE_URL}/api/properties`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch properties");
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

export default async function PropertiesPage() {
  const session = await auth();

  if (!session?.user || !session.user.accessToken) {
    redirect("/auth/signin");
  }

  const properties = await getProperties(session.user.accessToken);
  const hasProperties = properties.length > 0;

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 py-16 text-neutral-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-teal-300">
            Brisa Cubana · Propiedades
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-white">
            Mis Propiedades
          </h1>
          <p className="text-sm text-neutral-400">
            Gestiona las propiedades registradas para servicios de limpieza
          </p>
        </div>
        <Button intent="primary" as="a" href="/dashboard/properties/new">
          <Plus className="h-4 w-4" />
          Agregar Propiedad
        </Button>
      </div>

      {hasProperties ? (
        <Section
          title={`${properties.length} ${properties.length === 1 ? "Propiedad" : "Propiedades"}`}
          description="Listado completo de ubicaciones disponibles para agendar servicios"
        >
          <div className="grid gap-6 lg:grid-cols-2">
            {properties.map((property) => {
              const Icon = propertyTypeIcons[property.type] ?? Home;
              const typeLabel =
                propertyTypeLabels[property.type] ?? property.type;

              return (
                <Card
                  key={property.id}
                  className="group relative overflow-hidden transition hover:border-teal-500/50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-teal-500/20 p-2.5">
                        <Icon className="h-5 w-5 text-teal-300" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">
                          {property.name}
                        </h3>
                        <Badge tone="teal" className="mt-1">
                          {typeLabel}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-neutral-300">
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-neutral-500" />
                      {property.address}
                    </p>
                    <p className="text-xs text-neutral-400">
                      {property.city}, {property.state} {property.zipCode}
                    </p>
                  </div>

                  {(property.size ||
                    property.bedrooms ||
                    property.bathrooms) && (
                    <div className="mt-4 flex flex-wrap gap-4 text-xs text-neutral-400">
                      {property.size && (
                        <span>{property.size.toLocaleString()} ft²</span>
                      )}
                      {property.bedrooms !== undefined &&
                        property.bedrooms !== null && (
                          <span className="flex items-center gap-1">
                            <Bed className="h-3.5 w-3.5" />
                            {property.bedrooms}{" "}
                            {property.bedrooms === 1
                              ? "habitación"
                              : "habitaciones"}
                          </span>
                        )}
                      {property.bathrooms !== undefined &&
                        property.bathrooms !== null && (
                          <span className="flex items-center gap-1">
                            <Bath className="h-3.5 w-3.5" />
                            {property.bathrooms}{" "}
                            {property.bathrooms === 1 ? "baño" : "baños"}
                          </span>
                        )}
                    </div>
                  )}

                  {property._count?.bookings > 0 && (
                    <p className="mt-3 text-xs uppercase tracking-[0.2em] text-teal-300">
                      {property._count.bookings}{" "}
                      {property._count.bookings === 1 ? "reserva" : "reservas"}
                    </p>
                  )}

                  <div className="mt-6 flex gap-2">
                    <Button
                      intent="ghost"
                      size="sm"
                      as="a"
                      href={`/dashboard/properties/${property.id}`}
                    >
                      Ver detalles
                    </Button>
                    <Button
                      intent="secondary"
                      size="sm"
                      as="a"
                      href={`/dashboard/properties/${property.id}/edit`}
                    >
                      Editar
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </Section>
      ) : (
        <Card
          title="Aún no tienes propiedades registradas"
          description="Agrega tu primera propiedad para comenzar a agendar servicios de limpieza"
        >
          <div className="mt-6">
            <Button intent="primary" as="a" href="/dashboard/properties/new">
              <Plus className="h-4 w-4" />
              Registrar Primera Propiedad
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
