import Link from "next/link";
import { redirect } from "next/navigation";
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
  type Service,
  type Booking,
  type Customer,
  type User,
  type Notification,
} from "@/lib/api";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PanelPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const isAdmin = session.user.role === "ADMIN";

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

  const notificationsPage = await fetchNotificationsPage({ limit: 10 }).catch(
    () => emptyNotificationsPage,
  );

  const services: Service[] = servicesPage.items;
  const bookings: Booking[] = bookingsPage.items;
  const customers: Customer[] = customersPage.items;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-brisa-950 text-gray-900 dark:text-brisa-50">
      <div className="border-b border-gray-200 dark:border-brisa-800 bg-white/70 dark:bg-brisa-900/60 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-start justify-between gap-6">
          <div className="space-y-3">
            <p className="text-xs tracking-[0.45em] uppercase text-brisa-600 dark:text-brisa-300">
              Brisa Cubana · Panel operativo
            </p>
            <h1 className="text-3xl sm:text-4xl font-semibold leading-tight text-gray-900 dark:text-brisa-50 m-0">
              Administra servicios, reservas y equipos en tiempo real
            </h1>
            <p className="max-w-2xl text-sm sm:text-base text-gray-600 dark:text-brisa-200 m-0">
              Este panel está protegido para roles internos. Controles de
              búsqueda, filtros avanzados y telemetría en vivo se alimentan
              desde la API Hono (`/api/*`).
            </p>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="px-3 py-1 rounded-full bg-brisa-100 text-brisa-700 dark:bg-brisa-900 dark:text-brisa-200 font-medium">
                {session.user.email}
              </span>
              <Link
                href="/"
                className="text-brisa-600 hover:text-brisa-700 dark:text-brisa-300 dark:hover:text-brisa-200"
              >
                ← Volver al sitio público
              </Link>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 space-y-10">
        <section>
          <Dashboard
            bookings={bookings}
            services={services}
            customersCount={customers.length}
          />
        </section>

        <section className="bg-white dark:bg-brisa-900/60 border border-gray-200 dark:border-brisa-800 rounded-3xl p-4 sm:p-6 lg:p-8 shadow-sm">
          <AdminPanel
            currentUser={session.user}
            services={servicesPage}
            properties={propertiesPage}
            bookings={bookingsPage}
            customers={customersPage}
            users={usersPage}
            notifications={notificationsPage}
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
            logout={logoutAction}
          />
        </section>
      </div>
    </main>
  );
}
