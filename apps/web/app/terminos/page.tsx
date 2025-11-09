import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos & Privacidad · Brisa Cubana Clean Intelligence",
  description:
    "Versión inicial de términos de servicio y política de privacidad. Se actualizará previo a GA.",
};

const sections = [
  {
    title: "1. Alcance del servicio",
    body: "Operamos turnos de limpieza y mantenimiento preventivo para propiedades dadas de alta en el portal. Cualquier servicio ad hoc requiere confirmación escrita.",
  },
  {
    title: "2. Uso del portal",
    body: "El acceso se realiza mediante enlaces mágicos (Auth.js). Los clientes deben mantener actualizados los contactos autorizados y reportar accesos sospechosos.",
  },
  {
    title: "3. Datos y privacidad",
    body: "Capturamos fotografías, checklists y métricas operativas para cumplir con los reportes. Antes de GA publicaremos la política completa alineada a GDPR/CCPA.",
  },
  {
    title: "4. Soporte y SLA",
    body: "Mientras permanezcamos en beta, respondemos incidencias críticas < 2h vía operaciones@. Los SLA definitivos quedarán publicados aquí en el lanzamiento GA.",
  },
];

export default function TerminosPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-16">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.4em] text-brisa-600">
          Legal
        </p>
        <h1 className="text-4xl font-semibold text-[#0d2944] dark:text-white">
          Términos de servicio y política de privacidad (versión beta)
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-200">
          Este contenido es provisional y forma parte del plan GA. Servirá como
          base para revisión legal y comunicación al publicar la versión 1.0.
        </p>
      </header>
      <section className="space-y-6">
        {sections.map((section) => (
          <article
            key={section.title}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <h2 className="text-xl font-semibold text-[#0d2944] dark:text-white">
              {section.title}
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {section.body}
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}
