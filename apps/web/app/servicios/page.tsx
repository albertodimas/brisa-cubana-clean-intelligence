import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Servicios · Brisa Cubana Clean Intelligence",
  description:
    "Detalle de turnos, deep cleaning y mantenimiento preventivo que ofrecemos para propiedades premium en Miami.",
};

const services = [
  {
    title: "Turnovers same-day",
    description:
      "Limpieza completa, reposición de amenidades y checklist digital con evidencia en menos de 4 horas.",
  },
  {
    title: "Deep cleaning programado",
    description:
      "Desinfección profunda por zonas críticas, restauración de textiles y reporte de hallazgos preventivos.",
  },
  {
    title: "Mantenimiento preventivo",
    description:
      "Rutinas mensuales para HVAC, plomería ligera y verificación de inventario con alertas para Operations.",
  },
];

export default function ServiciosPage() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-16">
      <header className="space-y-3">
        <p className="text-sm uppercase tracking-[0.35em] text-brisa-600">
          Servicios
        </p>
        <h1 className="text-4xl font-semibold text-[#0d2944] dark:text-white">
          Operamos cada propiedad como si fuera propia.
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-200">
          Esta página evoluciona con el plan de salida de beta. Aquí
          documentaremos cada modalidad de servicio, SLA y evidencia requerida
          antes del lanzamiento GA.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-3">
        {services.map((service) => (
          <article
            key={service.title}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <h2 className="text-xl font-semibold text-[#0d2944] dark:text-white">
              {service.title}
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {service.description}
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}
