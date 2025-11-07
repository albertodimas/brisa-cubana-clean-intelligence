import { Suspense } from "react";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import {
  fetchPropertyById,
  fetchCustomerById,
  fetchBookingsPage,
} from "@/lib/api";
import { formatCurrency } from "@/lib/status-helpers";
import { Skeleton } from "@/components/ui";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PropertyDetailProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: PropertyDetailProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const property = await fetchPropertyById(id);
    return {
      title: `${property.label} · Propiedad · Brisa Cubana`,
      description: `Detalles de la propiedad ${property.label} en ${property.city}`,
    };
  } catch {
    return {
      title: "Propiedad no encontrada · Brisa Cubana",
    };
  }
}

async function PropertyDetailContent({ propertyId }: { propertyId: string }) {
  try {
    const property = await fetchPropertyById(propertyId);

    // Fetch owner and bookings in parallel
    const [owner, bookingsPage] = await Promise.all([
      property.owner?.id
        ? fetchCustomerById(property.owner.id)
        : Promise.resolve(null),
      fetchBookingsPage({ propertyId, limit: 20 }),
    ]);

    return (
      <div className="space-y-6">
        {/* Property Info Card */}
        <section className="rounded-2xl border border-gray-200 dark:border-brisa-800 bg-white dark:bg-brisa-900/60 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Información de la Propiedad
          </h2>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-brisa-300">
                Nombre
              </dt>
              <dd className="mt-1 text-base text-gray-900 dark:text-white">
                {property.label}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-brisa-300">
                Tipo
              </dt>
              <dd className="mt-1 text-base text-gray-900 dark:text-white">
                {property.type}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500 dark:text-brisa-300">
                Dirección
              </dt>
              <dd className="mt-1 text-base text-gray-900 dark:text-white">
                {property.addressLine}, {property.city}, {property.state}{" "}
                {property.zipCode}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-brisa-300">
                Habitaciones
              </dt>
              <dd className="mt-1 text-base text-gray-900 dark:text-white">
                {property.bedrooms}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-brisa-300">
                Baños
              </dt>
              <dd className="mt-1 text-base text-gray-900 dark:text-white">
                {property.bathrooms}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-brisa-300">
                Área (pies cuadrados)
              </dt>
              <dd className="mt-1 text-base text-gray-900 dark:text-white">
                {property.sqft ? `${property.sqft} sq ft` : "—"}
              </dd>
            </div>
            {property.notes && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500 dark:text-brisa-300">
                  Notas
                </dt>
                <dd className="mt-1 text-base text-gray-900 dark:text-white">
                  {property.notes}
                </dd>
              </div>
            )}
          </dl>
        </section>

        {/* Owner Info Card */}
        <section className="rounded-2xl border border-gray-200 dark:border-brisa-800 bg-white dark:bg-brisa-900/60 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Propietario
          </h2>
          {owner ? (
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-brisa-300">
                  Nombre completo
                </dt>
                <dd className="mt-1 text-base text-gray-900 dark:text-white">
                  {owner.fullName ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-brisa-300">
                  Email
                </dt>
                <dd className="mt-1 text-base text-gray-900 dark:text-white">
                  {owner.email}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <Link
                  href={{
                    pathname: "/panel/customers/[id]",
                    query: { id: owner.id },
                  }}
                  className="text-sm font-medium text-brisa-600 hover:text-brisa-700 dark:text-brisa-300 dark:hover:text-brisa-200"
                >
                  Ver detalles del cliente →
                </Link>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-gray-500 dark:text-brisa-300">
              Esta propiedad no tiene propietario asignado
            </p>
          )}
        </section>

        {/* Bookings */}
        <section className="rounded-2xl border border-gray-200 dark:border-brisa-800 bg-white dark:bg-brisa-900/60 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Reservas recientes ({bookingsPage.items.length})
          </h2>
          {bookingsPage.items.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-brisa-300">
              Esta propiedad no tiene reservas
            </p>
          ) : (
            <ul className="space-y-3">
              {bookingsPage.items.map((booking) => (
                <li
                  key={booking.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-brisa-700 hover:bg-gray-50 dark:hover:bg-brisa-800/50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {booking.code} - {booking.service.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-brisa-300">
                      {booking.customer?.fullName ??
                        booking.customer?.email ??
                        "Sin cliente"}{" "}
                      · {booking.status} ·{" "}
                      {new Date(booking.scheduledAt).toLocaleString("es-ES", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(Number(booking.totalAmount))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    );
  } catch (error) {
    console.error("Error loading property details:", error);
    notFound();
  }
}

function PropertyDetailFallback() {
  return (
    <div className="space-y-6">
      <Skeleton animation="wave" variant="rounded" className="h-64" />
      <Skeleton animation="wave" variant="rounded" className="h-32" />
      <Skeleton animation="wave" variant="rounded" className="h-64" />
    </div>
  );
}

export default async function PropertyDetailPage({
  params,
}: PropertyDetailProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-brisa-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center gap-4">
          <Link
            href="/panel"
            className="text-sm font-medium text-brisa-600 hover:text-brisa-700 dark:text-brisa-300 dark:hover:text-brisa-200"
          >
            ← Volver al panel
          </Link>
        </div>

        <Suspense fallback={<PropertyDetailFallback />}>
          <PropertyDetailContent propertyId={id} />
        </Suspense>
      </div>
    </main>
  );
}
