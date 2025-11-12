import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FAQSection } from "@/components/landing/faq-section";
import { LeadCaptureForm } from "@/components/landing/lead-capture-form";
import { SectionHeading } from "@/components/landing/section-heading";
import {
  operationsMockups,
  portalCapabilities,
  testimonials as fallbackTestimonials,
  valuePillars,
  fallbackFaqs,
} from "@/lib/marketing-content";
import {
  getPortfolioStats,
  getTestimonials,
  getFAQs,
  type FAQ,
} from "@/lib/api";

export const metadata: Metadata = {
  title: "Brisa OS · Software para empresas de limpieza",
  description:
    "Digitaliza tu operación con checklists hoteleros, portal cliente white-label e IA para reportes automáticos desde USD 99/mes.",
  openGraph: {
    title: "Brisa OS · Software para empresas de limpieza",
    description:
      "Sistema operativo para compañías de limpieza: evidencia automática, portal white-label e integraciones PMS.",
  },
  alternates: {
    canonical: "/",
    languages: {
      es: "/",
      en: "/en",
    },
  },
};

export const revalidate = 3600;

const featureHighlights = [
  {
    title: "Checklists hoteleros + evidencia",
    description:
      "Plantillas listas (turnover, deep clean, staging) con fotos, firmas y trazabilidad por cada visita.",
    bullets: [
      "Más de 100 pasos configurables",
      "Antes/después en alta resolución",
      "Roles y aprobaciones para tu equipo",
    ],
  },
  {
    title: "Portal cliente white-label",
    description:
      "Comparte un tablero con tu logotipo para que tus clientes aprueben extras, descarguen reportes y vean el historial en tiempo real.",
    bullets: [
      "Magic links sin contraseñas",
      "Tickets y aprobaciones en 1 clic",
      "Alertas por email, Slack o WhatsApp",
    ],
  },
  {
    title: "Automatización inteligente",
    description:
      "IA para generar resúmenes, detectar incidencias en fotos y sugerir restocks o upsells sin esfuerzo.",
    bullets: [
      "Resúmenes automáticos para tus clientes",
      "Detección de anomalías en evidencias",
      "Recomendaciones de inventario y servicios",
    ],
  },
];

const workflowSteps = [
  {
    title: "Configura en minutos",
    description:
      "Importa propiedades y clientes, elige plantillas y personaliza el portal con tu marca sin depender de desarrolladores.",
  },
  {
    title: "Opera y documenta",
    description:
      "Tus cuadrillas usan la app para seguir checklists, tomar fotos y registrar incidencias. Todo llega al panel automáticamente.",
  },
  {
    title: "Entrega y cobra",
    description:
      "Envía reportes premium, comparte el portal y registra pagos o upsells con evidencia y métricas listas para tus clientes.",
  },
];

const pricingPlans = [
  {
    name: "Starter",
    price: "USD 99",
    subtitle: "Hasta 5 propiedades · 10 usuarios",
    bullets: [
      "Checklists premium + fotos",
      "Portal estándar y reportes en PDF",
      "1 integración PMS o CRM",
      "Soporte por email",
    ],
  },
  {
    name: "Growth",
    price: "USD 249",
    subtitle: "Hasta 25 propiedades · 40 usuarios",
    bullets: [
      "Portal white-label y alertas multicanal",
      "Inventario/restocks + IA resúmenes",
      "Integraciones múltiples (Slack, PMS, CRM)",
      "Onboarding asistido y soporte prioritario",
    ],
  },
  {
    name: "Scale",
    price: "USD 499+",
    subtitle: "50+ propiedades · multi-tenant",
    bullets: [
      "Dashboards financieros y API abierta",
      "Automatizaciones personalizadas",
      "CSM dedicado y canal Slack privado",
      "Add-ons: usuarios, marcas y consultoría",
    ],
  },
];

export default async function LandingPage() {
  const [portfolioStats, testimonials, faqItems] = await Promise.all([
    getPortfolioStats(),
    getTestimonials(),
    getFAQs(),
  ]);

  const displayTestimonials =
    testimonials.length > 0 ? testimonials : fallbackTestimonials;
  type BasicFAQ = Pick<FAQ, "question" | "answer">;
  const displayFAQs: BasicFAQ[] = faqItems.length > 0 ? faqItems : fallbackFaqs;
  const curatedTestimonials = displayTestimonials.slice(0, 3);
  const ratingValue = (() => {
    if (portfolioStats?.averageRating) {
      const numeric = Number.parseFloat(`${portfolioStats.averageRating}`);
      if (Number.isFinite(numeric) && numeric > 0) {
        return `${numeric.toFixed(1)} ★`;
      }
    }
    return "4.9 ★";
  })();

  const heroStats = [
    {
      label: "Empresas digitalizadas",
      value: portfolioStats?.activeProperties
        ? `${portfolioStats.activeProperties}+`
        : "70+",
    },
    {
      label: "Operaciones documentadas",
      value: portfolioStats?.totalTurnovers
        ? portfolioStats.totalTurnovers.toLocaleString()
        : "12K+",
    },
    {
      label: "Satisfacción promedio",
      value: ratingValue,
    },
  ];
  const heroImage = operationsMockups[0];
  const portalItems = portalCapabilities.slice(0, 3);
  const pillarCards = valuePillars.slice(0, 3);

  return (
    <main className="min-h-screen bg-white text-gray-900 dark:bg-brisa-950 dark:text-brisa-50">
      <section className="px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="max-w-6xl mx-auto grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] items-center">
          <div className="space-y-6">
            <span className="text-xs tracking-[0.45em] uppercase text-brisa-600 dark:text-brisa-300">
              Brisa OS · SaaS para empresas de limpieza
            </span>
            <h1 className="text-4xl sm:text-5xl font-semibold leading-tight">
              Tu operación de limpieza, digitalizada en minutos.
            </h1>
            <p className="text-lg text-gray-600 dark:text-brisa-200 max-w-2xl">
              Checklists hoteleros, portal cliente white-label e IA para
              entregar evidencia impecable sin construir software propio.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="#contacto"
                className="inline-flex items-center justify-center rounded-full bg-brisa-900 px-5 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-brisa-800 dark:bg-brisa-50 dark:text-brisa-900 dark:hover:bg-white"
              >
                Solicitar demo
              </Link>
              <Link
                href="#como-funciona"
                className="inline-flex items-center justify-center rounded-full border border-brisa-200 px-5 py-2 text-sm font-semibold text-gray-900 transition hover:-translate-y-0.5 hover:border-brisa-400 dark:border-brisa-700 dark:text-white"
              >
                Ver cómo funciona
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {heroStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-gray-100 bg-white p-4 text-sm shadow-sm dark:border-brisa-800 dark:bg-brisa-900"
                >
                  <p className="text-2xl font-semibold text-brisa-700 dark:text-white">
                    {stat.value}
                  </p>
                  <p className="text-gray-500 dark:text-brisa-300">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm dark:border-brisa-800 dark:bg-brisa-900">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-brisa-300">
                <Image
                  src="/branding/brand-ai-concept.webp"
                  alt="Logotipo Brisa Cubana"
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full"
                  loading="lazy"
                />
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-brisa-600 dark:text-brisa-200">
                    Checklist digital
                  </p>
                  <p className="font-semibold text-gray-800 dark:text-white">
                    Evidence-first operations
                  </p>
                </div>
              </div>
              <Image
                src={heroImage.src}
                alt={heroImage.description}
                width={1200}
                height={900}
                className="w-full rounded-2xl border border-gray-100 dark:border-brisa-800"
                sizes="(max-width: 1024px) 100vw, 420px"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-brisa-50/70 dark:bg-brisa-900/50 py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Por qué Brisa OS"
            title="Software pensado para operaciones premium"
            description="Todos los aprendizajes de 12K+ servicios se condensan en módulos listos para usar, sin desarrollos a medida."
          />
          <div className="grid gap-6 mt-10 lg:grid-cols-3">
            {pillarCards.map((pillar) => (
              <div
                key={pillar.title}
                className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm dark:border-brisa-800 dark:bg-brisa-900"
              >
                <p className="text-sm uppercase tracking-[0.3em] text-brisa-500 dark:text-brisa-300">
                  {pillar.title}
                </p>
                <h3 className="mt-3 text-2xl font-semibold">
                  {pillar.headline}
                </h3>
                <p className="mt-4 text-sm text-gray-600 dark:text-brisa-200 leading-relaxed">
                  {pillar.description}
                </p>
                <p className="mt-4 text-sm font-semibold text-brisa-600 dark:text-brisa-200">
                  {pillar.proof}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="servicios" className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <SectionHeading
            eyebrow="Productividad"
            title="Todas las herramientas para operar como hotel cinco estrellas."
            description="Digitaliza tus procesos, estandariza la calidad y ofrece un portal que enamore a tus clientes."
          />
          <div className="grid gap-6 lg:grid-cols-3">
            {featureHighlights.map((feature) => (
              <div
                key={feature.title}
                className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm dark:border-brisa-800 dark:bg-brisa-900"
              >
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="mt-3 text-sm text-gray-600 dark:text-brisa-200 leading-relaxed">
                  {feature.description}
                </p>
                <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-brisa-300">
                  {feature.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-2">
                      <span
                        aria-hidden
                        className="text-brisa-600 dark:text-brisa-200"
                      >
                        •
                      </span>
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="portal"
        className="bg-brisa-50/70 dark:bg-brisa-900/50 py-16"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-10 lg:grid-cols-2 items-center">
          <div className="space-y-6">
            <SectionHeading
              eyebrow="Portal cliente"
              title="Portal cliente listo para entregar"
              description="Magic links, alertas y reportes bajo tu marca para que cada cliente confíe en tu operación."
            />
            <ul className="space-y-4">
              {portalItems.map((item) => (
                <li
                  key={item.title}
                  className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-brisa-800 dark:bg-brisa-950/60"
                >
                  <p className="text-base font-semibold text-gray-900 dark:text-white">
                    {item.title}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-brisa-200">
                    {item.description}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-brisa-600 dark:text-brisa-200">
                    {item.statLabel}: {item.statValue}
                  </p>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm dark:border-brisa-800 dark:bg-brisa-900">
            <Image
              src="/branding/portal-tech-modern.webp"
              alt="Vista previa del portal cliente Brisa Cubana"
              width={1600}
              height={1200}
              className="w-full rounded-2xl"
              sizes="(max-width: 1024px) 100vw, 640px"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      <section
        id="como-funciona"
        className="py-16 sm:py-20 border-t border-gray-100 dark:border-brisa-800"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <SectionHeading
            eyebrow="Cómo funciona"
            title="Sin desarrollos, sin fricción"
            description="Así se ve tu implementación con Brisa OS."
          />
          <div className="grid gap-6 md:grid-cols-3">
            {workflowSteps.map((step) => (
              <div
                key={step.title}
                className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm dark:border-brisa-800 dark:bg-brisa-900"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brisa-100 text-xs font-bold uppercase text-brisa-700 dark:bg-brisa-800 dark:text-brisa-200">
                  {workflowSteps.indexOf(step) + 1}
                </span>
                <h3 className="mt-4 text-xl font-semibold">{step.title}</h3>
                <p className="mt-3 text-sm text-gray-600 dark:text-brisa-200 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="planes"
        className="py-16 sm:py-20 bg-brisa-50/70 dark:bg-brisa-900/40"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <SectionHeading
            eyebrow="Planes claros"
            title="Precio accesible para cada etapa"
            description="Empieza con un plan pequeño y evoluciona sin migrar de plataforma."
          />
          <div className="grid gap-6 md:grid-cols-3">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm dark:border-brisa-800 dark:bg-brisa-900 flex flex-col"
              >
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-brisa-500 dark:text-brisa-300">
                    {plan.name}
                  </p>
                  <h3 className="mt-2 text-3xl font-semibold">{plan.price}</h3>
                  <p className="text-sm text-gray-500 dark:text-brisa-300">
                    {plan.subtitle}
                  </p>
                </div>
                <ul className="mt-5 space-y-2 text-sm text-gray-600 dark:text-brisa-200 flex-1">
                  {plan.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-2">
                      <span
                        aria-hidden
                        className="text-brisa-600 dark:text-brisa-200"
                      >
                        •
                      </span>
                      {bullet}
                    </li>
                  ))}
                </ul>
                <Link
                  href="#contacto"
                  className="mt-6 inline-flex items-center justify-center rounded-full border border-brisa-200 px-4 py-2 text-sm font-semibold text-gray-900 transition hover:-translate-y-0.5 hover:border-brisa-400 dark:border-brisa-700 dark:text-white"
                >
                  Hablar con ventas
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {!!curatedTestimonials.length && (
        <section id="testimonios" className="py-16 sm:py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <SectionHeading
              eyebrow="Testimonios"
              title="Hosts y PMs con operación documentada"
              description="Calidad, evidencia y soporte en tiempo real."
            />
            <div className="grid gap-6 md:grid-cols-3">
              {curatedTestimonials.map((testimonial) => (
                <div
                  key={testimonial.author + testimonial.role}
                  className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm dark:border-brisa-800 dark:bg-brisa-900"
                >
                  <p className="text-sm leading-relaxed text-gray-700 dark:text-brisa-200">
                    “{testimonial.quote}”
                  </p>
                  <p className="mt-4 text-sm font-semibold text-gray-900 dark:text-white">
                    {testimonial.author}
                  </p>
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-brisa-300">
                    {testimonial.role}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {displayFAQs.length > 0 && (
        <FAQSection
          id="faq"
          items={displayFAQs.map((item) => ({
            question: item.question,
            answer: item.answer,
          }))}
        />
      )}

      <section id="contacto" className="bg-brisa-50/60 dark:bg-brisa-950 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Agendar diagnóstico"
            title="Cuéntanos de tu operación y recibe un plan personalizado."
            description="Respondemos en menos de 24 horas hábiles con una propuesta clara, métricas de referencia y próximos pasos."
          />
          <div className="mt-10 rounded-3xl border border-gray-100 bg-white shadow-sm dark:border-brisa-800 dark:bg-brisa-900">
            <LeadCaptureForm id="contacto-form" />
          </div>
        </div>
      </section>
    </main>
  );
}
