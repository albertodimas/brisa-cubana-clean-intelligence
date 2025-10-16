import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowPathIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { fetchCustomerBookings, type Booking } from "@/lib/api";
import { PortalStatCard } from "@/components/portal/stat-card";
import { PortalBookingCard } from "@/components/portal/booking-card";
import { PortalTimelineItem } from "@/components/portal/timeline-item";
import { PortalCallout } from "@/components/portal/callout";

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

function splitBookings(bookings: Booking[]) {
  const now = Date.now();
  const upcoming: Booking[] = [];
  const history: Booking[] = [];
  bookings.forEach((booking) => {
    const scheduled = new Date(booking.scheduledAt).getTime();
    if (scheduled >= now) {
      upcoming.push(booking);
    } else {
      history.push(booking);
    }
  });
  return { upcoming, history };
}

function formatDate(dateIso: string) {
  try {
    return format(new Date(dateIso), "PPPPp", { locale: es });
  } catch {
    return dateIso;
  }
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

  const bookingsResult = await fetchCustomerBookings({
    customerId,
    limit: 50,
  });

  const { upcoming, history } = splitBookings(bookingsResult.items);
  const totals = {
    upcoming: upcoming.length,
    history: history.length,
    confirmed: bookingsResult.items.filter(
      (booking) => booking.status === "CONFIRMED",
    ).length,
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-white via-brisa-50 to-brisa-100 px-4 py-16 text-gray-900 dark:from-brisa-950 dark:via-brisa-900 dark:to-brisa-950 dark:text-white sm:px-6 md:px-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top,rgba(39,137,255,0.25),transparent_60%)] dark:bg-[radial-gradient(circle_at_top,rgba(39,137,255,0.35),transparent_65%)]" />
      <div className="relative mx-auto grid max-w-5xl gap-12">
        <header className="flex flex-col gap-6 rounded-3xl border border-white/60 bg-white/90 p-8 shadow-lg backdrop-blur-md dark:border-brisa-700/50 dark:bg-brisa-900/80">
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-brisa-300/60 bg-brisa-50/80 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-brisa-600 dark:border-brisa-500/40 dark:bg-brisa-800/70 dark:text-brisa-200">
              Portal cliente
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-brisa-200 bg-white px-3 py-1 text-xs font-semibold text-brisa-500 shadow-sm dark:border-brisa-600 dark:bg-brisa-900 dark:text-brisa-100">
              <UserCircleIcon className="h-4 w-4" />
              ID {customerId.slice(0, 6).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              ¡Hola! Estas son tus reservas con Brisa Cubana
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-gray-600 dark:text-brisa-200 sm:text-base">
              Revisa detalles, estados y acciones disponibles. La versión beta
              se actualiza en tiempo real y pronto integrará formularios de
              cambios y descargas de comprobantes.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <PortalStatCard
              title="Próximos servicios"
              value={totals.upcoming}
              helper="Confirmados en el calendario"
              variant="primary"
            />
            <PortalStatCard
              title="Historial"
              value={totals.history}
              helper="Servicios completados"
            />
            <PortalStatCard
              title="Confirmados"
              value={totals.confirmed}
              helper="Listos para ejecutarse"
            />
          </div>
        </header>

        <section className="space-y-5 rounded-3xl border border-white/60 bg-white/90 p-8 shadow-xl backdrop-blur-md dark:border-brisa-700/40 dark:bg-brisa-900/80">
          <header className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Próximas reservas
              </h2>
              <p className="text-sm text-gray-600 dark:text-brisa-300">
                Visualiza tus servicios confirmados y en progreso.
              </p>
            </div>
            <Link
              href="/checkout"
              prefetch={false}
              className="inline-flex items-center gap-2 text-sm text-brisa-600 underline-offset-4 transition-colors hover:underline dark:text-brisa-300"
            >
              Solicitar un nuevo servicio →
            </Link>
          </header>

          {upcoming.length === 0 ? (
            <p className="rounded-xl border border-dashed border-brisa-300/60 bg-brisa-50/70 p-4 text-sm text-gray-700 dark:border-brisa-700/40 dark:bg-brisa-800/40 dark:text-brisa-100">
              No encontramos reservas próximas. Si necesitas agendar una
              limpieza, utiliza el checkout público o contacta a operaciones.
            </p>
          ) : (
            <ul className="grid gap-4">
              {upcoming.map((booking) => (
                <PortalBookingCard
                  key={booking.id}
                  booking={booking}
                  scheduledLabel={formatDate(booking.scheduledAt)}
                />
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-4 rounded-3xl border border-white/70 bg-white/85 p-8 shadow-xl backdrop-blur-md dark:border-brisa-700/50 dark:bg-brisa-900/80">
          <header className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Historial reciente
            </h2>
            <p className="text-sm text-gray-600 dark:text-brisa-300">
              Mantén el registro de limpiezas anteriores y descargas futuras.
            </p>
          </header>
          {history.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-brisa-300">
              Aún no hay historial disponible.
            </p>
          ) : (
            <ol className="space-y-4 border-l border-dashed border-brisa-300/60 pl-5 dark:border-brisa-700/50">
              {history.map((booking) => (
                <PortalTimelineItem
                  key={booking.id}
                  status={booking.status}
                  title={`${booking.service.name} · ${booking.property.label}`}
                  meta={formatDate(booking.scheduledAt)}
                />
              ))}
            </ol>
          )}
        </section>

        <PortalCallout
          title="¿Necesitas ajustar algo?"
          description={
            <p>
              Estamos finalizando el formulario de autoservicio. Mientras tanto,
              puedes solicitar cambios desde la línea de soporte o respondiendo
              los correos de confirmación.
            </p>
          }
          icon={<ArrowPathIcon className="h-10 w-10" />}
          action={
            <Link
              className="inline-flex items-center justify-center rounded-full border border-brisa-500/60 px-5 py-2.5 text-sm font-semibold tracking-wide text-brisa-600 transition-colors hover:bg-brisa-100 dark:border-brisa-400/60 dark:text-brisa-200 dark:hover:bg-brisa-800/60"
              href="mailto:soporte@brisacubanaclean.com"
            >
              Escribir a soporte →
            </Link>
          }
        />
      </div>
    </main>
  );
}
