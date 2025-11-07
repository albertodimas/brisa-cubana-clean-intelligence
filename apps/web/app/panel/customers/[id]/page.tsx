import { Suspense } from "react";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import {
  fetchCustomerById,
  fetchPropertiesPage,
  fetchBookingsPage,
} from "@/lib/api";
import { formatCurrency } from "@/lib/status-helpers";
import { Skeleton } from "@/components/ui";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type CustomerDetailProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: CustomerDetailProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const customer = await fetchCustomerById(id);
    return {
      title: `${customer.fullName ?? customer.email} · Cliente · Brisa Cubana`,
      description: `Detalles del cliente ${customer.fullName ?? customer.email}`,
    };
  } catch {
    return {
      title: "Cliente no encontrado · Brisa Cubana",
    };
  }
}

async function CustomerDetailContent({ customerId }: { customerId: string }) {
  try {
    const customer = await fetchCustomerById(customerId);
    const [propertiesPage, bookingsPage] = await Promise.all([
      fetchPropertiesPage({ ownerId: customerId, limit: 50 }),
      fetchBookingsPage({ customerId, limit: 20 }),
    ]);

    return (
      <div className="space-y-6">
        {/* Customer Info Card */}
        <section className="rounded-2xl border border-gray-200 dark:border-brisa-800 bg-white dark:bg-brisa-900/60 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Información del Cliente
          </h2>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-brisa-300">
                Nombre completo
              </dt>
              <dd className="mt-1 text-base text-gray-900 dark:text-white">
                {customer.fullName ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-brisa-300">
                Email
              </dt>
              <dd className="mt-1 text-base text-gray-900 dark:text-white">
                {customer.email}
              </dd>
            </div>
          </dl>
        </section>

        {/* Properties */}
        <section className="rounded-2xl border border-gray-200 dark:border-brisa-800 bg-white dark:bg-brisa-900/60 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Propiedades ({propertiesPage.items.length})
          </h2>
          {propertiesPage.items.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-brisa-300">
              Este cliente no tiene propiedades registradas
            </p>
          ) : (
            <ul className="space-y-3">
              {propertiesPage.items.map((property) => (
                <li
                  key={property.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-brisa-700 hover:bg-gray-50 dark:hover:bg-brisa-800/50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {property.label}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-brisa-300">
                      {property.addressLine}, {property.city}, {property.state}{" "}
                      {property.zipCode}
                    </p>
                  </div>
                  <Link
                    href={{
                      pathname: "/panel/properties/[id]",
                      query: { id: property.id },
                    }}
                    className="text-sm font-medium text-brisa-600 hover:text-brisa-700 dark:text-brisa-300 dark:hover:text-brisa-200"
                  >
                    Ver detalles →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Bookings */}
        <section className="rounded-2xl border border-gray-200 dark:border-brisa-800 bg-white dark:bg-brisa-900/60 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Reservas recientes ({bookingsPage.items.length})
          </h2>
          {bookingsPage.items.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-brisa-300">
              Este cliente no tiene reservas
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
                      {booking.property.label} · {booking.status} ·{" "}
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
    console.error("Error loading customer details:", error);
    notFound();
  }
}

function CustomerDetailFallback() {
  return (
    <div className="space-y-6">
      <Skeleton animation="wave" variant="rounded" className="h-32" />
      <Skeleton animation="wave" variant="rounded" className="h-64" />
      <Skeleton animation="wave" variant="rounded" className="h-64" />
    </div>
  );
}

export default async function CustomerDetailPage({
  params,
}: CustomerDetailProps) {
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

        <Suspense fallback={<CustomerDetailFallback />}>
          <CustomerDetailContent customerId={id} />
        </Suspense>
      </div>
    </main>
  );
}
