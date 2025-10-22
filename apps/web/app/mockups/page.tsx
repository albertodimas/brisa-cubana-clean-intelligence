export const dynamic = "force-static";

const bookings = [
  {
    id: "BK-2093",
    property: "Skyline Loft Brickell",
    guest: "Paula Hernández",
    status: "Confirmado",
    start: "22-oct 11:00",
    duration: "3h",
  },
  {
    id: "BK-2094",
    property: "Azure Villa",
    guest: "Marcus Reed",
    status: "En turno",
    start: "22-oct 14:30",
    duration: "4h",
  },
  {
    id: "BK-2095",
    property: "Harbour House 1903",
    guest: "Fátima López",
    status: "Checklist enviado",
    start: "23-oct 09:00",
    duration: "4h",
  },
];

const services = [
  {
    name: "Turnover Premium",
    kpi: "12-25 stays/año",
    sla: "<4h evidencia",
    team: "Cuadrilla A & B",
  },
  {
    name: "Deep Clean",
    kpi: "Cada 45 días",
    sla: "6h + detailing",
    team: "Especialistas DC",
  },
  {
    name: "Amenity Refresh",
    kpi: "Reposición 100%",
    sla: "2h restocking",
    team: "Logística + Ops",
  },
];

const mobileActions = [
  {
    title: "Solicitar turno",
    description:
      "Selecciona fecha, franja horaria y agrega instrucciones especiales para el equipo.",
    icon: "🗓️",
  },
  {
    title: "Ver evidencias",
    description:
      "Recibe fotos en menos de 4h y descarga reportes PDF con firmas digitales.",
    icon: "📸",
  },
  {
    title: "Chatear con operaciones",
    description:
      "Canal directo 24/7 vía WhatsApp Business con el supervisor asignado.",
    icon: "💬",
  },
];

export default function MockupsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-brisa-950 via-brisa-900 to-brisa-950 text-brisa-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-16">
        <section
          data-mockup="portal-bookings"
          className="rounded-3xl border border-brisa-800/70 bg-brisa-900/80 p-8 shadow-[0_20px_60px_rgba(8,20,24,0.45)] backdrop-blur"
        >
          <header className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-brisa-500">
                Dashboard · Turnos activos
              </p>
              <h2 className="text-2xl font-semibold">
                Agenda en vivo — Equipo Turnover Premium
              </h2>
            </div>
            <span className="rounded-full bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-200">
              3 turnos en progreso
            </span>
          </header>
          <div className="grid gap-4 text-sm">
            {bookings.map((booking) => (
              <article
                key={booking.id}
                className="grid gap-4 rounded-2xl border border-brisa-800/60 bg-brisa-950/80 p-5 md:grid-cols-[140px_minmax(0,1fr)_160px_120px]"
              >
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-brisa-500">
                    Código
                  </p>
                  <p className="text-lg font-semibold">{booking.id}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-brisa-500">
                    Propiedad
                  </p>
                  <p>{booking.property}</p>
                  <p className="text-xs text-brisa-400">
                    Huésped: {booking.guest}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-brisa-500">
                    Inicio
                  </p>
                  <p>{booking.start}</p>
                  <p className="text-xs text-brisa-400">
                    Duración {booking.duration}
                  </p>
                </div>
                <div className="flex items-center justify-end">
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-400/15 px-3 py-1.5 text-xs font-semibold text-emerald-200">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-300" />
                    {booking.status}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          data-mockup="portal-services"
          className="rounded-3xl border border-brisa-800/70 bg-brisa-950/80 p-8 shadow-[0_20px_60px_rgba(8,20,24,0.45)] backdrop-blur"
        >
          <header className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-brisa-500">
                Servicios · SLA activos
              </p>
              <h2 className="text-2xl font-semibold">
                Matriz de cumplimiento operativo
              </h2>
            </div>
            <span className="rounded-full bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-200">
              100% SLA Q4
            </span>
          </header>
          <div className="grid gap-6 md:grid-cols-3">
            {services.map((service) => (
              <article
                key={service.name}
                className="rounded-2xl border border-brisa-800/60 bg-brisa-900/80 p-5"
              >
                <h3 className="text-lg font-semibold text-brisa-50">
                  {service.name}
                </h3>
                <dl className="mt-4 space-y-3 text-sm text-brisa-300">
                  <div>
                    <dt className="text-xs uppercase tracking-[0.25em] text-brisa-500">
                      KPI principal
                    </dt>
                    <dd>{service.kpi}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.25em] text-brisa-500">
                      SLA objetivo
                    </dt>
                    <dd>{service.sla}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.25em] text-brisa-500">
                      Equipo asignado
                    </dt>
                    <dd>{service.team}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </section>

        <section
          data-mockup="portal-mobile"
          className="mx-auto max-w-sm rounded-3xl border border-brisa-800/70 bg-brisa-950/80 p-6 shadow-[0_20px_60px_rgba(8,20,24,0.45)] backdrop-blur"
        >
          <header className="mb-4 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-brisa-500">
              App cliente · Mobile preview
            </p>
            <h2 className="text-xl font-semibold">
              Acciones rápidas desde el móvil
            </h2>
          </header>
          <div className="space-y-4">
            {mobileActions.map((action) => (
              <article
                key={action.title}
                className="rounded-2xl border border-brisa-800/60 bg-brisa-900/90 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl" aria-hidden>
                    {action.icon}
                  </span>
                  <h3 className="text-base font-semibold">{action.title}</h3>
                </div>
                <p className="mt-2 text-sm text-brisa-300 leading-relaxed">
                  {action.description}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
