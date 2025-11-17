import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "One-pager · Brisa OS",
  description:
    "Resumen comercial de Brisa OS: sistema operativo para empresas de limpieza premium.",
  alternates: {
    canonical: "/recursos/one-pager",
  },
};

const plans = [
  {
    name: "Starter",
    price: "USD 99",
    audience: "1-5 propiedades",
    features: [
      "Checklists premium",
      "Portal estándar",
      "1 integración PMS",
      "Soporte email",
    ],
  },
  {
    name: "Growth",
    price: "USD 249",
    audience: "5-25 propiedades",
    features: [
      "Portal white-label",
      "Inventario & restocks",
      "Alertas multicanal + IA resúmenes",
      "Soporte prioritario",
    ],
  },
  {
    name: "Scale",
    price: "USD 499+",
    audience: "25+ propiedades / multi-tenant",
    features: [
      "Dashboards financieros",
      "API + webhooks",
      "IA avanzada e integraciones dedicadas",
      "Success manager",
    ],
  },
];

export default function OnePagerPage() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-12 px-4 py-16 sm:px-6 lg:px-8">
      <section className="space-y-4 text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-brisa-500">
          Brisa OS · One-pager
        </p>
        <h1 className="text-4xl font-semibold text-gray-900">
          Software para empresas de limpieza premium
        </h1>
        <p className="mx-auto max-w-3xl text-base text-gray-600">
          Checklists hoteleros, evidencia automática y portal cliente
          white-label. Diseñado para operadores que necesitan mostrar resultados
          impecables y crecer sin construir tecnología propia.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/#contacto"
            className="inline-flex items-center justify-center rounded-full bg-brisa-900 px-5 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-brisa-800"
          >
            Completar formulario de interés
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-brisa-200 px-5 py-2 text-sm font-semibold text-gray-900 transition hover:-translate-y-0.5 hover:border-brisa-400"
          >
            Volver a la landing
          </Link>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold">Problema</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-gray-600">
            <li>Evidencia dispersa (WhatsApp, Drive) y cero trazabilidad.</li>
            <li>Clientes sin acceso a SLA ni portal white-label.</li>
            <li>Operación manual: agenda, inventario, cobros y reportes.</li>
          </ul>
        </div>
        <div className="space-y-3 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold">Solución</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-gray-600">
            <li>App crews para checklist + fotos + firmas.</li>
            <li>Portal cliente white-label con magic links y aprobaciones.</li>
            <li>Panel operativo con calendario, inventario y KPIs.</li>
            <li>IA para resúmenes automáticos y detección de incidencias.</li>
          </ul>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Planes de referencia</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-brisa-500">
                {plan.name}
              </p>
              <p className="mt-2 text-3xl font-semibold">{plan.price}</p>
              <p className="text-sm text-gray-500">{plan.audience}</p>
              <ul className="mt-4 space-y-2 text-sm text-gray-600">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <span
                      aria-hidden
                      className="text-brisa-600 dark:text-brisa-200"
                    >
                      •
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold">Próximos hitos</h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-gray-600">
          <li>Multi-tenant GA completo y selector de tenant en UI.</li>
          <li>IA de resúmenes automáticos y detección de incidencias.</li>
          <li>Stripe Billing live + add-ons.</li>
          <li>Marketplace de integraciones PMS / housekeeping.</li>
        </ol>
      </section>

      <section className="space-y-4 text-center">
        <h2 className="text-2xl font-semibold">
          ¿Listo para digitalizar tu operación?
        </h2>
        <p className="text-base text-gray-600">
          Agenda un diagnóstico y recibe acceso al sandbox multi-tenant en menos
          de 7 días.
        </p>
        <Link
          href="/#contacto"
          className="inline-flex items-center justify-center rounded-full bg-brisa-900 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-brisa-800"
        >
          Completar formulario de interés SaaS
        </Link>
      </section>
    </main>
  );
}
