import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { fetchPortalBookings } from "@/lib/api";
import { PortalDashboardClient } from "./portal-dashboard-client";
import { GradientMesh } from "@/components/ui";

type PageParams = {
  customerId: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { customerId } = await params;
  return {
    title: `Portal Cliente – ${customerId}`,
    description:
      "Consulta tus próximas reservas, historial y solicitudes con Brisa Cubana Clean Intelligence.",
  };
}

export default async function ClienteDashboardPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { customerId } = await params;
  if (!customerId) {
    notFound();
  }

  const cookieStore = await cookies();
  const portalToken = cookieStore.get("portal_token")?.value ?? null;

  if (!portalToken) {
    redirect("/clientes/acceso");
  }

  const portalData = await fetchPortalBookings({ limit: 50 });

  if (!portalData) {
    redirect("/clientes/acceso");
  }

  if (portalData.customer.id !== customerId) {
    redirect(`/clientes/${portalData.customer.id}`);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-white via-brisa-50 to-brisa-100 px-4 py-16 text-gray-900 dark:from-brisa-950 dark:via-brisa-900 dark:to-brisa-950 dark:text-white sm:px-6 md:px-10">
      {/* Gradient Mesh Background - Replace radial gradient */}
      <GradientMesh
        colors={{
          primary: "rgba(39, 137, 255, 0.25)",
          secondary: "rgba(20, 184, 166, 0.2)",
          accent: "rgba(139, 92, 246, 0.2)",
        }}
        opacity={0.3}
        shimmer
      />

      <PortalDashboardClient initialData={portalData} />
    </main>
  );
}
