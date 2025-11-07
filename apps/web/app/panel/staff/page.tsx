import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import type { Session } from "next-auth";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  ScrollReveal,
  StaggerContainer,
  StaggerItem,
  Skeleton,
  GradientMesh,
} from "@/components/ui";
import { updateBookingAction } from "@/app/actions";
import {
  fetchBookingsPage,
  fetchServicesPage,
  fetchPropertiesPage,
} from "@/lib/api";
import { auth } from "@/auth";
import { BookingsManager } from "@/components/bookings-manager";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Mis asignaciones · Staff · Brisa Cubana",
  description:
    "Vista de staff para gestionar reservas asignadas en Brisa Cubana Clean Intelligence.",
};

type StaffUser = NonNullable<Session["user"]>;

type BookingWindow = {
  from: string;
  to: string;
};

type StaffContentProps = {
  user: StaffUser;
  bookingWindow: BookingWindow;
};

async function StaffContent({ user, bookingWindow }: StaffContentProps) {
  const { from, to } = bookingWindow;

  const [bookingsPage, servicesPage, propertiesPage] = await Promise.all([
    fetchBookingsPage({
      from,
      to,
      assignedStaffId: user.id,
      limit: 20,
    }),
    fetchServicesPage({ limit: 50 }),
    fetchPropertiesPage({ limit: 50 }),
  ]);

  const bookingFilterDefaults = {
    status: "ALL" as const,
    from,
    to,
    assignedStaffId: user.id,
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 dark:border-brisa-800 bg-white dark:bg-brisa-900/60 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-brisa-300">
            Total asignadas
          </h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
            {bookingsPage.items.length}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 dark:border-brisa-800 bg-white dark:bg-brisa-900/60 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-brisa-300">
            Pendientes
          </h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
            {bookingsPage.items.filter((b) => b.status === "PENDING").length}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 dark:border-brisa-800 bg-white dark:bg-brisa-900/60 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-brisa-300">
            Confirmadas
          </h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
            {bookingsPage.items.filter((b) => b.status === "CONFIRMED").length}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 dark:border-brisa-800 bg-white dark:bg-brisa-900/60 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-brisa-300">
            Completadas
          </h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
            {bookingsPage.items.filter((b) => b.status === "COMPLETED").length}
          </p>
        </div>
      </section>

      {/* Bookings Manager */}
      <section className="rounded-3xl border border-gray-200 dark:border-brisa-800 bg-white dark:bg-brisa-900/60 p-4 sm:p-6 lg:p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Mis reservas asignadas
        </h2>
        <BookingsManager
          bookings={bookingsPage.items}
          pageInfo={bookingsPage.pageInfo}
          isLoading={false}
          isLoadingMore={false}
          onLoadMore={async () => {}}
          onUpdate={updateBookingAction}
          onAssignStaff={async () => ({
            error: "No tienes permisos para asignar staff",
          })}
          services={servicesPage.items}
          properties={propertiesPage.items}
          staffUsers={[]}
          formatDateTime={(value: string) =>
            new Date(value).toLocaleString("es-ES", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          }
          currentQuery={bookingFilterDefaults}
          setQuery={async () => {}}
          resetQuery={async () => {}}
          refresh={async () => {}}
          onToast={() => {}}
        />
      </section>
    </div>
  );
}

function StaffContentFallback() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <Skeleton
            key={item}
            animation="wave"
            variant="rounded"
            className="h-28"
          />
        ))}
      </section>
      <section>
        <StaggerContainer
          className="grid gap-6 sm:grid-cols-1"
          staggerDelay={0.1}
        >
          {[1, 2, 3].map((item) => (
            <StaggerItem key={item}>
              <Skeleton animation="wave" variant="rounded" className="h-48" />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>
    </div>
  );
}

export default async function StaffPanelPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  // Only STAFF role can access this page
  if (session.user.role !== "STAFF") {
    redirect("/panel");
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
                Brisa Cubana · Panel de Staff
              </p>
              <h1 className="text-3xl sm:text-4xl font-semibold leading-tight text-gray-900 dark:text-brisa-50 m-0">
                Mis asignaciones y reservas
              </h1>
              <p className="max-w-2xl text-sm sm:text-base text-gray-600 dark:text-brisa-200 m-0">
                Gestiona las reservas que te han sido asignadas. Actualiza
                estados, agrega notas y coordina con el equipo.
              </p>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="px-3 py-1 rounded-full bg-brisa-100 text-brisa-700 dark:bg-brisa-900 dark:text-brisa-200 font-medium">
                  {session.user.email}
                </span>
                <Link
                  href="/panel"
                  className="text-brisa-600 hover:text-brisa-700 dark:text-brisa-300 dark:hover:text-brisa-200"
                >
                  ← Volver al panel principal
                </Link>
              </div>
            </div>
          </ScrollReveal>
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <Suspense fallback={<StaffContentFallback />}>
          <StaffContent user={session.user} bookingWindow={bookingWindow} />
        </Suspense>
      </div>
    </main>
  );
}
