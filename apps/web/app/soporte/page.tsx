import type { Metadata } from "next";
import { MarketingLink } from "@/components/landing/marketing-link";
import { LeadCaptureForm } from "@/components/landing/lead-capture-form";

export const metadata: Metadata = {
  title: "Soporte · Brisa Cubana Clean Intelligence",
  description:
    "Centro de ayuda para clientes y staff. Canales, SLA y enlaces a runbooks durante la beta.",
};

const supportChannels = [
  {
    title: "Operaciones 24/7",
    detail: "operaciones@brisacubanacleanintelligence.com",
    notes:
      "Alertas de turnos, incidencias en propiedades, coordinación con cuadrillas.",
  },
  {
    title: "Soporte clientes",
    detail: "soporte@brisacubanacleanintelligence.com",
    notes:
      "Facturación, acceso al portal, reportes descargables y ajustes de usuarios.",
  },
  {
    title: "Seguridad",
    detail: "seguridad@brisacubanacleanintelligence.com",
    notes: "Reporte de vulnerabilidades, accesos no autorizados, compliance.",
  },
];

const slaTimeline = [
  {
    label: "Incidencia crítica en turno",
    detail: "Respuesta < 15 min · Resolución < 2 h",
  },
  {
    label: "Accesos/portal",
    detail: "Respuesta < 1 h · Resolución < 6 h",
  },
  {
    label: "Facturación y documentos",
    detail: "Respuesta < 4 h hábiles · Resolución < 24 h",
  },
];

const runbooks = [
  {
    name: "Checklist de despliegue",
    href: "/docs/operations/deployment.html",
    notes: "Pasos para activar ambientes preview/production.",
  },
  {
    name: "Runbook de incidentes",
    href: "/docs/operations/incident-runbook.html",
    notes: "Procedimiento para incidentes críticos y comunicación.",
  },
  {
    name: "Política de seguridad",
    href: "/docs/operations/security.html",
    notes: "Lineamientos de manejo de datos y acceso al portal.",
  },
];

export default function SoportePage() {
  return (
    <main className="flex flex-col gap-16 bg-white px-4 py-16 text-[#0d2944] dark:bg-brisa-950 dark:text-white sm:px-6 lg:px-10">
      <header className="mx-auto flex w-full max-w-5xl flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.45em] text-brisa-600 dark:text-brisa-300">
            Soporte & Operaciones
          </p>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
            Estamos en beta privada, pero los canales ya están listos.
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-200 sm:text-lg">
            Documentamos cada incidencia y SLA para llegar a GA sin sorpresas.
            Usa los canales oficiales o envía el formulario rápido si necesitas
            ayuda inmediata con un turno o acceso al portal.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <MarketingLink
              href="mailto:operaciones@brisacubanacleanintelligence.com"
              eventName="support_contact_operations"
              className="inline-flex items-center justify-center rounded-full bg-[#0d2944] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#0d294433] transition hover:-translate-y-0.5 hover:bg-[#11466d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1ecad3]"
            >
              Contactar operaciones
            </MarketingLink>
            <MarketingLink
              href={{ pathname: "/terminos" }}
              eventName="support_view_terms"
              className="inline-flex items-center justify-center rounded-full border border-[#0d2944]/30 px-6 py-3 text-sm font-semibold text-[#0d2944] hover:border-[#0d2944] dark:border-white/40 dark:text-white dark:hover:border-white"
            >
              Ver términos beta
            </MarketingLink>
          </div>
        </div>
        <div className="rounded-3xl border border-white/40 bg-white/80 p-6 shadow-2xl backdrop-blur dark:border-brisa-800 dark:bg-brisa-900/80">
          <p className="text-xs uppercase tracking-[0.35em] text-brisa-500 dark:text-brisa-200">
            Ventana beta
          </p>
          <p className="mt-4 text-3xl font-semibold">Nov 2025 – Ene 2026</p>
          <p className="mt-3 text-sm text-slate-600 dark:text-brisa-200">
            Todos los SLA y playbooks serán revisados semanalmente con los
            clientes piloto y actualizados aquí.
          </p>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-5xl gap-4 md:grid-cols-3">
        {supportChannels.map((channel) => (
          <article
            key={channel.title}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-brisa-900/5 dark:border-brisa-800 dark:bg-brisa-950"
          >
            <h2 className="text-xl font-semibold">{channel.title}</h2>
            <p className="mt-2 font-mono text-sm text-brisa-600 dark:text-brisa-300 break-all">
              {channel.detail}
            </p>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {channel.notes}
            </p>
          </article>
        ))}
      </section>

      <section className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-brisa-900/10 dark:border-brisa-800 dark:bg-brisa-950">
          <p className="text-xs uppercase tracking-[0.4em] text-brisa-600 dark:text-brisa-300">
            SLA beta
          </p>
          <h3 className="mt-3 text-2xl font-semibold">
            Confirmados para todos los clientes piloto.
          </h3>
          <ul className="mt-6 space-y-4 text-sm text-slate-600 dark:text-brisa-200">
            {slaTimeline.map((sla) => (
              <li
                key={sla.label}
                className="rounded-2xl border border-slate-100 bg-brisa-50/70 p-4 dark:border-brisa-800 dark:bg-brisa-900/60"
              >
                <p className="font-semibold">{sla.label}</p>
                <p className="text-sm text-slate-500 dark:text-brisa-300">
                  {sla.detail}
                </p>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg dark:border-brisa-800 dark:bg-brisa-950">
          <h3 className="text-2xl font-semibold">Runbooks y referencias</h3>
          <p className="mt-3 text-sm text-slate-600 dark:text-brisa-200 leading-relaxed">
            Publicaremos un help center completo, pero puedes consultar los
            documentos internos desde ahora:
          </p>
          <ul className="mt-4 space-y-3 text-sm text-brisa-600 dark:text-brisa-300">
            {runbooks.map((doc) => (
              <li key={doc.name}>
                <a
                  href={doc.href}
                  className="font-semibold underline decoration-dotted underline-offset-4"
                >
                  {doc.name}
                </a>{" "}
                – {doc.notes}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg dark:border-brisa-800 dark:bg-brisa-950">
          <p className="text-xs uppercase tracking-[0.4em] text-brisa-600 dark:text-brisa-300">
            Formulario rápido
          </p>
          <h3 className="mt-3 text-2xl font-semibold">
            ¿Necesitas ayuda inmediata?
          </h3>
          <p className="mt-3 text-sm text-slate-600 dark:text-brisa-200 leading-relaxed">
            Compártenos tu correo y el ID de servicio o propiedad. Te
            respondemos en menos de 30 minutos en horario operativo.
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg dark:border-brisa-800 dark:bg-brisa-950">
          <LeadCaptureForm />
        </div>
      </section>
    </main>
  );
}
