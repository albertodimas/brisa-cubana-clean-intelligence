import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { fetchPortalBookingDetail, fetchPortalBookings } from "@/lib/api";
import { PortalBookingDetailClient } from "./booking-detail-client";

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

  const sessionExpiresAt = (await fetchPortalBookings({ limit: 1 }))?.session
    ?.expiresAt;

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-white via-brisa-50 to-brisa-100 px-4 py-16 text-gray-900 dark:from-brisa-950 dark:via-brisa-900 dark:to-brisa-950 dark:text-white sm:px-6 md:px-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top,rgba(39,137,255,0.25),transparent_60%)] dark:bg-[radial-gradient(circle_at_top,rgba(39,137,255,0.35),transparent_65%)]" />
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
