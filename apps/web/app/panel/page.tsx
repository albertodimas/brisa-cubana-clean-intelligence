import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import type { Session } from "next-auth";
import { AdminPanel } from "@/components/admin-panel";
import { Dashboard } from "@/components/dashboard";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  ScrollReveal,
  StaggerContainer,
  StaggerItem,
  Skeleton,
  GradientMesh,
} from "@/components/ui";
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
  updateLeadAction,
} from "@/app/actions";
import {
  fetchServicesPage,
  fetchBookingsPage,
  fetchPropertiesPage,
  fetchCustomersPage,
  fetchUsersPage,
  fetchNotificationsPage,
  fetchLeadsPage,
  type PaginatedResult,
  type Service,
  type Booking,
  type Customer,
  type Property,
  type User,
  type Notification,
  type Lead,
} from "@/lib/api";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Panel operativo · Brisa Cubana",
  description:
    "Monitorea reservas, servicios, inventarios y notificaciones en tiempo real desde la plataforma operativa de Brisa Cubana Clean Intelligence.",
};

type PanelUser = NonNullable<Session["user"]>;

type BookingWindow = {
  from: string;
  to: string;
};

const EMPTY_PAGE_INFO = {
  cursor: null,
  nextCursor: null,
  hasMore: false,
} as const;

function makeEmptyPage<T>(limit = 0): PaginatedResult<T> {
  return {
    items: [],
    pageInfo: { limit, ...EMPTY_PAGE_INFO },
  };
}

type PanelContentProps = {
  user: PanelUser;
  bookingWindow: BookingWindow;
};

async function PanelContent({ user, bookingWindow }: PanelContentProps) {
  const { from, to } = bookingWindow;
  const bookingFilterDefaults = {
    status: "ALL" as const,
    from,
    to,
  };

  const [servicesPage, bookingsPage, propertiesPage, customersPage] =
    await Promise.all([
      fetchServicesPage({ limit: 50 }),
      fetchBookingsPage({ from, to, limit: 10 }),
      fetchPropertiesPage({ limit: 50 }),
      fetchCustomersPage({ limit: 50 }),
    ]);

  const emptyUsersPage: PaginatedResult<User> = makeEmptyPage<User>(50);
  const emptyNotificationsPage: PaginatedResult<Notification> =
    makeEmptyPage<Notification>(10);
  const emptyLeadsPage: PaginatedResult<Lead> = makeEmptyPage<Lead>(50);

  const usersPage =
    user.role === "ADMIN"
      ? await fetchUsersPage({ limit: 50 })
      : emptyUsersPage;

  const notificationsPage = await fetchNotificationsPage({ limit: 10 }).catch(
    () => emptyNotificationsPage,
  );

  const leadsPage =
    user.role === "ADMIN" || user.role === "COORDINATOR"
      ? await fetchLeadsPage()
      : emptyLeadsPage;

  return (
    <>
      <section className="relative mb-10 overflow-hidden rounded-3xl border border-white/80 bg-white/90 p-6 shadow-xl shadow-brisa-900/10 dark:border-brisa-700/40 dark:bg-brisa-900/80">
        <div className="absolute inset-0 bg-pattern-waves opacity-30 dark:opacity-15" />
        <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-brisa-300/60 bg-brisa-50/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-brisa-600 dark:border-brisa-500/40 dark:bg-brisa-800/60 dark:text-brisa-200">
              Panel operativo · visión general
            </span>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white sm:text-3xl">
              Hola, {user.name ?? user.email}. Todo listo para coordinar turnos
              premium en tiempo real.
            </h1>
            <p className="text-sm text-gray-600 dark:text-brisa-200 sm:text-base">
              Revisa reservas, servicios y leads; firma checklists QA y envía
              reportes con evidencia fotográfica. Brisa Cubana consolida la
              operación hotelera de tu portafolio en un solo lugar.
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-brisa-300">
              <span>✓ Checklists hoteleros digitalizados</span>
              <span>✓ Portal cliente con evidencia</span>
              <span>✓ SLA menores a 4 horas en turnovers</span>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-3 rounded-[2rem] bg-pattern-tile opacity-40 dark:opacity-25" />
            <Image
              src="/branding/portal-tech-modern.webp"
              alt="Dashboard operativo Brisa Cubana"
              width={1920}
              height={1280}
              className="relative h-auto w-full rounded-[2rem] border border-white/90 shadow-2xl shadow-brisa-900/20 dark:border-brisa-700/50"
              priority={false}
            />
          </div>
        </div>
      </section>

      <section>
        <Dashboard
          bookings={bookingsPage.items}
          services={servicesPage.items}
          customersCount={customersPage.items.length}
        />
      </section>

      <section className="bg-white dark:bg-brisa-900/60 border border-gray-200 dark:border-brisa-800 rounded-3xl p-4 sm:p-6 lg:p-8 shadow-sm">
        <AdminPanel
          currentUser={user}
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
          leads={leadsPage}
          updateLead={updateLeadAction}
        />
      </section>
    </>
  );
}

function PanelContentFallback({ user, bookingWindow }: PanelContentProps) {
  const { from, to } = bookingWindow;
  const bookingFilterDefaults = {
    status: "ALL" as const,
    from,
    to,
  };

  const emptyServices = makeEmptyPage<Service>(50);
  const emptyProperties = makeEmptyPage<Property>(50);
  const emptyBookings = makeEmptyPage<Booking>(10);
  const emptyCustomers = makeEmptyPage<Customer>(50);
  const emptyUsers = makeEmptyPage<User>(50);
  const emptyNotifications = makeEmptyPage<Notification>(10);
  const emptyLeads = makeEmptyPage<Lead>(50);

  return (
    <>
      <section>
        <StaggerContainer
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          staggerDelay={0.1}
        >
          {[1, 2, 3].map((item) => (
            <StaggerItem key={item}>
              <Skeleton animation="wave" variant="rounded" className="h-32" />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>

      <section className="bg-white dark:bg-brisa-900/60 border border-gray-200 dark:border-brisa-800 rounded-3xl p-4 sm:p-6 lg:p-8 shadow-sm">
        <AdminPanel
          currentUser={user}
          services={emptyServices}
          properties={emptyProperties}
          bookings={emptyBookings}
          customers={emptyCustomers}
          users={emptyUsers}
          notifications={emptyNotifications}
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
          leads={emptyLeads}
          updateLead={updateLeadAction}
          isLoading
        />
      </section>
    </>
  );
}

export default async function PanelPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const today = new Date();
  const from = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  ).toISOString();
  const horizon = new Date(
    today.getTime() + 1000 * 60 * 60 * 24 * 30,
  ).toISOString();

  const bookingWindow = { from, to: horizon };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-brisa-950 text-gray-900 dark:text-brisa-50">
      <div className="relative border-b border-gray-200 dark:border-brisa-800 bg-white/70 dark:bg-brisa-900/60 backdrop-blur overflow-hidden">
        {/* Gradient Mesh Background - Subtle */}
        <GradientMesh
          colors={{
            primary: "rgba(20, 184, 166, 0.2)",
            secondary: "rgba(139, 92, 246, 0.15)",
            accent: "rgba(6, 182, 212, 0.2)",
          }}
          opacity={0.25}
          shimmer
        />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-start justify-between gap-6">
          <ScrollReveal variant="fadeDown" delay={0.1}>
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
          </ScrollReveal>
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 space-y-10">
        <Suspense
          fallback={
            <PanelContentFallback
              user={session.user}
              bookingWindow={bookingWindow}
            />
          }
        >
          <PanelContent user={session.user} bookingWindow={bookingWindow} />
        </Suspense>
      </div>
    </main>
  );
}
