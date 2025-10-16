import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { fetchCustomerBookings, type Booking } from "@/lib/api";

type PageProps = {
  params: { customerId: string };
};

export async function generateMetadata({ params }: PageProps) {
  return {
    title: `Portal Cliente – ${params.customerId}`,
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

export default async function ClienteDashboardPage({ params }: PageProps) {
  const { customerId } = params;
  if (!customerId) {
    notFound();
  }

  const bookingsResult = await fetchCustomerBookings({
    customerId,
    limit: 50,
  });

  const { upcoming, history } = splitBookings(bookingsResult.items);

  return (
    <main className="min-h-screen bg-white px-4 py-12 text-gray-900 dark:bg-brisa-950 dark:text-white sm:px-6 md:px-8">
      <div className="mx-auto grid max-w-4xl gap-6">
        <header className="space-y-3">
          <span className="text-xs uppercase tracking-[0.3em] text-brisa-500 dark:text-brisa-300">
            Portal cliente
          </span>
          <h1 className="text-3xl font-semibold sm:text-4xl">
            ¡Hola! Estas son tus reservas con Brisa Cubana
          </h1>
          <p className="max-w-[70ch] text-sm text-gray-600 dark:text-brisa-300 sm:text-base">
            Esta vista está en beta. Si necesitas cambiar un servicio o tienes
            dudas urgentes, escribe a
            <span className="font-medium">
              {" "}
              operaciones@brisacubanaclean.com
            </span>
            .
          </p>
        </header>

        <section className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-5 text-gray-800 dark:border-brisa-700/40 dark:bg-brisa-900/30 dark:text-brisa-100">
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
            <p className="text-sm text-gray-600 dark:text-brisa-300">
              No encontramos reservas próximas. Si necesitas agendar una
              limpieza, utiliza el checkout público o contacta a operaciones.
            </p>
          ) : (
            <ul className="grid gap-4">
              {upcoming.map((booking) => (
                <li
                  key={booking.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-brisa-700/30 dark:bg-brisa-900/50"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm uppercase tracking-wide text-brisa-500">
                        {booking.status}
                      </p>
                      <h3 className="text-lg font-semibold">
                        {booking.service.name} · {booking.property.label}
                      </h3>
                    </div>
                    <span className="rounded-full bg-brisa-100 px-3 py-1 text-xs font-semibold text-brisa-700 dark:bg-brisa-800 dark:text-brisa-200">
                      {formatDate(booking.scheduledAt)}
                    </span>
                  </div>
                  <dl className="mt-3 grid grid-cols-1 gap-2 text-sm text-gray-700 dark:text-brisa-200 sm:grid-cols-2">
                    <div className="flex flex-col">
                      <dt className="text-xs uppercase text-gray-500 dark:text-brisa-400">
                        Propiedad
                      </dt>
                      <dd>{booking.property.label}</dd>
                    </div>
                    <div className="flex flex-col">
                      <dt className="text-xs uppercase text-gray-500 dark:text-brisa-400">
                        Ciudad
                      </dt>
                      <dd>{booking.property.city}</dd>
                    </div>
                    <div className="flex flex-col">
                      <dt className="text-xs uppercase text-gray-500 dark:text-brisa-400">
                        Duración estimada
                      </dt>
                      <dd>{booking.durationMin} minutos</dd>
                    </div>
                    <div className="flex flex-col">
                      <dt className="text-xs uppercase text-gray-500 dark:text-brisa-400">
                        Total estimado
                      </dt>
                      <dd>${booking.totalAmount.toFixed(2)}</dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-4 rounded-xl border border-gray-200 p-5 text-gray-800 dark:border-brisa-700/40 dark:bg-brisa-900/30 dark:text-brisa-100">
          <header>
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
            <ol className="space-y-3 border-l border-dashed border-gray-300 pl-4 dark:border-brisa-700/50">
              {history.map((booking) => (
                <li key={booking.id} className="relative pl-4">
                  <span className="absolute left-[-0.75rem] top-1 flex h-3 w-3 rounded-full bg-brisa-500" />
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
                    <span className="text-xs uppercase text-gray-500 dark:text-brisa-400">
                      {booking.status}
                    </span>
                    <strong className="text-sm sm:text-base">
                      {booking.service.name} · {booking.property.label}
                    </strong>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-brisa-400">
                    {formatDate(booking.scheduledAt)}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-700 dark:border-brisa-700/40 dark:bg-brisa-900/40 dark:text-brisa-200">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            ¿Necesitas ajustar algo?
          </h2>
          <p className="mt-2">
            El formulario de solicitudes estará disponible en la siguiente
            iteración. Mientras tanto, escribe a{" "}
            <span className="font-medium">soporte@brisacubanaclean.com</span>
            indicando el número de reserva o responde al correo de confirmación
            para recibir ayuda.
          </p>
        </section>
      </div>
    </main>
  );
}
