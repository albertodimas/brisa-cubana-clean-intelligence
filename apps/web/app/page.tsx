import React from "react";
import Link from "next/link";
import { AdminPanel } from "@/components/admin-panel";
import { Dashboard } from "@/components/dashboard";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  createServiceAction,
  createPropertyAction,
  createBookingAction,
  toggleServiceActiveAction,
  updateServiceAction,
  updatePropertyAction,
  updateBookingAction,
  updateUserAction,
  toggleUserActiveAction,
  logoutAction,
} from "@/app/actions";
import {
  fetchServicesPage,
  fetchBookingsPage,
  fetchPropertiesPage,
  fetchCustomersPage,
  fetchUsersPage,
  fetchNotificationsPage,
  type PaginatedResult,
  type User,
  type Notification,
} from "@/lib/api";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const currencyFormatter = new Intl.NumberFormat("es-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("es-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function HomePage() {
  const session = await auth();
  const isAuthenticated = Boolean(session?.user);
  const currentRole = session?.user?.role;
  const isAdmin = currentRole === "ADMIN";
  const today = new Date();
  const from = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  ).toISOString();
  const horizon = new Date(
    today.getTime() + 1000 * 60 * 60 * 24 * 30,
  ).toISOString();
  const bookingFilterDefaults = {
    status: "ALL" as const,
    from,
    to: horizon,
  };

  const [servicesPage, bookingsPage, propertiesPage, customersPage] =
    await Promise.all([
      fetchServicesPage({ limit: 50 }),
      fetchBookingsPage({ from, to: horizon, limit: 10 }),
      fetchPropertiesPage({ limit: 50 }),
      fetchCustomersPage({ limit: 50 }),
    ]);

  const emptyUsersPage: PaginatedResult<User> = {
    items: [],
    pageInfo: { limit: 50, cursor: null, nextCursor: null, hasMore: false },
  };

  const emptyNotificationsPage: PaginatedResult<Notification> = {
    items: [],
    pageInfo: { limit: 10, cursor: null, nextCursor: null, hasMore: false },
  };

  const usersPage = isAdmin
    ? await fetchUsersPage({ limit: 50 })
    : emptyUsersPage;

  const notificationsPage = isAuthenticated
    ? await fetchNotificationsPage({ limit: 10 })
    : emptyNotificationsPage;

  const services = servicesPage.items;
  const bookings = bookingsPage.items;
  const properties = propertiesPage.items;
  const customers = customersPage.items;

  const activeServices = services
    .filter((service) => service.active)
    .slice(0, 4);
  const upcomingBookings = bookings.slice(0, 4);

  const sections = [
    {
      title: "Estado",
      body: `Stack reiniciado con API Hono + Prisma y frontend Next.js. Hay ${services.length} servicios configurados y ${bookings.length} reservas sembradas para pruebas end-to-end.`,
    },
    {
      title: "Siguientes pasos",
      body: "Consolidar sistema de diseño reutilizable, exponer gestión de usuarios en la UI y publicar documentación OpenAPI antes de abrir integraciones externas.",
    },
    {
      title: "Contacto",
      body: "hola@brisacubanaclean.com",
    },
  ];

  return (
    <main className="px-4 py-8 sm:px-6 md:px-8 md:py-12 lg:py-16 max-w-[960px] mx-auto">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1" />
        <ThemeToggle />
      </div>
      <header className="flex flex-col gap-2">
        <span className="text-xs tracking-[0.4em] uppercase text-brisa-600 dark:text-brisa-300">
          Brisa Cubana Clean Intelligence
        </span>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl m-0 leading-tight">
          Plataforma en construcción con código verificable
        </h1>
        <p className="text-base sm:text-lg text-gray-700 dark:text-brisa-200 max-w-[60ch]">
          Replanteamos el proyecto para que cada afirmación esté respaldada por
          implementación real. Este landing refleja el estado actual y enlaza
          solo a documentación verificada.
        </p>
        <div className="flex gap-4 flex-wrap mt-2">
          <Link
            href="https://github.com/albertodimas/brisa-cubana-clean-intelligence"
            className="text-brisa-600 hover:text-gray-700 dark:text-brisa-300 dark:hover:text-brisa-200 transition-colors"
          >
            Repositorio en GitHub
          </Link>
          <Link
            href="/api/docs"
            prefetch={false}
            className="text-brisa-600 hover:text-gray-700 dark:text-brisa-300 dark:hover:text-brisa-200 transition-colors"
          >
            Documentación API
          </Link>
        </div>
      </header>

      <section className="mt-8 sm:mt-10 md:mt-12 grid gap-4 sm:gap-5 md:gap-6">
        {sections.map((section) => (
          <article
            key={section.title}
            className="bg-gray-100 dark:bg-brisa-900/60 p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-brisa-300/20"
          >
            <h2 className="mt-0 mb-3 text-xl sm:text-2xl">{section.title}</h2>
            <p className="m-0 text-gray-800 dark:text-brisa-100 text-sm sm:text-base">
              {section.body}
            </p>
          </article>
        ))}
      </section>

      <section className="mt-8 sm:mt-10 md:mt-12 grid gap-4 sm:gap-5 md:gap-6">
        <article className="bg-white dark:bg-brisa-800/60 p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-brisa-300/20">
          <header className="mb-4">
            <h2 className="m-0 text-xl sm:text-2xl">Servicios disponibles</h2>
            <p className="m-0 text-gray-700 dark:text-brisa-200 text-sm sm:text-base">
              Datos en vivo provenientes de la API REST (`/api/services`).
            </p>
          </header>
          {activeServices.length === 0 ? (
            <p className="text-gray-800 dark:text-brisa-100 text-sm sm:text-base">
              Aún no hay servicios configurados en la base de datos.
            </p>
          ) : (
            <ul className="list-none p-0 m-0 grid gap-3 sm:gap-4">
              {activeServices.map((service) => (
                <li
                  key={service.id}
                  className="flex flex-col gap-1 bg-white dark:bg-brisa-800/60 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-gray-200 dark:border-brisa-300/15"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-2 sm:gap-4">
                    <strong className="text-base sm:text-lg">
                      {service.name}
                    </strong>
                    <span className="text-brisa-600 dark:text-brisa-300 font-medium text-sm sm:text-base">
                      {currencyFormatter.format(service.basePrice)}
                    </span>
                  </div>
                  {service.description ? (
                    <p className="m-0 text-gray-700 dark:text-brisa-200 text-sm sm:text-base">
                      {service.description}
                    </p>
                  ) : null}
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-brisa-400">
                    Duración estimada: {service.durationMin} min · Última
                    actualización:{" "}
                    {dateFormatter.format(new Date(service.updatedAt))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="bg-white dark:bg-brisa-800/60 p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-brisa-300/20">
          <header className="mb-4">
            <h2 className="m-0 text-xl sm:text-2xl">Próximas reservas</h2>
            <p className="m-0 text-gray-700 dark:text-brisa-200 text-sm sm:text-base">
              Mostrando hasta cuatro reservas futuras desde `/api/bookings`.
            </p>
          </header>
          {upcomingBookings.length === 0 ? (
            <p className="text-gray-800 dark:text-brisa-100 text-sm sm:text-base">
              Aún no hay reservas programadas en la base de datos.
            </p>
          ) : (
            <ul className="list-none p-0 m-0 grid gap-3 sm:gap-4">
              {upcomingBookings.map((booking) => (
                <li
                  key={booking.id}
                  className="flex flex-col gap-1 bg-white dark:bg-brisa-800/60 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-gray-200 dark:border-brisa-300/15"
                >
                  <strong className="text-base sm:text-lg">
                    {booking.service.name}
                  </strong>
                  <span className="text-gray-700 dark:text-brisa-200 text-sm sm:text-base">
                    {booking.property.label} · {booking.property.city}
                  </span>
                  <span className="text-sm sm:text-base text-brisa-600 dark:text-brisa-300">
                    {dateFormatter.format(new Date(booking.scheduledAt))}
                  </span>
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-brisa-400">
                    Código {booking.code} ·{" "}
                    {currencyFormatter.format(booking.totalAmount)} · Estado{" "}
                    {booking.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="bg-white dark:bg-brisa-800/60 p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-brisa-300/20">
          <header className="mb-4">
            <h2 className="m-0 text-xl sm:text-2xl">
              Inventario de propiedades
            </h2>
            <p className="m-0 text-gray-700 dark:text-brisa-200 text-sm sm:text-base">
              {properties.length} propiedades activas listas para asignación.
            </p>
          </header>
          {properties.length === 0 ? (
            <p className="text-gray-800 dark:text-brisa-100 text-sm sm:text-base">
              Crea una propiedad desde el panel operativo para iniciar
              programación.
            </p>
          ) : (
            <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
              {properties.slice(0, 4).map((property) => (
                <div
                  key={property.id}
                  className="p-3 sm:p-4 rounded-lg sm:rounded-xl border border-gray-200 dark:border-brisa-300/15 bg-white dark:bg-brisa-800/60"
                >
                  <strong className="text-sm sm:text-base">
                    {property.label}
                  </strong>
                  <p className="my-1.5 text-gray-700 dark:text-brisa-200 text-xs sm:text-sm">
                    {property.addressLine}, {property.city}, {property.state}{" "}
                    {property.zipCode}
                  </p>
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-brisa-400">
                    Propietario:{" "}
                    {property.owner?.fullName ?? property.owner?.email ?? "N/A"}
                  </span>
                </div>
              ))}
              {properties.length > 4 ? (
                <span className="text-brisa-600 dark:text-brisa-300 text-xs sm:text-sm md:col-span-2">
                  {properties.length - 4} propiedades adicionales no mostradas.
                </span>
              ) : null}
            </div>
          )}
        </article>

        <article className="bg-white dark:bg-brisa-800/60 p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-brisa-300/20">
          <header className="mb-4">
            <h2 className="m-0 text-xl sm:text-2xl">Clientes activos</h2>
            <p className="m-0 text-gray-700 dark:text-brisa-200 text-sm sm:text-base">
              {customers.length} clientes con reservas o propiedades
              registradas.
            </p>
          </header>
          {customers.length === 0 ? (
            <p className="text-gray-800 dark:text-brisa-100 text-sm sm:text-base">
              Registra clientes desde el panel operativo o mediante seed.
            </p>
          ) : (
            <ul className="list-none p-0 m-0 grid gap-3 sm:gap-4 md:grid-cols-2">
              {customers.slice(0, 5).map((customer) => (
                <li
                  key={customer.id}
                  className="p-3 sm:p-3.5 rounded-lg sm:rounded-xl border border-gray-200 dark:border-brisa-300/15 bg-white dark:bg-brisa-800/60 flex flex-col gap-1"
                >
                  <strong className="text-sm sm:text-base">
                    {customer.fullName ?? "Cliente sin nombre"}
                  </strong>
                  <span className="text-gray-700 dark:text-brisa-200 text-xs sm:text-sm">
                    {customer.email}
                  </span>
                </li>
              ))}
              {customers.length > 5 ? (
                <span className="text-brisa-600 dark:text-brisa-300 text-xs sm:text-sm md:col-span-2">
                  {customers.length - 5} clientes adicionales no mostrados.
                </span>
              ) : null}
            </ul>
          )}
        </article>
      </section>

      {isAuthenticated ? (
        <>
          <section className="mt-8 sm:mt-10 md:mt-12">
            <Dashboard
              bookings={bookings}
              services={services}
              customersCount={customers.length}
            />
          </section>

          <AdminPanel
            currentUser={session?.user ?? null}
            services={servicesPage}
            properties={propertiesPage}
            bookings={bookingsPage}
            customers={customersPage}
            initialBookingFilters={bookingFilterDefaults}
            createService={createServiceAction}
            createProperty={createPropertyAction}
            createBooking={createBookingAction}
            toggleService={toggleServiceActiveAction}
            updateService={updateServiceAction}
            updateProperty={updatePropertyAction}
            updateBooking={updateBookingAction}
            updateUser={updateUserAction}
            toggleUserActive={toggleUserActiveAction}
            users={usersPage}
            notifications={notificationsPage}
            logout={logoutAction}
          />
        </>
      ) : (
        <section className="mt-8 sm:mt-10 md:mt-12 p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-brisa-300/20 bg-gray-100 dark:bg-brisa-900/60 grid gap-3">
          <h2 className="m-0 text-xl sm:text-2xl">Acceso restringido</h2>
          <p className="m-0 text-gray-700 dark:text-brisa-200 text-sm sm:text-base">
            Inicia sesión para crear o gestionar servicios operativos.
          </p>
          <Link
            href="/login"
            className="text-brisa-600 hover:text-gray-700 dark:text-brisa-300 dark:hover:text-brisa-200 transition-colors text-sm sm:text-base"
          >
            Ir a iniciar sesión
          </Link>
        </section>
      )}
    </main>
  );
}
