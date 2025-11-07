import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CalendarPageClient } from "@/components/calendar/calendar-page-client";
import {
  fetchPropertiesPage,
  fetchServicesPage,
  fetchStaffUsers,
} from "@/lib/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CalendarioPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  // Solo ADMIN y COORDINATOR pueden acceder al calendario
  if (session.user.role !== "ADMIN" && session.user.role !== "COORDINATOR") {
    redirect("/panel");
  }

  // Cargar datos para filtros
  const [propertiesResult, servicesResult, staffUsers] = await Promise.all([
    fetchPropertiesPage({ limit: 100 }),
    fetchServicesPage({ limit: 100 }),
    fetchStaffUsers(),
  ]);

  const properties = propertiesResult.items.map((p) => ({
    id: p.id,
    label: p.label,
  }));

  const services = servicesResult.items.map((s) => ({
    id: s.id,
    name: s.name,
  }));

  const staff = staffUsers.map((u) => ({
    id: u.id,
    fullName: u.fullName,
    email: u.email,
  }));

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-brisa-950">
      <div className="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-6 lg:px-8 lg:py-8">
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Calendario de Reservas
          </h1>
          <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600 dark:text-brisa-300">
            Vista mensual de todas las reservas programadas
          </p>
        </div>

        <CalendarPageClient
          properties={properties}
          services={services}
          staff={staff}
        />
      </div>
    </main>
  );
}
