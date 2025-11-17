import type { Metadata } from "next";
import Image from "next/image";
import { MarketingLink } from "@/components/landing/marketing-link";
import { LeadCaptureForm } from "@/components/landing/lead-capture-form";
import { serviceComparisons, valuePillars } from "@/lib/marketing-content";

export const metadata: Metadata = {
  title: "Servicios · Brisa Cubana Clean Intelligence",
  description:
    "Turnovers same-day, deep cleaning y mantenimiento preventivo para propiedades premium en Miami.",
};

const services = [
  {
    title: "Turnovers same-day",
    description:
      "Limpieza completa, reposición de amenidades y checklist digital con evidencia en menos de 4 horas. Ideal para STR y stays cortos.",
    deliverables: [
      "Checklists de 100+ puntos",
      "15-30 fotos before/after",
      "Restock e inventario trazable",
    ],
  },
  {
    title: "Deep cleaning programado",
    description:
      "Desinfección profunda por zonas críticas, restauración de textiles y reporte de hallazgos preventivos.",
    deliverables: [
      "Desarme de electrodomésticos",
      "Limpieza a vapor y ozono",
      "Informe de mantenimiento",
    ],
  },
  {
    title: "Mantenimiento preventivo",
    description:
      "Rutinas mensuales para HVAC, plomería ligera y verificación de inventario con alertas para Operations.",
    deliverables: [
      "Checklist técnico (HVAC, plumbing)",
      "Tickets automáticos en portal",
      "Recomendaciones presupuestadas",
    ],
  },
];

export default function ServiciosPage() {
  return (
    <main className="flex flex-col gap-16 bg-white px-4 py-16 text-[#0d2944] dark:bg-brisa-950 dark:text-white sm:px-6 lg:px-10">
      <header className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-center">
        <div className="space-y-5">
          <p className="text-xs uppercase tracking-[0.45em] text-brisa-600 dark:text-brisa-300">
            Servicios
          </p>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
            Diseñamos la mezcla ideal para tu inventario.
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-200 sm:text-lg">
            Cada paquete incluye playbooks detallados, cuadrillas entrenadas y
            un portal con reportes descargables. Trabajamos con operadores de
            1-200 unidades, siempre con evidencia accionable.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <MarketingLink
              href={{ pathname: "/", hash: "contacto" }}
              eventName="cta_services_contact"
              className="inline-flex items-center justify-center rounded-full bg-[#0d2944] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#0d294433] transition hover:-translate-y-0.5 hover:bg-[#11466d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1ecad3]"
            >
              Solicitar plan personalizado
            </MarketingLink>
            <MarketingLink
              href={{ pathname: "/terminos" }}
              eventName="cta_services_terms"
              className="inline-flex items-center justify-center rounded-full border border-[#0d2944]/30 px-6 py-3 text-sm font-semibold text-[#0d2944] hover:border-[#0d2944] dark:border-white/40 dark:text-white dark:hover:border-white"
            >
              Revisa términos y SLA
            </MarketingLink>
          </div>
        </div>
        <div className="rounded-3xl border border-white/60 bg-white p-6 shadow-2xl shadow-brisa-900/20 dark:border-brisa-800 dark:bg-brisa-900">
          <Image
            src="/branding/hero-turnover-luxury.webp"
            alt="Operación de housekeeping premium Brisa Cubana"
            width={1920}
            height={1440}
            className="rounded-2xl object-cover"
            sizes="(max-width: 1024px) 100vw, 480px"
            priority
          />
          <p className="mt-3 text-sm text-slate-600 dark:text-brisa-200">
            Operamos en Brickell, Wynwood, Miami Beach, Key Biscayne y Doral.
            Cuadrillas on-call 24/7 y supervisión remota con reportes en menos
            de 4 horas.
          </p>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-6xl gap-6 md:grid-cols-3">
        {services.map((service) => (
          <article
            key={service.title}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-brisa-900/5 dark:border-brisa-800 dark:bg-brisa-950"
          >
            <h2 className="text-2xl font-semibold">{service.title}</h2>
            <p className="mt-3 text-sm text-slate-600 dark:text-brisa-200 leading-relaxed">
              {service.description}
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-brisa-200">
              {service.deliverables.map((deliverable) => (
                <li key={deliverable}>• {deliverable}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="mx-auto w-full max-w-6xl space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-brisa-600 dark:text-brisa-300">
            Comparativa
          </p>
          <h2 className="mt-2 text-3xl font-semibold">Matrices por tipo</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-brisa-200">
            Selecciona el paquete que mejor se alinea a tu mezcla de unidades.
            Si manejas un inventario híbrido, combinamos servicios y
            configuramos alertas a medida.
          </p>
        </div>
        <div className="overflow-x-auto rounded-3xl border border-slate-200 shadow-xl dark:border-brisa-800">
          <table className="w-full text-left text-sm sm:text-base">
            <thead className="bg-brisa-50 text-brisa-600 dark:bg-brisa-900/60 dark:text-brisa-100">
              <tr>
                <th className="px-4 py-3">Servicio</th>
                <th className="px-4 py-3">Ideal para</th>
                <th className="px-4 py-3">SLA</th>
                <th className="px-4 py-3">Crew</th>
                <th className="px-4 py-3">Entregables</th>
                <th className="px-4 py-3">Add-ons</th>
              </tr>
            </thead>
            <tbody>
              {serviceComparisons.map((service) => (
                <tr
                  key={service.id}
                  className="border-t border-slate-100 dark:border-brisa-800"
                >
                  <td className="px-4 py-4 font-semibold">{service.name}</td>
                  <td className="px-4 py-4 text-slate-600 dark:text-brisa-200">
                    {service.idealFor}
                  </td>
                  <td className="px-4 py-4 text-slate-600 dark:text-brisa-200">
                    {service.sla}
                  </td>
                  <td className="px-4 py-4 text-slate-600 dark:text-brisa-200">
                    {service.crew}
                  </td>
                  <td className="px-4 py-4 text-slate-600 dark:text-brisa-200">
                    <ul className="space-y-1">
                      {service.deliverables.map((deliverable) => (
                        <li key={deliverable}>• {deliverable}</li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-4 py-4 text-slate-600 dark:text-brisa-200">
                    {service.addOns}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-3">
        {valuePillars.map((pillar) => (
          <article
            key={pillar.title}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-brisa-900/5 dark:border-brisa-800 dark:bg-brisa-950"
          >
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brisa-100 text-brisa-600 dark:bg-brisa-900/60 dark:text-brisa-200">
              <pillar.icon className="h-6 w-6" aria-hidden />
            </div>
            <p className="mt-4 text-sm uppercase tracking-[0.3em] text-brisa-500 dark:text-brisa-200">
              {pillar.title}
            </p>
            <h3 className="mt-2 text-2xl font-semibold">{pillar.headline}</h3>
            <p className="mt-3 text-sm text-slate-600 dark:text-brisa-200 leading-relaxed">
              {pillar.description}
            </p>
            <p className="mt-4 text-sm font-semibold text-brisa-600 dark:text-brisa-200">
              {pillar.proof}
            </p>
          </article>
        ))}
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl shadow-brisa-900/10 dark:border-brisa-800 dark:bg-brisa-950">
          <p className="text-xs uppercase tracking-[0.35em] text-brisa-600 dark:text-brisa-300">
            ¿Listo para migrar tu operación?
          </p>
          <h2 className="mt-3 text-3xl font-semibold">
            Agenda un diagnóstico con nuestro equipo.
          </h2>
          <ul className="mt-6 space-y-3 text-sm text-slate-600 dark:text-brisa-200">
            <li>• Analizamos tu inventario, SLA actuales y expectativas.</li>
            <li>• Definimos la mezcla de servicios y cuadrillas dedicadas.</li>
            <li>
              • Configuramos el portal, usuarios y alertas en menos de 48 h.
            </li>
          </ul>
          <p className="mt-6 text-sm text-slate-500 dark:text-brisa-300">
            Recibirás un plan detallado por email y podrás dar acceso al portal
            beta para validar el flujo antes de la migración completa.
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-brisa-800 dark:bg-brisa-950">
          <LeadCaptureForm />
        </div>
      </section>
    </main>
  );
}
