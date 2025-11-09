import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Soporte · Brisa Cubana Clean Intelligence",
  description:
    "Centro de ayuda para clientes y staff. Canales de contacto, SLA y runbooks resumidos.",
};

const supportChannels = [
  {
    title: "Operaciones 24/7",
    detail: "operaciones@brisacubanacleanintelligence.com",
    notes:
      "Alertas de turnos, incidencias en propiedades, coordinación en sitio.",
  },
  {
    title: "Soporte clientes",
    detail: "soporte@brisacubanacleanintelligence.com",
    notes:
      "Consultas sobre facturación, acceso al portal, reportes descargables.",
  },
  {
    title: "Seguridad",
    detail: "seguridad@brisacubanacleanintelligence.com",
    notes: "Vulnerabilidades, accesos no autorizados, cumplimiento.",
  },
];

export default function SoportePage() {
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-16">
      <header className="space-y-4">
        <p className="text-xs uppercase tracking-[0.4em] text-brisa-600">
          Soporte
        </p>
        <h1 className="text-4xl font-semibold text-[#0d2944] dark:text-white">
          Estamos en beta privada, pero los canales ya están listos.
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-200">
          Esta página evolucionará con los SLA definidos en el plan GA. Por
          ahora enumeramos los contactos principales y referencias a los
          runbooks operativos.
        </p>
      </header>
      <section className="space-y-4">
        {supportChannels.map((channel) => (
          <article
            key={channel.title}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <h2 className="text-xl font-semibold text-[#0d2944] dark:text-white">
              {channel.title}
            </h2>
            <p className="font-mono text-sm text-brisa-600 dark:text-brisa-300">
              {channel.detail}
            </p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {channel.notes}
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}
