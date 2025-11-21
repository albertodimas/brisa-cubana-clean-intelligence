import type { Metadata } from "next";
import { MarketingLink } from "@/components/landing/marketing-link";

export const metadata: Metadata = {
  title: "Términos & Privacidad · Brisa Cubana Clean Intelligence",
  description:
    "Resumen legal provisional durante la beta. Se actualizará previo a GA con lenguaje legal final.",
};

const sections = [
  {
    title: "1. Alcance del servicio",
    body: "Operamos turnos de limpieza, deep cleaning y mantenimiento preventivo para propiedades registradas en el portal. Cualquier servicio ad hoc requiere confirmación escrita y cotización adicional.",
  },
  {
    title: "2. Uso del portal",
    body: "El acceso se realiza mediante enlaces mágicos (Auth.js). Los clientes son responsables de mantener actualizado su listado de contactos autorizados y reportar accesos sospechosos de inmediato.",
  },
  {
    title: "3. Datos y evidencia",
    body: "Capturamos fotografías, checklists y métricas operativas para respaldar cada servicio. Mientras estemos en beta, almacenamos evidencia durante 180 días. Previo a GA publicaremos la política completa de retención y subencargados (Stripe, Vercel, PostHog).",
  },
  {
    title: "4. Soporte y SLA",
    body: "Durante la beta respondemos incidencias críticas en menos de 2 h y consultas de portal/facturación en menos de 24 h. Estos SLA se revisarán semanalmente con los clientes piloto.",
  },
  {
    title: "5. Privacidad y cumplimiento",
    body: "No vendemos datos personales. Utilizamos proveedores certificados (AWS/Vercel, Stripe) y aplicamos protocolos de seguridad descritos en docs/operations/security.md. Antes del lanzamiento público publicaremos la versión alineada a GDPR/CCPA.",
  },
];

const commitments = [
  "Publicar la versión final de Términos y Privacidad antes de GA.",
  "Compartir lista de subencargados y políticas de retención de datos.",
  "Ofrecer un canal para data subject requests (DSR) y borrado de datos.",
];

export default function TerminosPage() {
  return (
    <main className="flex flex-col gap-12 bg-white px-4 py-16 text-[#0d2944] dark:bg-brisa-950 dark:text-white sm:px-6 lg:px-10">
      <header className="mx-auto flex w-full max-w-4xl flex-col gap-4">
        <p className="text-xs uppercase tracking-[0.4em] text-brisa-600 dark:text-brisa-300">
          Legal · Versión beta
        </p>
        <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
          Términos de servicio y política de privacidad provisional.
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-200 sm:text-lg">
          Este documento resume los lineamientos actuales. Nuestro equipo legal
          entregará la versión completa antes del lanzamiento GA. Hasta
          entonces, mantenemos total transparencia sobre datos, soporte y
          responsabilidades.
        </p>
        <MarketingLink
          href="mailto:legal@brisacubanacleanintelligence.com"
          eventName="legal_contact"
          className="inline-flex w-full items-center justify-center rounded-full bg-[#0d2944] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#0d294433] transition hover:-translate-y-0.5 hover:bg-[#11466d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1ecad3] sm:w-auto"
        >
          Contactar al equipo legal
        </MarketingLink>
      </header>

      <section className="mx-auto grid w-full max-w-4xl gap-6">
        {sections.map((section) => (
          <article
            key={section.title}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-brisa-900/5 dark:border-brisa-800 dark:bg-brisa-950"
          >
            <h2 className="text-xl font-semibold">{section.title}</h2>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {section.body}
            </p>
          </article>
        ))}
      </section>

      <section className="mx-auto flex w-full max-w-4xl flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg dark:border-brisa-800 dark:bg-brisa-950">
        <p className="text-xs uppercase tracking-[0.35em] text-brisa-600 dark:text-brisa-300">
          Compromisos antes del GA
        </p>
        <ul className="space-y-2 text-sm text-slate-600 dark:text-brisa-200">
          {commitments.map((commitment) => (
            <li key={commitment}>• {commitment}</li>
          ))}
        </ul>
      </section>

      <section className="mx-auto flex w-full max-w-4xl flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg dark:border-brisa-800 dark:bg-brisa-950">
        <p className="text-xs uppercase tracking-[0.35em] text-brisa-600 dark:text-brisa-300">
          Última revisión
        </p>
        <p className="text-sm text-slate-600 dark:text-brisa-200">
          9 de noviembre de 2025 · Coordinación Legal + Operaciones.
        </p>
      </section>
    </main>
  );
}
