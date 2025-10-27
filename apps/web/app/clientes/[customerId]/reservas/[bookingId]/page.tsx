import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { fetchPortalBookingDetail } from "@/lib/api";
import { PortalBookingDetailClient } from "./booking-detail-client";
import { GradientMesh } from "@/components/ui";

type PageParams = {
  customerId: string;
  bookingId: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { bookingId } = await params;
  return {
    title: `Detalle reserva ${bookingId} – Portal Cliente`,
  };
}

export default async function PortalBookingDetailPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { customerId, bookingId } = await params;
  if (!customerId || !bookingId) {
    notFound();
  }

  const cookieStore = await cookies();
  const portalToken = cookieStore.get("portal_token")?.value ?? null;
  if (!portalToken) {
    redirect("/clientes/acceso");
  }

  const detail = await fetchPortalBookingDetail(bookingId);
  if (!detail) {
    redirect(`/clientes/${customerId}`);
  }

  if (detail.customer.id !== customerId) {
    redirect(`/clientes/${detail.customer.id}`);
  }

  const sessionExpiresAt = detail.session?.expiresAt ?? null;

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

      <div className="relative mx-auto grid max-w-4xl gap-10">
        <PortalBookingDetailClient
          booking={detail.booking}
          customer={detail.customer}
          sessionExpiresAt={sessionExpiresAt ?? null}
        />
      </div>
    </main>
  );
}
