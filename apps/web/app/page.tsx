import type { Metadata } from "next";
import { ArrowUpRightIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { FAQSection } from "@/components/landing/faq-section";
import { LeadCaptureForm } from "@/components/landing/lead-capture-form";
import { PricingTiers } from "@/components/landing/pricing-tiers";
import { MarketingLink } from "@/components/landing/marketing-link";
import {
  ScrollProgress,
  ScrollReveal,
  StaggerContainer,
  StaggerItem,
  GradientMesh,
  TiltCard,
} from "@/components/ui";
import {
  differentiators,
  fallbackFaqs,
  operationsMockups,
  portalCapabilities,
  pricingTiers as fallbackPricingTiers,
  processSteps,
  qaHighlights,
  serviceComparisons,
  socialLinks,
  testimonials as fallbackTestimonials,
  valuePillars,
} from "@/lib/marketing-content";
import {
  MarketHighlightsGrid,
  MarketStatsSnapshot,
} from "@/components/landing/market-stats";
import {
  getPortfolioStats,
  getTestimonials,
  getFAQs,
  getPricingTiers,
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

const clientPortalFeatures = [
  {
    icon: "🔗",
    title: "Acceso sin contraseñas",
    description:
      "Recibes un enlace mágico por email válido por 12 horas. Sin apps que instalar, sin credenciales que recordar.",
  },
  {
    icon: "📸",
    title: "Evidencias fotográficas en menos de 4h",
    description:
      "Cada turno incluye 15-30 fotos profesionales con timestamp y checklist digital firmado descargable en PDF.",
  },
  {
    icon: "📅",
    title: "Gestiona reservas desde cualquier lugar",
    description:
      "Solicita turnos, reagenda servicios y cancela con políticas claras. Todo desde tu teléfono o laptop.",
  },
];

export const revalidate = 3600;

export default async function LandingPage() {
  // Obtener datos dinámicos de la API con fallbacks
  const [portfolioStats, testimonials, faqItems, pricingTiers] =
    await Promise.all([
      getPortfolioStats(),
      getTestimonials(),
      getFAQs(),
      getPricingTiers(),
    ]);

  // Usar fallbacks si no hay datos de la API
  const displayTestimonials =
    testimonials.length > 0 ? testimonials : fallbackTestimonials;
  const displayPricingTiers =
    pricingTiers.length > 0 ? pricingTiers : fallbackPricingTiers;
  const displayFAQs = faqItems.length > 0 ? faqItems : fallbackFaqs;
  return (
    <main className="min-h-screen bg-white dark:bg-brisa-950 text-gray-900 dark:text-brisa-50">
      {/* Scroll Progress Bar */}
      <ScrollProgress position="top" thickness={3} glow />

      <div className="relative overflow-hidden bg-gradient-to-br from-brisa-100 via-white to-white dark:from-brisa-900/60 dark:via-brisa-950 dark:to-brisa-950">
        {/* Gradient Mesh Background - Premium Effect */}
        <GradientMesh
          colors={{
            primary: "rgba(20, 184, 166, 0.3)",
            secondary: "rgba(139, 92, 246, 0.25)",
            accent: "rgba(6, 182, 212, 0.3)",
          }}
          opacity={0.4}
          shimmer
        />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
          <header className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] items-center">
            <div className="flex flex-col gap-6 lg:gap-8">
              <ScrollReveal variant="fadeDown" delay={0.1}>
                <span className="text-xs tracking-[0.45em] uppercase text-brisa-600 dark:text-brisa-300">
                  Brisa Cubana Clean Intelligence
                </span>
              </ScrollReveal>

              <ScrollReveal variant="fadeUp" delay={0.2}>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.05] max-w-3xl">
                  Limpieza profesional y documentada para propiedades premium en
                  Miami.
                </h1>
              </ScrollReveal>

              <ScrollReveal variant="fadeUp" delay={0.3}>
                <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 dark:text-brisa-200 max-w-2xl">
                  Turnovers same-day con checklists de más de 100 puntos, deep
                  cleaning y mantenimiento preventivo con reportes en menos de 4
                  horas.
                </p>
              </ScrollReveal>

              <ScrollReveal variant="fadeUp" delay={0.4}>
                <div className="flex flex-wrap gap-4">
                  <MarketingLink
                    href="/?plan=turnover&inventory=6-15%20unidades#contacto"
                    eventName="cta_request_proposal"
                    metadata={{ placement: "hero", target: "contact_form" }}
                    className="inline-flex items-center justify-center rounded-full bg-[#0d2944] px-6 py-3 text-base font-semibold text-white shadow-lg shadow-[#0d294433] hover:bg-[#11466d] hover:shadow-xl hover:shadow-[#0d29444d] transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1ecad3]"
                    prefetch={false}
                  >
                    Solicitar cotización
                  </MarketingLink>
                  <MarketingLink
                    href="/clientes"
                    eventName="cta_portal_demo"
                    metadata={{ placement: "hero" }}
                    className="inline-flex items-center justify-center rounded-full border border-transparent px-4 py-3 text-base font-semibold text-[#0f8c94] hover:text-[#0a4750] hover:bg-[#ecfcff] dark:text-[#7adfe9] dark:hover:text-white dark:hover:bg-[#0c6870]/40 transition-all"
                  >
                    Conoce el portal (beta privada)
                  </MarketingLink>
                </div>
              </ScrollReveal>
            </div>
            <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-xl shadow-brisa-900/5 dark:border-brisa-800 dark:bg-brisa-950">
              <div className="space-y-6">
                <div className="relative overflow-hidden rounded-2xl">
                  <div className="pointer-events-none absolute top-4 left-4 z-10 flex items-center gap-3 rounded-full bg-white/85 px-3 py-2 shadow-lg shadow-brisa-900/10 backdrop-blur-sm dark:bg-brisa-900/80 dark:shadow-brisa-900/40">
                    <Image
                      src="/branding/brand-ai-concept.webp"
                      alt="Logotipo Brisa Cubana"
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-full"
                    />
                    <div className="text-xs font-semibold uppercase tracking-[0.32em] text-brisa-600 dark:text-brisa-200">
                      Brisa Cubana
                    </div>
                  </div>
                  <Image
                    src="/branding/hero-turnover-luxury.webp"
                    alt="Suite de lujo lista después de servicio de limpieza premium - Brisa Cubana Clean Intelligence"
                    width={1920}
                    height={1440}
                    priority
                    className="h-auto w-full rounded-xl shadow-lg ring-1 ring-brisa-100/60 dark:ring-brisa-800/60"
                    sizes="(max-width: 1024px) 100vw, 420px"
                  />
                </div>
                <h3 className="text-lg font-semibold text-brisa-700 dark:text-white">
                  Lo que entregamos en cada turno
                </h3>
                <ul className="space-y-4 text-sm sm:text-base text-gray-600 dark:text-brisa-200">
                  <li className="flex gap-3">
                    <span
                      aria-hidden
                      className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-brisa-100 text-brisa-600 font-semibold"
                    >
                      1
                    </span>
                    Checklists de 100+ puntos alineados al estándar Enhanced
                    Cleaning y firmas digitales al cierre.
                  </li>
                  <li className="flex gap-3">
                    <span
                      aria-hidden
                      className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-brisa-100 text-brisa-600 font-semibold"
                    >
                      2
                    </span>
                    Inventario trazable (RFID) y restocking completo para evitar
                    reclamos de huéspedes.
                  </li>
                  <li className="flex gap-3">
                    <span
                      aria-hidden
                      className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-brisa-100 text-brisa-600 font-semibold"
                    >
                      3
                    </span>
                    Evidencia fotográfica y reporte en menos de 4 horas listo
                    para responder reseñas.
                  </li>
                </ul>
                <MarketStatsSnapshot />
              </div>
            </div>
          </header>
        </div>
      </div>

      <section className="relative -mt-12 sm:-mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <MarketHighlightsGrid />
        </div>
      </section>

      <section className="relative mt-24 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-pattern-waves opacity-40 dark:opacity-20" />
        <div className="relative mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">
          <article className="rounded-3xl border border-white/80 bg-white/90 p-6 shadow-xl shadow-brisa-900/10 dark:border-brisa-700/40 dark:bg-brisa-900/80">
            <span className="inline-flex items-center gap-2 rounded-full border border-brisa-300/60 bg-brisa-50/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-brisa-600 dark:border-brisa-500/40 dark:bg-brisa-800/60 dark:text-brisa-200">
              Before / After · Cocina
            </span>
            <h2 className="mt-4 text-2xl font-semibold text-gray-900 dark:text-white">
              Documentamos mejoras con evidencia comparable
            </h2>
            <p className="mt-3 text-sm text-gray-600 dark:text-brisa-200">
              Cada servicio incluye fotos “antes y después” y checklist firmado
              digitalmente. Tus propietarios reciben un reporte que muestra el
              impacto real del Turnover Premium y los upsells ejecutados.
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <figure className="overflow-hidden rounded-2xl border border-brisa-100/80 bg-white shadow-md dark:border-brisa-800/50 dark:bg-brisa-900/60">
                <Image
                  src="/branding/kitchen-before.webp"
                  alt="Cocina antes del servicio Brisa Cubana"
                  width={1500}
                  height={899}
                  className="h-auto w-full object-cover"
                />
                <figcaption className="px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-brisa-500 dark:text-brisa-300">
                  Antes
                </figcaption>
              </figure>
              <figure className="overflow-hidden rounded-2xl border border-brisa-100/80 bg-white shadow-lg shadow-brisa-900/10 dark:border-brisa-700/60 dark:bg-brisa-900/60">
                <Image
                  src="/branding/kitchen-after.webp"
                  alt="Cocina impecable tras Turnover Premium"
                  width={1500}
                  height={1000}
                  className="h-auto w-full object-cover"
                />
                <figcaption className="px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-brisa-500 dark:text-brisa-200">
                  Después
                </figcaption>
              </figure>
            </div>
          </article>
          <article className="rounded-3xl border border-white/80 bg-white/90 p-6 shadow-xl shadow-brisa-900/10 dark:border-brisa-700/40 dark:bg-brisa-900/80">
            <span className="inline-flex items-center gap-2 rounded-full border border-rose-300/40 bg-rose-50/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-rose-500 dark:border-rose-500/40 dark:bg-rose-950/30 dark:text-rose-200">
              Before / After · Baño
            </span>
            <h2 className="mt-4 text-2xl font-semibold text-gray-900 dark:text-white">
              Estándar hotelero desde griferías hasta amenities
            </h2>
            <p className="mt-3 text-sm text-gray-600 dark:text-brisa-200">
              El protocolo Deep Clean Brickell Collection incluye saneamiento de
              juntas, pulido de superficies delicadas y aromatización. El
              reporte QA muestra cada mejora para sostener reseñas 5 ⭐.
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <figure className="overflow-hidden rounded-2xl border border-brisa-100/80 bg-white shadow-md dark:border-brisa-800/50 dark:bg-brisa-900/60">
                <Image
                  src="/branding/bathroom-before.webp"
                  alt="Baño antes de la limpieza profunda"
                  width={1500}
                  height={1000}
                  className="h-auto w-full object-cover"
                />
                <figcaption className="px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-brisa-500 dark:text-brisa-300">
                  Antes
                </figcaption>
              </figure>
              <figure className="overflow-hidden rounded-2xl border border-brisa-100/80 bg-white shadow-lg shadow-brisa-900/10 dark:border-brisa-700/60 dark:bg-brisa-900/60">
                <Image
                  src="/branding/bathroom-after.webp"
                  alt="Baño premium después de Deep Clean"
                  width={1500}
                  height={2249}
                  className="h-auto w-full object-cover"
                />
                <figcaption className="px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-brisa-500 dark:text-brisa-200">
                  Después
                </figcaption>
              </figure>
            </div>
          </article>
        </div>
      </section>

      {/* Before/After Dormitorios */}
      <section className="relative mt-16 px-4 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-4xl">
          <article className="rounded-3xl border border-white/80 bg-white/90 p-6 shadow-xl shadow-brisa-900/10 dark:border-brisa-700/40 dark:bg-brisa-900/80">
            <span className="inline-flex items-center gap-2 rounded-full border border-purple-300/60 bg-purple-50/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-purple-600 dark:border-purple-500/40 dark:bg-purple-950/30 dark:text-purple-200">
              Before / After · Dormitorio
            </span>
            <h2 className="mt-4 text-2xl font-semibold text-gray-900 dark:text-white">
              Staging profesional para fotografías five-star
            </h2>
            <p className="mt-3 text-sm text-gray-600 dark:text-brisa-200">
              Cada dormitorio recibe staging completo: ropa de cama luxury,
              planchado de cobertores, acomodo de almohadas decorativas y ajuste
              de iluminación para que tus fotos de Airbnb destaquen en
              búsquedas.
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <figure className="overflow-hidden rounded-2xl border border-brisa-100/80 bg-white shadow-md dark:border-brisa-800/50 dark:bg-brisa-900/60">
                <Image
                  src="/branding/bedroom-before.webp"
                  alt="Dormitorio antes del servicio de staging Brisa Cubana"
                  width={1500}
                  height={1000}
                  loading="lazy"
                  className="h-auto w-full object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <figcaption className="px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-brisa-500 dark:text-brisa-300">
                  Antes
                </figcaption>
              </figure>
              <figure className="overflow-hidden rounded-2xl border border-brisa-100/80 bg-white shadow-lg shadow-brisa-900/10 dark:border-brisa-700/60 dark:bg-brisa-900/60">
                <Image
                  src="/branding/bedroom-after.webp"
                  alt="Dormitorio con staging premium listo para fotos profesionales"
                  width={1500}
                  height={1000}
                  loading="lazy"
                  className="h-auto w-full object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <figcaption className="px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-brisa-500 dark:text-brisa-200">
                  Después
                </figcaption>
              </figure>
            </div>
            <div className="mt-6 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 p-4 border border-purple-200/50 dark:border-purple-800/30">
              <p className="text-sm text-gray-700 dark:text-brisa-200">
                <span className="font-semibold text-purple-600 dark:text-purple-300">
                  Pro tip:
                </span>{" "}
                El staging premium puede incrementar tu ADR entre $15-$35/noche
                según análisis de portfolios en Brickell y Edgewater. Incluido
                en paquete Turnover Premium sin costo adicional.
              </p>
            </div>
          </article>
        </div>
      </section>

      <section id="equipo" className="mt-24 px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,440px)]">
          <div className="space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-brisa-300/60 bg-brisa-50/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-brisa-600 dark:border-brisa-500/40 dark:bg-brisa-800/60 dark:text-brisa-200">
              Equipo hotelero · 24/7
            </span>
            <h2 className="text-3xl font-semibold text-gray-900 dark:text-white sm:text-4xl">
              Ex housekeepers de hotel cinco estrellas al mando de tu operación
            </h2>
            <p className="text-base text-gray-600 dark:text-brisa-200">
              Daniela, Lucía y el equipo vienen de liderar housekeeping en
              hoteles de Brickell. Hoy aplican ese mismo rigor a cada propiedad
              STR: protocolos escritos, auditorías semanales y comunicación con
              tus huéspedes en tiempo real.
            </p>
            <ul className="space-y-3 text-sm text-gray-600 dark:text-brisa-200">
              <li className="flex items-start gap-2">
                <span aria-hidden className="mt-0.5 text-brisa-500">
                  •
                </span>
                97&nbsp;% de satisfacción en pilotos Brickell/Edgewater (Q3
                2025) documentado en portal.
              </li>
              <li className="flex items-start gap-2">
                <span aria-hidden className="mt-0.5 text-brisa-500">
                  •
                </span>
                Supervisión QA con doble firma (equipo + supervisor) y fotos
                obligatorias en cada servicio.
              </li>
              <li className="flex items-start gap-2">
                <span aria-hidden className="mt-0.5 text-brisa-500">
                  •
                </span>
                Equipo bilingüe para coordinar accesos, reportes y upsells con
                propietarios e inquilinos.
              </li>
            </ul>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 rounded-[2.5rem] bg-pattern-tile opacity-40 dark:opacity-30" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-2xl shadow-brisa-900/20 dark:border-brisa-700/40 dark:bg-brisa-900/70">
              <Image
                src="/branding/team-cleaning-action.webp"
                alt="Equipo Brisa Cubana realizando un servicio premium"
                width={1920}
                height={1280}
                className="h-auto w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section
        id="amenidades"
        className="mt-24 px-4 sm:px-6 lg:px-8 scroll-mt-24"
      >
        <div className="mx-auto max-w-6xl space-y-8">
          <div className="flex flex-col gap-4 text-center">
            <span className="mx-auto inline-flex items-center gap-2 rounded-full border border-brisa-300/60 bg-brisa-50/80 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-brisa-600 dark:border-brisa-500/40 dark:bg-brisa-800/60 dark:text-brisa-200">
              Amenidades premium · staging
            </span>
            <h2 className="text-3xl font-semibold text-gray-900 dark:text-white sm:text-4xl">
              Kits de bienvenida y staging con estándar hotelero
            </h2>
            <p className="mx-auto max-w-3xl text-sm text-gray-600 dark:text-brisa-200">
              Toallas spa, difusores Pura, snack bar curado y reposición de
              essentials se registran en el portal con fotos y responsables. Así
              evitas reclamos y elevas la experiencia de cada huésped.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                src: "/branding/amenities-kit.webp",
                alt: "Kit de amenidades premium listo para huéspedes",
                title: "Kit completo de amenidades",
              },
              {
                src: "/branding/amenities-detail.webp",
                alt: "Detalle de amenidades spa con toallas y difusor",
                title: "Detalle spa & aromas integrados",
              },
              {
                src: "/branding/amenities-towels.webp",
                alt: "Toallas spa dobladas con amenities hoteleros",
                title: "Textiles hoteleros siempre listos",
              },
              {
                src: "/branding/staging-amenity-refresh.webp",
                alt: "Servicio de amenity refresh con reposición completa",
                title: "Amenity refresh back-to-back",
              },
            ].map((item) => (
              <figure
                key={item.title}
                className="group overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-lg shadow-brisa-900/10 transition hover:-translate-y-1 hover:shadow-2xl dark:border-brisa-700/40 dark:bg-brisa-900/80"
              >
                <Image
                  src={item.src}
                  alt={item.alt}
                  width={1500}
                  height={1125}
                  className="h-auto w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <figcaption className="px-4 py-4 text-center text-sm font-semibold text-gray-800 dark:text-brisa-100">
                  {item.title}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Equipo en Acción */}
      <section className="bg-gradient-to-br from-brisa-50 via-white to-brisa-50 dark:from-brisa-900/40 dark:via-brisa-950 dark:to-brisa-900/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 rounded-full border border-brisa-300/60 bg-brisa-50/80 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-brisa-600 dark:border-brisa-500/40 dark:bg-brisa-800/60 dark:text-brisa-200">
              En acción · Estándares reales
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-semibold">
              Cada servicio, ejecutado con rigor hotelero
            </h2>
            <p className="mt-4 text-base sm:text-lg text-gray-600 dark:text-brisa-300 max-w-2xl mx-auto">
              Nuestro equipo aplica protocolos de housekeeping de hotel cinco
              estrellas en cada turno, documentando el proceso completo.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="group relative overflow-hidden rounded-3xl border border-gray-200 dark:border-brisa-800 shadow-lg hover:shadow-2xl transition-all">
              <Image
                src="/branding/vertical-housekeeper-bed.webp"
                alt="Housekeeping profesional preparando cama con ropa de hotel premium"
                width={1920}
                height={1280}
                loading="lazy"
                className="h-auto w-full object-cover aspect-[3/4] group-hover:scale-110 transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brisa-900/90 via-brisa-900/50 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="font-semibold text-lg">Bed Making Hotelero</h3>
                <p className="text-sm text-white/90 mt-2">
                  Técnica hospital corner + planchado en sitio
                </p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-3xl border border-gray-200 dark:border-brisa-800 shadow-lg hover:shadow-2xl transition-all">
              <Image
                src="/branding/vertical-housekeeper-sheets.webp"
                alt="Equipo cambiando sábanas con protocolo sanitario certificado"
                width={1920}
                height={1280}
                loading="lazy"
                className="h-auto w-full object-cover aspect-[3/4] group-hover:scale-110 transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brisa-900/90 via-brisa-900/50 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="font-semibold text-lg">Cambio Sanitario</h3>
                <p className="text-sm text-white/90 mt-2">
                  Protocolo EPA + doble revisión de manchas
                </p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-3xl border border-gray-200 dark:border-brisa-800 shadow-lg hover:shadow-2xl transition-all">
              <Image
                src="/branding/team-professional-cleaning-3.webp"
                alt="Supervisora realizando inspección final con checklist digital"
                width={1920}
                height={1280}
                loading="lazy"
                className="h-auto w-full object-cover aspect-[3/4] group-hover:scale-110 transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brisa-900/90 via-brisa-900/50 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="font-semibold text-lg">Inspección Final</h3>
                <p className="text-sm text-white/90 mt-2">
                  QA checklist + firma digital + evidencias
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Casos reales */}
      <section
        id="casos"
        className="bg-white dark:bg-brisa-950 py-16 sm:py-20 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="text-center space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-brisa-300/60 bg-brisa-50/80 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-brisa-600 dark:border-brisa-500/40 dark:bg-brisa-800/60 dark:text-brisa-200">
              Casos reales
            </span>
            <h2 className="text-3xl sm:text-4xl font-semibold text-[#0d2944] dark:text-white">
              ¿Qué logramos con anfitriones y property managers?
            </h2>
            <p className="text-base sm:text-lg text-gray-600 dark:text-brisa-200 max-w-3xl mx-auto">
              Testeamos cada feature con clientes reales. Estos highlights
              resumen lo que obtuvieron los primeros 40 portafolios beta.
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            {displayTestimonials.slice(0, 2).map((testimonial) => (
              <article
                key={testimonial.quote}
                className="h-full rounded-3xl border border-gray-200 bg-white p-8 shadow-lg shadow-brisa-900/5 dark:border-brisa-800 dark:bg-brisa-950"
              >
                <p className="text-lg italic text-gray-700 dark:text-brisa-100">
                  “{testimonial.quote}”
                </p>
                <div className="mt-6">
                  <p className="text-sm font-semibold text-[#0d2944] dark:text-white">
                    {testimonial.author}
                  </p>
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-brisa-300">
                    {testimonial.role}
                  </p>
                </div>
              </article>
            ))}
            <article className="rounded-3xl border border-white/20 bg-gradient-to-br from-[#0d2944] via-[#102f55] to-[#174469] p-8 text-white shadow-2xl shadow-brisa-900/30">
              <p className="text-sm uppercase tracking-[0.35em] text-white/70">
                KPI beta
              </p>
              <h3 className="mt-3 text-3xl font-semibold">
                +0.25⭐ en rating de limpieza promedio
              </h3>
              <p className="mt-4 text-sm text-white/90">
                Los anfitriones de Airbnb/Wynwood redujeron reclamos de limpieza
                en un 82 % tras tres ciclos. El turnaround visual y el checklist
                firmado fueron claves para responder reseñas.
              </p>
              <ul className="mt-6 space-y-2 text-sm leading-relaxed text-white/80">
                <li>• 15-30 fotos por servicio disponibles en el portal</li>
                <li>• Alertas automáticas cuando un PMS modifica reservas</li>
                <li>• Reportes exportables en PDF/CSV para dueños.</li>
              </ul>
            </article>
            <article className="rounded-3xl border border-gray-200 bg-white p-8 shadow-lg dark:border-brisa-800 dark:bg-brisa-950">
              <p className="text-sm uppercase tracking-[0.35em] text-brisa-600 dark:text-brisa-300">
                Caso corporativo · Brickell
              </p>
              <h3 className="mt-3 text-2xl font-semibold text-[#0d2944] dark:text-white">
                120 unidades coordinadas con 4 cuadrillas
              </h3>
              <p className="mt-4 text-sm text-gray-600 dark:text-brisa-200">
                Implementamos inventario RFID, reposición automática y doble QA.
                El equipo de operaciones ahora recibe alertas en Slack con cada
                incidencia y evidencia fotográfica adjunta.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-brisa-100 bg-brisa-50 p-4 text-center dark:border-brisa-800 dark:bg-brisa-900/60">
                  <p className="text-sm uppercase tracking-wide text-brisa-600 dark:text-brisa-200">
                    SLA real
                  </p>
                  <p className="text-2xl font-semibold text-[#0d2944] dark:text-white">
                    98 %
                  </p>
                </div>
                <div className="rounded-2xl border border-brisa-100 bg-brisa-50 p-4 text-center dark:border-brisa-800 dark:bg-brisa-900/60">
                  <p className="text-sm uppercase tracking-wide text-brisa-600 dark:text-brisa-200">
                    Restocks automáticos
                  </p>
                  <p className="text-2xl font-semibold text-[#0d2944] dark:text-white">
                    {"<"}18 h
                  </p>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Atención al Detalle */}
      <section className="bg-white dark:bg-brisa-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 rounded-full border border-brisa-300/60 bg-brisa-50/80 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-brisa-600 dark:border-brisa-500/40 dark:bg-brisa-800/60 dark:text-brisa-200">
              Detalle Premium
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-semibold">
              Atención a cada detalle
            </h2>
            <p className="mt-4 text-base sm:text-lg text-gray-600 dark:text-brisa-300 max-w-2xl mx-auto">
              Desde griferías libres de cal hasta cristales impecables, cada
              superficie recibe el tratamiento que merece.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="group relative overflow-hidden rounded-3xl border border-gray-200 dark:border-brisa-800 shadow-lg hover:shadow-2xl transition-all">
              <Image
                src="/branding/cleaning-detail-faucet.webp"
                alt="Limpieza detallada de grifería con productos premium"
                width={1920}
                height={1280}
                loading="lazy"
                className="h-auto w-full object-cover aspect-square group-hover:scale-110 transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brisa-900/90 via-brisa-900/50 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="font-semibold text-lg">
                  Griferías sin residuos
                </h3>
                <p className="text-sm text-white/90 mt-2">
                  Productos especializados para eliminar cal y manchas
                </p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-3xl border border-gray-200 dark:border-brisa-800 shadow-lg hover:shadow-2xl transition-all">
              <Image
                src="/branding/cleaning-detail-glass.webp"
                alt="Limpieza de cristales y superficies de vidrio"
                width={1920}
                height={1280}
                loading="lazy"
                className="h-auto w-full object-cover aspect-square group-hover:scale-110 transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brisa-900/90 via-brisa-900/50 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="font-semibold text-lg">Cristales impecables</h3>
                <p className="text-sm text-white/90 mt-2">
                  Sin marcas ni rayas, acabado profesional garantizado
                </p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-3xl border border-gray-200 dark:border-brisa-800 shadow-lg hover:shadow-2xl transition-all">
              <Image
                src="/branding/cleaning-detail-counter.webp"
                alt="Desinfección de superficies de cocina y encimeras"
                width={1920}
                height={1280}
                loading="lazy"
                className="h-auto w-full object-cover aspect-square group-hover:scale-110 transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brisa-900/90 via-brisa-900/50 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="font-semibold text-lg">
                  Superficies sanitizadas
                </h3>
                <p className="text-sm text-white/90 mt-2">
                  Protocolo EPA para eliminar 99.9% de bacterias
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="oferta"
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 scroll-mt-24"
      >
        <div className="space-y-10">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.3em] text-brisa-500 dark:text-brisa-300">
              Oferta de valor
            </p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-semibold">
              Unimos operación premium, datos en vivo y soporte humano 24/7.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-gray-600 dark:text-brisa-300 leading-relaxed">
              Diseñamos el piloto para hosts y property managers que necesitan
              SLA estrictos, evidencia trazable y comunicación inmediata. Cada
              pilar combina procesos, tecnología y talento capacitado.
            </p>
          </div>
          <StaggerContainer className="grid gap-6 lg:grid-cols-3">
            {valuePillars.map((pillar) => (
              <StaggerItem key={pillar.title}>
                <TiltCard
                  maxTilt={6}
                  glowEffect
                  glowColor="rgba(14,165,233,0.15)"
                >
                  <div className="flex h-full flex-col rounded-3xl border border-gray-200 bg-white p-8 dark:border-brisa-800 dark:bg-brisa-950">
                    <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brisa-100 text-brisa-600 dark:bg-brisa-900/60 dark:text-brisa-200">
                      <pillar.icon className="h-6 w-6" aria-hidden />
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brisa-500 dark:text-brisa-300">
                      {pillar.title}
                    </p>
                    <h3 className="mt-3 text-2xl font-semibold text-brisa-700 dark:text-white leading-tight">
                      {pillar.headline}
                    </h3>
                    <p className="mt-3 text-sm sm:text-base leading-relaxed text-gray-600 dark:text-brisa-200 flex-1">
                      {pillar.description}
                    </p>
                    <span className="mt-6 inline-flex items-center justify-center rounded-full bg-brisa-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-brisa-600 dark:bg-brisa-900/60 dark:text-brisa-200">
                      {pillar.proof}
                    </span>
                  </div>
                </TiltCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
          <div className="flex flex-wrap items-center gap-4">
            <MarketingLink
              href="/?plan=turnover&inventory=6-15%20unidades#contacto"
              eventName="cta_value_pillars"
              metadata={{ placement: "value-pillar", plan: "turnover" }}
              className="inline-flex items-center justify-center rounded-full bg-brisa-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-brisa-500/40 transition hover:-translate-y-0.5 hover:bg-brisa-700 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brisa-400"
              prefetch={false}
            >
              Agenda diagnóstico express
            </MarketingLink>
            <span className="text-sm text-gray-600 dark:text-brisa-300">
              Confirma disponibilidad y recibe checklist personalizado en 24 h.
            </span>
          </div>
        </div>
      </section>

      <section
        id="servicios"
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 scroll-mt-24"
      >
        <div className="space-y-10">
          <div className="max-w-3xl">
            <h2 className="text-3xl sm:text-4xl font-semibold">
              Visibilidad operativa al instante
            </h2>
            <p className="mt-4 text-base sm:text-lg text-gray-600 dark:text-brisa-300 leading-relaxed">
              Consolida métricas, incidencias y consumos RFID en tiempo real. El
              portal centraliza el ciclo completo: programar, ejecutar,
              documentar y auditar.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {operationsMockups.map((mockup) => (
              <div
                key={mockup.title}
                className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-lg dark:border-brisa-800 dark:bg-brisa-950"
              >
                <div className="relative aspect-video overflow-hidden rounded-2xl">
                  <Image
                    src={mockup.src}
                    alt={mockup.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 360px"
                    placeholder="blur"
                    blurDataURL={mockup.placeholder}
                    loading="lazy"
                  />
                </div>
                <h3 className="mt-6 text-lg font-semibold text-brisa-700 dark:text-white">
                  {mockup.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-brisa-200">
                  {mockup.description}
                </p>
              </div>
            ))}
          </div>
          <div className="pt-12 border-t border-gray-200 dark:border-brisa-800 space-y-8">
            <div className="max-w-3xl">
              <h3 className="text-2xl sm:text-3xl font-semibold text-brisa-700 dark:text-white">
                Funcionalidades clave del portal
              </h3>
              <p className="mt-3 text-sm sm:text-base text-gray-600 dark:text-brisa-300 leading-relaxed">
                Todo el ciclo de servicio vive en un mismo lugar: desde la
                verificación de checklist hasta la reposición de amenities y
                alertas proactivas.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {portalCapabilities.map((capability) => (
                <div
                  key={capability.title}
                  className="flex h-full flex-col rounded-3xl border border-gray-200 bg-gradient-to-br from-white via-white to-brisa-50 p-6 shadow-sm dark:border-brisa-800 dark:from-brisa-900/70 dark:via-brisa-950 dark:to-brisa-950"
                >
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brisa-100 text-brisa-600 dark:bg-brisa-900/60 dark:text-brisa-200">
                    <capability.icon className="h-6 w-6" aria-hidden />
                  </div>
                  <h4 className="text-lg font-semibold text-brisa-700 dark:text-white">
                    {capability.title}
                  </h4>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-brisa-200 flex-1">
                    {capability.description}
                  </p>
                  <dl className="mt-5">
                    <dt className="text-xs uppercase tracking-[0.25em] text-brisa-500 dark:text-brisa-300">
                      {capability.statLabel}
                    </dt>
                    <dd className="text-base font-semibold text-brisa-700 dark:text-brisa-100">
                      {capability.statValue}
                    </dd>
                  </dl>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        id="precios"
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 scroll-mt-24"
      >
        <div className="grid gap-8 lg:grid-cols-2">
          <article className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-brisa-800 dark:bg-brisa-950">
            <div className="space-y-4">
              <header>
                <p className="text-xs uppercase tracking-[0.3em] text-brisa-500 dark:text-brisa-300">
                  Visibilidad total
                </p>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-brisa-50">
                  Historial completo de tus servicios
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-brisa-300">
                  Consulta el estado de cada turno, descarga reportes PDF con
                  fotos y firmas digitales, y revisa el historial completo de
                  tus propiedades.
                </p>
              </header>
              <div className="relative overflow-hidden rounded-2xl border border-brisa-200/70 shadow-inner dark:border-brisa-700">
                <Image
                  src="/assets/mockups/16-9/portal-bookings-1920w.webp"
                  alt="Portal del cliente mostrando historial de servicios completados con evidencias fotográficas"
                  width={1920}
                  height={793}
                  loading="lazy"
                  className="h-auto w-full"
                  sizes="(max-width: 1024px) 100vw, 560px"
                />
              </div>
            </div>
          </article>

          <article className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-brisa-800 dark:bg-brisa-950">
            <div className="space-y-4">
              <header>
                <p className="text-xs uppercase tracking-[0.3em] text-brisa-500 dark:text-brisa-300">
                  Matriz de servicios
                </p>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-brisa-50">
                  SLA y equipos asignados en tiempo real
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-brisa-300">
                  Controlamos indicadores por servicio (Turnover, Deep Clean,
                  Amenity Refresh) y alertamos antes de que un SLA se desvíe.
                </p>
              </header>
              <div className="relative overflow-hidden rounded-2xl border border-brisa-200/70 shadow-inner dark:border-brisa-700">
                <Image
                  src="/assets/mockups/16-9/portal-services-1920w.webp"
                  alt="Matriz de servicios con KPIs y equipos asignados"
                  width={1920}
                  height={626}
                  loading="lazy"
                  className="h-auto w-full"
                  sizes="(max-width: 1024px) 100vw, 560px"
                />
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] items-center">
          <article className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-brisa-800 dark:bg-brisa-950">
            <header>
              <p className="text-xs uppercase tracking-[0.3em] text-brisa-500 dark:text-brisa-300">
                Portal móvil
              </p>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-brisa-50">
                Acciones rápidas desde el teléfono
              </h3>
            </header>
            <ul className="mt-4 space-y-4 text-sm text-gray-600 dark:text-brisa-300">
              <li>
                🗓️ Solicita turnos y bloquea horarios críticos en menos de 30
                segundos.
              </li>
              <li>
                📸 Revisa evidencias fotográficas y reportes con firmas
                digitales desde cualquier lugar.
              </li>
              <li>
                💬 Comunícate 24/7 con operaciones vía WhatsApp Business sin
                salir del portal.
              </li>
            </ul>
          </article>
          <div className="relative mx-auto max-w-xs overflow-hidden rounded-[2rem] border border-brisa-200/60 shadow-2xl dark:border-brisa-700">
            <Image
              src="/assets/mockups/4-5/portal-mobile-1080w.webp"
              alt="Vista móvil del portal cliente mostrando acciones rápidas"
              width={1080}
              height={1342}
              loading="lazy"
              className="h-auto w-full"
              sizes="(max-width: 768px) 80vw, 420px"
            />
          </div>
        </div>
      </section>

      <section
        id="portal"
        className="bg-gray-50 dark:bg-brisa-900/40 scroll-mt-24"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] items-center">
            <div className="space-y-6">
              <h2 className="text-3xl sm:text-4xl font-semibold">
                Portal cliente y operaciones conectadas
              </h2>
              <p className="text-base sm:text-lg text-gray-600 dark:text-brisa-300 leading-relaxed">
                Consulta reservas, reagenda, confirma cancelaciones y descarga
                reportes en cualquier momento. Las alertas automáticas y el
                soporte prioritario por WhatsApp te mantienen al tanto cuando
                algo cambia.
              </p>
              <ul className="space-y-4 text-sm sm:text-base text-gray-700 dark:text-brisa-100">
                <li className="flex gap-3">
                  <span
                    aria-hidden
                    className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-brisa-600 text-white text-xs font-semibold"
                  >
                    ✓
                  </span>
                  Acceso 24/7 con enlace mágico seguro válido por 12 horas.
                </li>
                <li className="flex gap-3">
                  <span
                    aria-hidden
                    className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-brisa-600 text-white text-xs font-semibold"
                  >
                    ✓
                  </span>
                  Timeline con evidencias y reportes fotográficos de cada turno.
                </li>
                <li className="flex gap-3">
                  <span
                    aria-hidden
                    className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-brisa-600 text-white text-xs font-semibold"
                  >
                    ✓
                  </span>
                  Alertas automáticas al detectar cambios de agenda o
                  incidencias.
                </li>
              </ul>
            </div>
            <div
              className="rounded-3xl border border-gray-200 bg-gradient-to-br from-brisa-100 via-white to-white p-8 shadow-xl shadow-brisa-900/5 dark:border-brisa-800 dark:from-brisa-900/60 dark:via-brisa-950"
              data-mockup="portal-dashboard"
            >
              <div className="space-y-4">
                <div className="relative aspect-video overflow-hidden rounded-2xl border border-brisa-100/70 shadow-inner dark:border-brisa-800">
                  <Image
                    src="/assets/mockups/16-9/portal-dashboard-1920w.webp"
                    alt="Dashboard del portal cliente con métricas en tiempo real"
                    fill
                    loading="lazy"
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 360px"
                  />
                </div>
                <h3 className="text-lg font-semibold text-brisa-700 dark:text-white">
                  Métricas que importan para tu operación
                </h3>
              </div>
              <dl className="mt-6 space-y-5 text-sm sm:text-base text-gray-600 dark:text-brisa-200">
                <div>
                  <dt className="font-medium text-brisa-600 dark:text-brisa-300">
                    Turnovers on-time
                  </dt>
                  <dd>
                    Seguimiento en tiempo real con timeline, fotos finales y
                    estado de cada checklist.
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-brisa-600 dark:text-brisa-300">
                    Alertas automáticas
                  </dt>
                  <dd>
                    Notificaciones Slack/SMS cuando el PMS cambia reservas o se
                    registra una incidencia.
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-brisa-600 dark:text-brisa-300">
                    Auditoría e inventario
                  </dt>
                  <dd>
                    Control de amenities y consumibles con reposición programada
                    y trazabilidad por unidad.
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      <section id="qa" className="bg-[#0d2944] text-white scroll-mt-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] items-start">
            <div className="space-y-6">
              <p className="text-xs uppercase tracking-[0.3em] text-teal-200/80">
                QA & Garantía
              </p>
              <h2 className="text-3xl sm:text-4xl font-semibold">
                Calidad supervisada en cada turno, lista para auditar.
              </h2>
              <p className="text-base sm:text-lg text-white/80 leading-relaxed">
                Documentamos cada paso: checklist digital, fotos, firmas y
                escalamiento. Operaciones puede comprobar la calidad de forma
                remota mientras el cliente recibe reportes claros.
              </p>
              <div className="grid gap-6 sm:grid-cols-2">
                {qaHighlights.map((qa) => (
                  <div
                    key={qa.title}
                    className="flex h-full flex-col rounded-3xl border border-white/20 bg-white/5 p-6 backdrop-blur"
                  >
                    <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-white">
                      <qa.icon className="h-6 w-6" aria-hidden />
                    </div>
                    <h3 className="text-xl font-semibold">{qa.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/80 flex-1">
                      {qa.description}
                    </p>
                    <span className="mt-5 inline-flex items-center rounded-full border border-white/30 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/90">
                      {qa.proof}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <div className="relative overflow-hidden rounded-3xl border border-white/20 shadow-2xl">
                <Image
                  src="/branding/team-professional-cleaning-1.webp"
                  alt="Equipo profesional de Brisa Cubana realizando inspección de calidad con tablet"
                  width={1920}
                  height={1280}
                  loading="lazy"
                  className="h-auto w-full object-cover"
                  sizes="(max-width: 1024px) 100vw, 420px"
                />
              </div>
              <div className="rounded-3xl border border-white/20 bg-white/5 p-6 backdrop-blur">
                <h3 className="text-lg font-semibold">
                  Qué auditamos cada semana
                </h3>
                <ul className="mt-4 space-y-3 text-sm text-white/80 leading-relaxed">
                  <li>
                    ✔ Sampling aleatorio de servicios por tipo (Turnover, Deep
                    Clean).
                  </li>
                  <li>
                    ✔ Verificación contra evidencias fotográficas y checklist
                    QA.
                  </li>
                  <li>
                    ✔ Seguimiento de incidencias hasta cierre con plan de
                    acción.
                  </li>
                  <li>
                    ✔ Consolidado publicado en el portal y Slack
                    `#operaciones-brisa`.
                  </li>
                </ul>
                <MarketingLink
                  href="/?plan=deep-clean&inventory=16-40%20unidades#contacto"
                  eventName="cta_qa_playbook"
                  metadata={{ placement: "qa-guardrails" }}
                  className="mt-6 inline-flex w-full items-center justify-center rounded-full border border-white/40 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                  prefetch={false}
                >
                  Solicitar playbook QA completo
                </MarketingLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="faq"
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 scroll-mt-24"
      >
        <StaggerContainer
          className="grid gap-8 lg:grid-cols-3"
          staggerDelay={0.2}
        >
          {differentiators.map((item) => (
            <StaggerItem key={item.title}>
              <TiltCard
                maxTilt={8}
                glowEffect
                glowColor="rgba(126, 231, 196, 0.2)"
              >
                <div className="rounded-3xl border border-gray-200 bg-white p-8 dark:border-brisa-800 dark:bg-brisa-950 h-full">
                  <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brisa-100 text-brisa-600 dark:bg-brisa-900/60 dark:text-brisa-200">
                    <item.icon className="h-6 w-6" aria-hidden />
                  </div>
                  <h3 className="text-xl font-semibold text-brisa-700 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm sm:text-base leading-relaxed text-gray-600 dark:text-brisa-200">
                    {item.description}
                  </p>
                </div>
              </TiltCard>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>

      {/* Comparativa de servicios */}
      <section className="bg-white dark:bg-brisa-950 px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-brisa-300/60 bg-brisa-50/80 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-brisa-600 dark:border-brisa-500/40 dark:bg-brisa-800/60 dark:text-brisa-200">
              Comparativa
            </span>
            <h2 className="text-3xl font-semibold text-[#0d2944] dark:text-white">
              Elige el servicio adecuado para tu inventario
            </h2>
            <p className="text-base text-gray-600 dark:text-brisa-200">
              Diseñado para propietarios boutique, operadores de STR y
              portafolios corporativos.
            </p>
          </div>
          <div className="overflow-x-auto rounded-3xl border border-gray-200 shadow-lg dark:border-brisa-800">
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
                    className="border-t border-gray-100 dark:border-brisa-800"
                  >
                    <td className="px-4 py-4 font-semibold text-[#0d2944] dark:text-white">
                      {service.name}
                    </td>
                    <td className="px-4 py-4 text-gray-600 dark:text-brisa-200">
                      {service.idealFor}
                    </td>
                    <td className="px-4 py-4 text-gray-600 dark:text-brisa-200">
                      {service.sla}
                    </td>
                    <td className="px-4 py-4 text-gray-600 dark:text-brisa-200">
                      {service.crew}
                    </td>
                    <td className="px-4 py-4 text-gray-600 dark:text-brisa-200">
                      <ul className="space-y-1">
                        {service.deliverables.map((deliverable) => (
                          <li key={deliverable}>• {deliverable}</li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-4 py-4 text-gray-600 dark:text-brisa-200">
                      {service.addOns}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-brisa-600 via-brisa-500 to-brisa-400 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="space-y-8">
            <div className="max-w-2xl">
              <h2 className="text-3xl sm:text-4xl font-semibold">
                Cómo trabajamos
              </h2>
              <p className="mt-4 text-base sm:text-lg text-white/90 leading-relaxed">
                Operamos como un equipo extendido de housekeeping premium. Cada
                fase tiene responsables, SLA y documentación en el portal, listo
                para auditar.
              </p>
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              {processSteps.map((step) => (
                <div
                  key={step.title}
                  className="rounded-3xl border border-white/30 bg-white/10 p-6 backdrop-blur transition hover:bg-white/15"
                >
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-white">
                    <step.icon className="h-6 w-6" aria-hidden />
                  </div>
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                  <p className="mt-3 text-sm sm:text-base text-white/80 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Galería de imágenes del proceso */}
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="relative overflow-hidden rounded-2xl border border-white/20 shadow-xl">
                <Image
                  src="/branding/team-housekeeping-tablet.webp"
                  alt="Equipo Brisa Cubana registrando checklist digital en tablet durante servicio"
                  width={1920}
                  height={1280}
                  loading="lazy"
                  className="h-auto w-full object-cover aspect-[4/3]"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <p className="absolute bottom-4 left-4 text-sm font-semibold text-white">
                  Registro digital en tiempo real
                </p>
              </div>
              <div className="relative overflow-hidden rounded-2xl border border-white/20 shadow-xl">
                <Image
                  src="/branding/team-kitchen-cleaning.webp"
                  alt="Limpieza profesional de cocina con protocolos premium"
                  width={1920}
                  height={1280}
                  loading="lazy"
                  className="h-auto w-full object-cover aspect-[4/3]"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <p className="absolute bottom-4 left-4 text-sm font-semibold text-white">
                  Protocolos de limpieza premium
                </p>
              </div>
              <div className="relative overflow-hidden rounded-2xl border border-white/20 shadow-xl">
                <Image
                  src="/branding/team-professional-cleaning-2.webp"
                  alt="Supervisión de calidad y control QA en propiedad"
                  width={1920}
                  height={1280}
                  loading="lazy"
                  className="h-auto w-full object-cover aspect-[4/3]"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <p className="absolute bottom-4 left-4 text-sm font-semibold text-white">
                  Control QA y supervisión
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)] items-center">
          <div className="space-y-6">
            <h2 className="text-3xl sm:text-4xl font-semibold">
              Tu portal de cliente privado
            </h2>
            <p className="text-base sm:text-lg text-gray-600 dark:text-brisa-300 leading-relaxed">
              Cada cliente recibe acceso a un portal privado donde gestionar
              servicios, revisar evidencias y descargar reportes. Sin
              instalaciones, sin llamadas, sin fricción.
            </p>
            <div className="space-y-4">
              {clientPortalFeatures.map((feature) => (
                <div
                  key={feature.title}
                  className="flex gap-4 p-4 rounded-2xl border border-gray-200 bg-white dark:border-brisa-800 dark:bg-brisa-950"
                >
                  <span className="text-3xl flex-shrink-0" aria-hidden>
                    {feature.icon}
                  </span>
                  <div>
                    <h3 className="font-semibold text-brisa-700 dark:text-white">
                      {feature.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-brisa-200 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <MarketingLink
              href="/clientes"
              eventName="cta_portal_demo"
              metadata={{ placement: "portal-section" }}
              className="inline-flex items-center gap-2 text-brisa-600 dark:text-brisa-400 hover:text-brisa-700 dark:hover:text-brisa-300 font-semibold"
            >
              Ver demo del portal cliente
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </MarketingLink>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-brisa-500/20 to-purple-500/20 blur-2xl" />
            <div className="relative overflow-hidden rounded-2xl border border-brisa-200/60 shadow-2xl dark:border-brisa-700">
              <Image
                src="/branding/client-tablet-workspace.webp"
                alt="Cliente revisando portal de Brisa Cubana con evidencias fotográficas y reportes de servicios de limpieza"
                width={1920}
                height={1280}
                loading="lazy"
                className="h-auto w-full"
                sizes="(max-width: 1024px) 100vw, 520px"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <h2 className="text-3xl sm:text-4xl font-semibold text-center mb-12">
          Historias de clientes
        </h2>
        <div className="grid gap-8 lg:grid-cols-2">
          {displayTestimonials.map((item) => (
            <blockquote
              key={item.author}
              className="relative rounded-3xl border border-gray-200 dark:border-brisa-800 bg-white dark:bg-brisa-950 p-8 shadow-sm"
            >
              <span
                className="absolute -top-4 left-6 text-5xl text-brisa-200 dark:text-brisa-700"
                aria-hidden
              >
                “
              </span>
              <p className="text-base sm:text-lg text-gray-700 dark:text-brisa-200 leading-relaxed">
                {item.quote}
              </p>
              <footer className="mt-6">
                <p className="font-semibold text-brisa-700 dark:text-brisa-100">
                  {item.author}
                </p>
                <p className="text-sm text-gray-600 dark:text-brisa-300">
                  {item.role}
                </p>
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      {/* Galería de Propiedades Reales */}
      <section className="bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-brisa-950/60 dark:via-brisa-950 dark:to-brisa-950/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-semibold">
              Propiedades que confían en nosotros
            </h2>
            <p className="mt-4 text-base sm:text-lg text-gray-600 dark:text-brisa-300 max-w-2xl mx-auto">
              Desde penthouses en Brickell hasta condos boutique en Miami Beach,
              mantenemos el estándar five-star que tus huéspedes esperan.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="group relative overflow-hidden rounded-3xl border border-gray-200 dark:border-brisa-800 shadow-lg hover:shadow-2xl transition-all duration-300">
              <Image
                src="/branding/property-luxury-living-1.webp"
                alt="Sala de estar de propiedad de lujo en Brickell lista después del servicio Turnover Premium"
                width={1920}
                height={1280}
                loading="lazy"
                className="h-auto w-full object-cover aspect-[4/3] group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <p className="font-semibold text-lg">Brickell Luxury Living</p>
                <p className="text-sm text-white/90 mt-1">
                  3BR · 2,400 sq ft · Ocupación 85%
                </p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-3xl border border-gray-200 dark:border-brisa-800 shadow-lg hover:shadow-2xl transition-all duration-300">
              <Image
                src="/branding/property-luxury-modern.webp"
                alt="Propiedad moderna en Downtown Miami con servicio Deep Clean Premium"
                width={1920}
                height={1280}
                loading="lazy"
                className="h-auto w-full object-cover aspect-[4/3] group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <p className="font-semibold text-lg">Downtown Modern Loft</p>
                <p className="text-sm text-white/90 mt-1">
                  2BR · 1,800 sq ft · Airbnb Superhost
                </p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-3xl border border-gray-200 dark:border-brisa-800 shadow-lg hover:shadow-2xl transition-all duration-300">
              <Image
                src="/branding/property-luxury-kitchen.webp"
                alt="Cocina gourmet en propiedad premium de Miami Beach"
                width={1920}
                height={1280}
                loading="lazy"
                className="h-auto w-full object-cover aspect-[4/3] group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <p className="font-semibold text-lg">Miami Beach Penthouse</p>
                <p className="text-sm text-white/90 mt-1">
                  4BR · 3,200 sq ft · $450+ ADR
                </p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-3xl border border-gray-200 dark:border-brisa-800 shadow-lg hover:shadow-2xl transition-all duration-300">
              <Image
                src="/branding/property-luxury-living-2.webp"
                alt="Sala de estar elegante con vista panorámica en Edgewater"
                width={1920}
                height={1280}
                loading="lazy"
                className="h-auto w-full object-cover aspect-[4/3] group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <p className="font-semibold text-lg">Edgewater Waterfront</p>
                <p className="text-sm text-white/90 mt-1">
                  2BR · 1,600 sq ft · Vista al mar
                </p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-3xl border border-gray-200 dark:border-brisa-800 shadow-lg hover:shadow-2xl transition-all duration-300">
              <Image
                src="/branding/vertical-bathroom-modern.webp"
                alt="Baño moderno de lujo con acabados premium en Brickell"
                width={1920}
                height={1280}
                loading="lazy"
                className="h-auto w-full object-cover aspect-[4/3] group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <p className="font-semibold text-lg">Brickell Sky Tower</p>
                <p className="text-sm text-white/90 mt-1">
                  1BR · 900 sq ft · Piso 35
                </p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-3xl border border-gray-200 dark:border-brisa-800 shadow-lg hover:shadow-2xl transition-all duration-300">
              <Image
                src="/branding/vertical-hotel-corridor.webp"
                alt="Corredor premium en condominio de lujo Downtown Miami"
                width={1920}
                height={1280}
                loading="lazy"
                className="h-auto w-full object-cover aspect-[4/3] group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <p className="font-semibold text-lg">Downtown Signature</p>
                <p className="text-sm text-white/90 mt-1">
                  3BR · 2,100 sq ft · Acceso VIP
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 text-center">
            <p className="text-sm text-gray-600 dark:text-brisa-400">
              Portfolio activo:{" "}
              <span className="font-semibold text-brisa-600 dark:text-brisa-300">
                {portfolioStats?.activeProperties ?? 42} propiedades
              </span>{" "}
              · Rating promedio:{" "}
              <span className="font-semibold text-brisa-600 dark:text-brisa-300">
                {portfolioStats?.averageRating ?? "4.92"}/5.0
              </span>{" "}
              · Turnovers {portfolioStats?.period ?? "Q4 2025"}:{" "}
              <span className="font-semibold text-brisa-600 dark:text-brisa-300">
                {portfolioStats?.totalTurnovers?.toLocaleString() ?? "1,240"}+
              </span>
            </p>
          </div>
        </div>
      </section>

      <PricingTiers
        tiers={displayPricingTiers}
        renderCTA={(tier) => {
          const inventoryMap: Record<string, string> = {
            turnover: "6-15 unidades",
            "deep-clean": "16-40 unidades",
            "post-construction": "41+ unidades",
          };
          const inventory = inventoryMap[tier.id];
          const inventoryQuery = inventory
            ? `&inventory=${encodeURIComponent(inventory)}`
            : "";

          return (
            <MarketingLink
              href={`/?plan=${tier.id}${inventoryQuery}#contacto`}
              eventName="cta_request_proposal"
              metadata={{
                placement: "pricing",
                tierId: tier.id,
                target: "contact_form",
              }}
              className="inline-flex items-center justify-center rounded-full border border-brisa-600 px-4 py-2 text-sm font-semibold text-brisa-600 hover:bg-brisa-50 dark:border-brisa-300 dark:text-brisa-200 dark:hover:bg-brisa-900 transition-colors"
              prefetch={false}
            >
              Solicitar onboarding
            </MarketingLink>
          );
        }}
      />

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="space-y-8">
          <div className="max-w-3xl">
            <h2 className="text-3xl sm:text-4xl font-semibold">
              ¿Qué diferencia a cada paquete?
            </h2>
            <p className="mt-3 text-base sm:text-lg text-gray-600 dark:text-brisa-300 leading-relaxed">
              Resume entregables clave, SLAs y add-ons para decidir el paquete
              ideal.
            </p>
          </div>
          <div className="overflow-x-auto rounded-3xl border border-gray-200 dark:border-brisa-800 bg-white dark:bg-brisa-950 shadow-sm">
            <table
              className="min-w-full divide-y divide-gray-200 dark:divide-brisa-800 text-sm"
              data-testid="service-comparison-table"
            >
              <thead className="bg-brisa-50/70 dark:bg-brisa-900/40 text-left">
                <tr className="text-xs uppercase tracking-[0.25em] text-brisa-500 dark:text-brisa-300">
                  <th scope="col" className="px-6 py-4 font-semibold">
                    Paquete
                  </th>
                  <th scope="col" className="px-6 py-4 font-semibold">
                    Ideal para
                  </th>
                  <th scope="col" className="px-6 py-4 font-semibold">
                    SLA
                  </th>
                  <th scope="col" className="px-6 py-4 font-semibold">
                    Equipo
                  </th>
                  <th scope="col" className="px-6 py-4 font-semibold">
                    Entregables
                  </th>
                  <th scope="col" className="px-6 py-4 font-semibold">
                    Add-ons
                  </th>
                  <th scope="col" className="px-6 py-4 font-semibold sr-only">
                    CTA
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-brisa-800">
                {serviceComparisons.map((service) => (
                  <tr key={service.id} className="align-top">
                    <td className="px-6 py-6 font-semibold text-brisa-700 dark:text-white">
                      {service.name}
                    </td>
                    <td className="px-6 py-6 text-gray-700 dark:text-brisa-200">
                      {service.idealFor}
                    </td>
                    <td className="px-6 py-6 text-gray-700 dark:text-brisa-200">
                      {service.sla}
                    </td>
                    <td className="px-6 py-6 text-gray-700 dark:text-brisa-200">
                      {service.crew}
                    </td>
                    <td className="px-6 py-6 text-gray-700 dark:text-brisa-200">
                      <ul className="space-y-2 list-disc pl-5">
                        {service.deliverables.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-6 py-6 text-gray-700 dark:text-brisa-200">
                      {service.addOns}
                    </td>
                    <td className="px-6 py-6">
                      <MarketingLink
                        href={`/?plan=${service.id}#contacto`}
                        eventName="cta_plan_compare"
                        metadata={{ placement: "comparison", plan: service.id }}
                        className="inline-flex items-center justify-center rounded-full border border-brisa-600 px-4 py-2 text-xs font-semibold text-brisa-600 hover:bg-brisa-50 dark:border-brisa-300 dark:text-brisa-200 dark:hover:bg-brisa-900 transition-colors"
                        data-testid={`plan-cta-${service.id}`}
                        prefetch={false}
                      >
                        Cotizar paquete
                      </MarketingLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-brisa-50 dark:bg-brisa-950/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-semibold text-center mb-6">
            Conecta con la operación en vivo
          </h2>
          <p className="max-w-3xl mx-auto text-center text-base sm:text-lg text-gray-600 dark:text-brisa-200">
            Sigue nuestro equipo en acción, casos de éxito y tips diarios en
            redes. Compartimos procesos, métricas y aprendizajes para
            anfitriones y property managers premium.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {socialLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start justify-between rounded-3xl border border-brisa-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-brisa-300 hover:shadow-lg dark:border-brisa-900 dark:bg-brisa-950/80 dark:hover:border-brisa-700"
              >
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-brisa-500 dark:text-brisa-300">
                    {link.name}
                  </p>
                  <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-brisa-50">
                    {link.handle}
                  </p>
                  <p className="mt-2 text-sm text-gray-600 dark:text-brisa-300 leading-relaxed">
                    {link.description}
                  </p>
                </div>
                <span className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-brisa-200 text-brisa-600 transition group-hover:border-brisa-400 group-hover:text-brisa-500 dark:border-brisa-700 dark:text-brisa-200">
                  <ArrowUpRightIcon className="h-5 w-5" aria-hidden />
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <FAQSection items={displayFAQs} />

      {/* CTA final */}
      <section className="bg-[#0d2944] text-white px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="max-w-5xl mx-auto space-y-6 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-white/70">
            Próximo paso
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold leading-tight">
            Reserva una sesión con operaciones y recibe un plan personalizado en
            24 horas.
          </h2>
          <p className="text-base sm:text-lg text-white/80">
            Revisamos tu inventario, métricas actuales y proponemos la mezcla
            ideal de servicios (turnovers, deep cleaning, mantenimiento). Todo
            queda documentado en el portal para compartirlo con dueños o tu
            equipo.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <MarketingLink
              href={{ pathname: "/servicios" }}
              eventName="cta_view_services"
              metadata={{ placement: "cta-final" }}
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-base font-semibold text-[#0d2944] shadow-xl shadow-black/20 hover:bg-brisa-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              Explorar servicios
            </MarketingLink>
            <MarketingLink
              href={{ pathname: "/soporte" }}
              eventName="cta_contact_support"
              metadata={{ placement: "cta-final" }}
              className="inline-flex items-center justify-center rounded-full border border-white/60 px-6 py-3 text-base font-semibold text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              Habla con operaciones
            </MarketingLink>
          </div>
        </div>
      </section>

      <LeadCaptureForm />
    </main>
  );
}
