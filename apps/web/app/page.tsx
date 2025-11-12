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
  title: "Brisa Cubana Clean Intelligence · Turnovers premium en Miami",
  description:
    "Operamos turnovers same-day, deep cleaning y mantenimiento preventivo para propiedades premium en Miami con reportes en menos de 4 horas.",
  openGraph: {
    title: "Brisa Cubana Clean Intelligence",
    description:
      "Limpieza profesional con evidencia fotográfica y reportes en menos de 4 horas para STR y residencias premium en Miami.",
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

const serviceHighlights = [
  {
    title: "Turnovers same-day",
    description:
      "Checklists de 100+ puntos, dotación de amenities y reportes en menos de 4 horas para STR premium.",
    bullets: [
      "Cuadrillas on-call 24/7",
      "Inventario trazable (RFID)",
      "Evidencia fotográfica before/after",
    ],
  },
  {
    title: "Deep cleaning & mantenimiento",
    description:
      "Protocolos hoteleros para residencias de alto valor, con inspección de detalles y supervisión QA.",
    bullets: [
      "Equipos certificados",
      "Lista de 60 ítems mecánicos/eléctricos",
      "Entrega con firmas digitales",
    ],
  },
  {
    title: "Portal cliente + soporte",
    description:
      "Visibilidad total: agenda, reagenda, solicita restocks y recibe alertas en tiempo real desde cualquier dispositivo.",
    bullets: [
      "Magic links sin contraseñas",
      "Alertas proactivas y SLA claros",
      "Integración con PMS líderes",
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
      label: "Propiedades activas",
      value: portfolioStats?.activeProperties
        ? `${portfolioStats.activeProperties}+`
        : "70+",
    },
    {
      label: "Turnovers entregados",
      value: portfolioStats?.totalTurnovers
        ? portfolioStats.totalTurnovers.toLocaleString()
        : "12K+",
    },
    {
      label: "Rating promedio",
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
              Brisa Cubana Clean Intelligence
            </span>
            <h1 className="text-4xl sm:text-5xl font-semibold leading-tight">
              Limpieza profesional y documentada para propiedades premium en
              Miami.
            </h1>
            <p className="text-lg text-gray-600 dark:text-brisa-200 max-w-2xl">
              Turnovers same-day, deep cleaning y mantenimiento preventivo con
              evidencia fotográfica y reportes firmados en menos de cuatro
              horas.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="#contacto"
                className="inline-flex items-center justify-center rounded-full bg-brisa-900 px-5 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-brisa-800 dark:bg-brisa-50 dark:text-brisa-900 dark:hover:bg-white"
              >
                Agendar diagnóstico
              </Link>
              <Link
                href="#portal"
                className="inline-flex items-center justify-center rounded-full border border-brisa-200 px-5 py-2 text-sm font-semibold text-gray-900 transition hover:-translate-y-0.5 hover:border-brisa-400 dark:border-brisa-700 dark:text-white"
              >
                Ver portal
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
            eyebrow="Por qué Brisa Cubana"
            title="Operación premium con resultados medibles"
            description="Condensamos nuestro stack en tres pilares que reducen escalamiento operativo y elevan la experiencia del huésped."
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
            eyebrow="Servicios clave"
            title="Un solo equipo para turnovers, deep cleaning y portal cliente."
            description="Cada servicio incluye supervisión QA, inventario trazable y soporte directo para anfitriones y property managers."
          />
          <div className="grid gap-6 lg:grid-cols-3">
            {serviceHighlights.map((service) => (
              <div
                key={service.title}
                className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm dark:border-brisa-800 dark:bg-brisa-900"
              >
                <h3 className="text-xl font-semibold">{service.title}</h3>
                <p className="mt-3 text-sm text-gray-600 dark:text-brisa-200 leading-relaxed">
                  {service.description}
                </p>
                <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-brisa-300">
                  {service.bullets.map((bullet) => (
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
              title="Todo el control en un solo tablero"
              description="Magic links, alertas inteligentes y restocks sin fricción. Pensado para property managers y anfitriones con múltiples unidades."
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
