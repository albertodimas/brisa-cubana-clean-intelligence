import { redirect } from "next/navigation";
import { Badge, Button, Card, Section } from "@brisa/ui";
import { auth, signOut } from "@/server/auth/config";
import { getDashboardData } from "@/server/api/client";
import { queuePaymentAlert } from "@/server/notifications/alerts";
import { CreateBookingForm } from "./create-booking-form";
import { ManageBookings } from "./manage-bookings";

const currencyFormatter = new Intl.NumberFormat("es-US", {
  style: "currency",
  currency: "USD",
});

const datetimeFormatter = new Intl.DateTimeFormat("es-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

async function signOutAction() {
  "use server";
  await signOut({ redirectTo: "/" });
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  if (!session.user.accessToken) {
    redirect("/auth/signin");
  }

  const data = await getDashboardData(
    session.user.id,
    session.user.accessToken,
    session.user.role,
  );

  const hasProperties = data.user.properties.length > 0;
  const upcomingBookings =
    data.canManageBookings && data.managedBookings?.length
      ? data.managedBookings
      : data.bookings;
  const hasBookings = upcomingBookings.length > 0;
  const failedPayments = Number(data.paymentMetrics?.FAILED ?? 0);
  const pendingPayments = Number(data.paymentMetrics?.PENDING_PAYMENT ?? 0);

  if (data.canManageBookings && (failedPayments > 0 || pendingPayments > 5)) {
    await queuePaymentAlert({
      failedPayments,
      pendingPayments,
      accessToken: session.user.accessToken,
    });
  }

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-8 py-16 text-neutral-100">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-teal-300">
          Brisa Cubana · Dashboard
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-white">
          Hola {session.user.name ?? session.user.email}
        </h1>
        <p className="text-sm text-neutral-400">
          Gestiona reservas, servicios y propiedades con insights sincronizados
          en tiempo real desde CleanOps.
        </p>
      </div>

      {data.canManageBookings && (failedPayments > 0 || pendingPayments > 5) ? (
        <div className="flex flex-col gap-2 rounded-3xl border border-rose-400/40 bg-rose-500/10 p-5 shadow-lg shadow-rose-900/25">
          <p className="text-sm font-semibold text-rose-100 uppercase tracking-[0.25em]">
            Alertas de conciliación
          </p>
          {failedPayments > 0 ? (
            <p className="text-sm text-rose-100">
              Hay {failedPayments} pagos marcados como{" "}
              <span className="font-semibold">FAILED</span>. Revisa los detalles
              y comunícate con el cliente.
            </p>
          ) : null}
          {pendingPayments > 5 ? (
            <p className="text-sm text-rose-100/80">
              Existen {pendingPayments} reservas con pago pendiente. Considera
              priorizar la verificación para evitar cancelaciones.
            </p>
          ) : null}
        </div>
      ) : null}

      <Section
        title="Estado operacional"
        description="Visibilidad resumida de tus próximas reservas y servicios disponibles."
      >
        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <Card
            title="Próximas reservas"
            description={
              hasBookings
                ? "Seguimiento de los próximos servicios confirmados."
                : "Todavía no has agendado servicios. Usa el formulario para crear tu primera reserva."
            }
          >
            <div className="mt-4 space-y-4">
              {hasBookings ? (
                upcomingBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-neutral-200"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-semibold text-white">
                        {booking.serviceName}
                      </span>
                      <Badge
                        tone={
                          booking.status === "CONFIRMED" ||
                          booking.status === "PENDING"
                            ? "teal"
                            : "neutral"
                        }
                      >
                        {booking.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-neutral-400">
                      {datetimeFormatter.format(new Date(booking.scheduledAt))}
                    </p>
                    <p className="mt-2 text-xs text-neutral-300">
                      {booking.propertyName} · {booking.propertyAddress}
                    </p>
                    {data.canManageBookings && booking.clientEmail ? (
                      <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-neutral-500">
                        Cliente: {booking.clientName ?? booking.clientEmail} ·{" "}
                        {booking.clientEmail}
                      </p>
                    ) : null}
                    <p className="mt-1 text-xs text-neutral-400">
                      {currencyFormatter.format(booking.totalPrice)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-neutral-300">
                  ¡Sin reservas pendientes! Agenda un servicio para mantener tus
                  propiedades impecables.
                </p>
              )}
            </div>
          </Card>
          <Card
            title="Servicios destacados"
            description="Los servicios están optimizados para concierge IA y auditorías CleanScore™."
          >
            <ul className="mt-4 space-y-3 text-sm text-neutral-300">
              {data.services.slice(0, 3).map((service) => (
                <li
                  key={service.id}
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2"
                >
                  <div className="flex items-center justify-between text-white">
                    <span>{service.name}</span>
                    <span className="text-xs uppercase tracking-[0.2em] text-teal-200">
                      {currencyFormatter.format(service.basePrice)}
                    </span>
                  </div>
                  {service.description ? (
                    <p className="mt-1 text-xs text-neutral-400">
                      {service.description}
                    </p>
                  ) : null}
                  <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-neutral-500">
                    {service.durationMinutes} minutos
                  </p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </Section>

      {hasProperties ? (
        <CreateBookingForm
          services={data.services}
          properties={data.user.properties}
        />
      ) : (
        <Card
          title="Registra tu primera propiedad"
          description="Agrega propiedades desde el equipo de operaciones o la API para habilitar reservas."
        >
          <p className="text-sm text-neutral-300">
            Contacta al concierge para cargar tus propiedades y comenzar a
            recibir crews certificados.
          </p>
        </Card>
      )}

      {data.canManageBookings ? (
        <Section
          title="Control operativo"
          description="Gestiona estados y confirma pagos directamente desde el dashboard."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <Card
              title="Estado de pagos"
              description="Conciliación rápida de reservas en distintos estados financieros."
            >
              <ul className="mt-3 space-y-2 text-sm text-neutral-300">
                {Object.entries(data.paymentMetrics ?? {}).map(
                  ([status, count]) => (
                    <li
                      key={status}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2"
                    >
                      <span className="uppercase tracking-[0.2em] text-xs text-neutral-400">
                        {status.replace(/_/g, " ")}
                      </span>
                      <span className="text-white">{count}</span>
                    </li>
                  ),
                )}
              </ul>
            </Card>
            <Card
              title="Estado operativo"
              description="Cuántas reservas tenemos en cada etapa del flujo de servicio."
            >
              <ul className="mt-3 space-y-2 text-sm text-neutral-300">
                {Object.entries(data.bookingMetrics ?? {}).map(
                  ([status, count]) => (
                    <li
                      key={status}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2"
                    >
                      <span className="uppercase tracking-[0.2em] text-xs text-neutral-400">
                        {status}
                      </span>
                      <span className="text-white">{count}</span>
                    </li>
                  ),
                )}
              </ul>
            </Card>
          </div>
          <ManageBookings bookings={data.managedBookings ?? []} />
          {data.failedPaymentsLast24h &&
          data.failedPaymentsLast24h.length > 0 ? (
            <Card
              title="Pagos fallidos (24h)"
              description="Últimos casos que necesitan conciliación manual."
            >
              <ul className="mt-3 space-y-2 text-sm text-neutral-300">
                {data.failedPaymentsLast24h.map((booking) => (
                  <li
                    key={booking.id}
                    className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-rose-100">
                        {booking.serviceName}
                      </span>
                      <span className="text-xs uppercase tracking-[0.2em] text-rose-200">
                        {booking.status}
                      </span>
                    </div>
                    <p className="text-xs text-rose-100/80">
                      {new Date(booking.scheduledAt).toLocaleString("es-US")} ·{" "}
                      {booking.clientEmail ?? "Cliente sin correo"}
                    </p>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </Section>
      ) : null}

      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-lg shadow-black/30">
        <h2 className="text-lg font-semibold text-white">Acciones rápidas</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            intent="secondary"
            as="a"
            href="mailto:hola@brisacubanaclean.com"
          >
            Solicitar concierge humano
          </Button>
          <Button intent="ghost" as="a" href="/docs/07-roadmap-y-operaciones">
            Revisar roadmap completo
          </Button>
          {data.canManageBookings ? (
            <Button intent="ghost" as="a" href="/dashboard/auditoria">
              Ver auditoría
            </Button>
          ) : null}
        </div>
        <form action={signOutAction} className="mt-6">
          <button
            type="submit"
            className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-neutral-200 transition hover:border-teal-300 hover:text-teal-200"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </section>
  );
}
