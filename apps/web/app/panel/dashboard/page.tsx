import { Suspense } from "react";
import { redirect } from "next/navigation";
import dynamicImport from "next/dynamic";
import { auth } from "@/auth";
import { fetchDashboardStats } from "@/lib/api";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Skeleton } from "@/components/ui";

// Lazy load charts for better performance
const BookingsByStatusChart = dynamicImport(
  () =>
    import("@/components/dashboard/bookings-by-status-chart").then(
      (mod) => mod.BookingsByStatusChart,
    ),
  {
    loading: () => (
      <Skeleton animation="wave" variant="rounded" className="h-80" />
    ),
  },
);

const RevenueTrendChart = dynamicImport(
  () =>
    import("@/components/dashboard/revenue-trend-chart").then(
      (mod) => mod.RevenueTrendChart,
    ),
  {
    loading: () => (
      <Skeleton animation="wave" variant="rounded" className="h-80" />
    ),
  },
);

const StaffWorkloadChart = dynamicImport(
  () =>
    import("@/components/dashboard/staff-workload-chart").then(
      (mod) => mod.StaffWorkloadChart,
    ),
  {
    loading: () => (
      <Skeleton animation="wave" variant="rounded" className="h-80" />
    ),
  },
);

const TopPropertiesChart = dynamicImport(
  () =>
    import("@/components/dashboard/top-properties-chart").then(
      (mod) => mod.TopPropertiesChart,
    ),
  {
    loading: () => (
      <Skeleton animation="wave" variant="rounded" className="h-80" />
    ),
  },
);

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function DashboardContent() {
  const stats = await fetchDashboardStats();

  return (
    <div className="space-y-6">
      {/* Stats Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Reservas"
          value={stats.totals.totalBookings}
          subtitle="Últimos 30 días"
          icon={
            <svg
              className="h-12 w-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          }
        />
        <StatsCard
          title="Ingresos Totales"
          value={`$${stats.totals.totalRevenue.toFixed(2)}`}
          subtitle="Últimos 30 días"
          icon={
            <svg
              className="h-12 w-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
        <StatsCard
          title="Staff Activo"
          value={stats.totals.totalActiveStaff}
          subtitle="Con reservas asignadas"
          icon={
            <svg
              className="h-12 w-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          }
        />
        <StatsCard
          title="Propiedades Activas"
          value={stats.totals.totalProperties}
          subtitle="Con reservas recientes"
          icon={
            <svg
              className="h-12 w-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
          }
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <BookingsByStatusChart data={stats.bookingsByStatus} />
        <StaffWorkloadChart data={stats.staffWorkload} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueTrendChart data={stats.revenueTrend} />
        <TopPropertiesChart data={stats.topProperties} />
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Cards Skeleton */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton
            key={i}
            animation="wave"
            variant="rounded"
            className="h-32"
          />
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <Skeleton
            key={i}
            animation="wave"
            variant="rounded"
            className="h-80"
          />
        ))}
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  // Solo ADMIN y COORDINATOR pueden acceder al dashboard
  if (session.user.role !== "ADMIN" && session.user.role !== "COORDINATOR") {
    redirect("/panel");
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-brisa-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-brisa-300">
            Métricas y análisis de los últimos 30 días
          </p>
        </div>

        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardContent />
        </Suspense>
      </div>
    </main>
  );
}
