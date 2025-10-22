import {
  ShieldCheckIcon,
  SparklesIcon,
  CloudArrowUpIcon,
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentCheckIcon,
  ArrowUpRightIcon,
} from "@heroicons/react/24/outline";
import dynamic from "next/dynamic";
import Image from "next/image";
import { FAQSection } from "@/components/landing/faq-section";
import { LeadCaptureForm } from "@/components/landing/lead-capture-form";
import {
  PricingTiers,
  type PricingTier,
} from "@/components/landing/pricing-tiers";
import { MarketingLink } from "@/components/landing/marketing-link";

const NightShiftMedia = dynamic(
  () =>
    import("@/components/landing/night-shift-media").then(
      (mod) => mod.NightShiftMedia,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-3xl border border-dashed border-brisa-200 bg-gradient-to-br from-white to-brisa-50/60 p-6 shadow-sm dark:border-brisa-800 dark:from-brisa-900/20 dark:to-brisa-900/40">
        <div className="flex h-full flex-col justify-between gap-6">
          <div>
            <p className="text-sm font-semibold text-brisa-600 dark:text-brisa-200">
              Cargando contenido nocturno
            </p>
            <p className="mt-2 text-sm text-brisa-500 dark:text-brisa-300">
              Preparamos el B-roll del turno nocturno para mostrarlo sin afectar
              el rendimiento inicial de la página.
            </p>
          </div>
          <div className="h-64 rounded-2xl border border-brisa-200/60 bg-brisa-100/40 dark:border-brisa-700/60 dark:bg-brisa-900/30">
            <div className="h-full w-full animate-pulse rounded-2xl bg-gradient-to-br from-brisa-100 via-white to-brisa-50 dark:from-brisa-800 dark:via-brisa-900 dark:to-brisa-950" />
          </div>
        </div>
      </div>
    ),
  },
);

const testimonials = [
  {
    quote:
      "Entre 12 y 25 turnovers por propiedad al año es la media del sector STR. Planificamos cuadrillas con capacidad extra para cubrir temporadas altas sin bloqueos.",
    author: "Fuente: Vacation Rental Cleaning Market Outlook 2024",
    role: "pmarketresearch.com",
  },
  {
    quote:
      "El 81 % de los huéspedes prioriza la limpieza al reservar y 78 % deja reseñas positivas cuando todo está impecable; nuestros checklists documentados sostienen ratings altos.",
    author:
      "Fuente: Hospitable · Impact of Cleanliness on Guest Reviews (2024)",
    role: "hospitable.com",
  },
  {
    quote:
      "El mercado de Miami supera las 13 000 propiedades activas y los stays de 4‑5 noches exigen turnos mismos día. Operamos 24/7 con evidencia fotográfica en cada entrega.",
    author: "Fuente: Turno · Miami Airbnb Cleaners / STR trend reports 2024",
    role: "turno.com",
  },
];

const kpiHighlights = [
  {
    label: "Rotaciones por propiedad",
    value: "12-25/año",
    description:
      "Media de turnovers en STR de EE. UU.; planificamos buffers para picos turísticos.",
  },
  {
    label: "Impacto en reseñas",
    value: "81%",
    description:
      "De los viajeros prioriza limpieza; 78% deja reviews positivas cuando está impecable.",
  },
  {
    label: "Programación garantizada",
    value: "24/7",
    description:
      "Calendarios sincronizados con alertas same-day y soporte priorizado.",
  },
  {
    label: "Mercado Miami",
    value: "13K+ listings",
    description:
      "Inventario activo con picos Nov-Mar y 24M de visitantes anuales.",
  },
];

const differentiators = [
  {
    title: "Protocolos cinco estrellas",
    description:
      "Adherimos al Airbnb Enhanced Cleaning estándar: checklists de 100+ puntos, sanitización hospitalaria y reportes firmados digitalmente.",
    icon: SparklesIcon,
  },
  {
    title: "Seguridad y compliance",
    description:
      "Cumplimos normativas municipales/estatales, inventario trazable y pólizas activas para evitar sanciones en mercados regulados.",
    icon: ShieldCheckIcon,
  },
  {
    title: "Integraciones PMS",
    description:
      "Sincronizamos Guesty, Hostaway, ResNexus o Breezeway, generamos alertas automáticas y evidencias fotográficas con timestamp.",
    icon: CloudArrowUpIcon,
  },
];

const processSteps = [
  {
    title: "Diagnóstico express",
    description:
      "Auditamos inventario, tiempos de estancia (media 4‑5 noches) y reseñas para definir SLAs sin bloquear ingresos.",
    icon: ClipboardDocumentCheckIcon,
  },
  {
    title: "Operación continua",
    description:
      "Cuadrillas con suministros estandarizados, lavado propio y checklists firmados in situ para cada turnover.",
    icon: ArrowPathIcon,
  },
  {
    title: "Visibilidad total",
    description:
      "Portal con fotos finales, métricas en tiempo real y alertas automáticas cuando el PMS detecta cambios.",
    icon: ChatBubbleLeftRightIcon,
  },
];

const pricingTiers: PricingTier[] = [
  {
    id: "turnover",
    name: "Turnover Premium Airbnb",
    headline: "Desde $209 por salida",
    price: "$209+",
    priceSuffix: "por salida",
    description:
      "Para listados urbanos con 12-25 rotaciones al año. Incluye restocking completo, lavandería express y evidencia fotográfica en <4 h.",
    features: [
      "Reposición completa de amenities, textiles y welcome kit",
      "Checklist Airbnb Enhanced Cleaning y control RFID de inventario",
      "Reporte en portal cliente en menos de 4 horas",
      "Supervisión on-site en ventanas críticas y lanzamientos",
    ],
  },
  {
    id: "deep-clean",
    name: "Deep Clean Brickell Collection",
    headline: "Desde $289",
    price: "$289+",
    priceSuffix: "por servicio",
    description:
      "Ideal para residencias y segundas propiedades con stays superiores a 7 noches. Incluye detailing premium y tratamiento antivaho.",
    features: [
      "Detallado premium de cocina, baños y textiles de lujo",
      "Insumos hipoalergénicos certificados EPA",
      "Control de humedad y mantenimiento preventivo ligero",
      "Checklist digital con seguimiento de incidencias",
    ],
    highlighted: true,
  },
  {
    id: "post-construction",
    name: "Post-Construcción Boutique",
    headline: "Desde $349",
    price: "$349+",
    priceSuffix: "por servicio",
    description:
      "Para entregas de penthouses y villas tras obra o remodelación con requisitos OSHA. Incluye pulido final y staging ejecutivo.",
    features: [
      "Pulido de superficies y eliminación de polvo de obra",
      "Staging final con inspección fotográfica ejecutiva",
      "Equipo especializado con certificaciones OSHA",
      "Opcional: Amenity Refresh Express para back-to-back stays",
    ],
  },
];

const socialLinks = [
  {
    name: "Instagram",
    handle: "@BrisaCleanIntelligence",
    href: "https://instagram.com/BrisaCleanIntelligence",
    description:
      "Historias y reels del equipo en acción, antes/después y backstage.",
  },
  {
    name: "Facebook",
    handle: "Brisa Clean Intelligence",
    href: "https://facebook.com/BrisaCleanIntelligence",
    description: "Casos completos, reseñas de clientes y anuncios dirigidos.",
  },
  {
    name: "LinkedIn",
    handle: "Brisa Clean Intelligence",
    href: "https://www.linkedin.com/company/brisa-clean-intelligence",
    description: "Insights operativos, alianzas B2B y noticias corporativas.",
  },
  {
    name: "TikTok",
    handle: "@BrisaCleanIntelligence",
    href: "https://www.tiktok.com/@brisacleanintelligence",
    description: "Timelapses, tips rápidos y retos de limpieza premium.",
  },
  {
    name: "YouTube",
    handle: "@BrisaCleanIntelligence",
    href: "https://www.youtube.com/@BrisaCleanIntelligence",
    description:
      "Recorridos completos, testimonios extendidos y guías para hosts.",
  },
];

const operationsMockups = [
  {
    title: "Dashboard en tiempo real",
    description:
      "Alertas críticas, checklists cerrados y estadísticas de satisfacción en un solo panel.",
    src: "/assets/mockups/16-9/portal-dashboard-1920w.webp",
    placeholder: "/assets/mockups/16-9/portal-dashboard-1280w.webp",
  },
  {
    title: "Gestión de reservas",
    description:
      "Reasigna turnos, confirma cancelaciones y prioriza incidencias desde un timeline auditable.",
    src: "/assets/mockups/16-9/portal-bookings-1920w.webp",
    placeholder: "/assets/mockups/16-9/portal-bookings-1280w.webp",
  },
  {
    title: "Servicios y stock",
    description:
      "Checklist RFID, niveles de amenities y reposiciones automáticas por propiedad.",
    src: "/assets/mockups/16-9/portal-services-1920w.webp",
    placeholder: "/assets/mockups/16-9/portal-services-1280w.webp",
  },
];

const mobileMockups = [
  {
    title: "Login seguro en segundos",
    description:
      "Enlace mágico y MFA opcional para administradores y field ops.",
    src: "/assets/mockups/4-5/portal-mobile-dashboard-1080w.webp",
    placeholder: "/assets/mockups/4-5/portal-mobile-dashboard-540w.webp",
  },
  {
    title: "Turnos desde el móvil",
    description:
      "Confirma servicios, carga evidencias y cierra turnos in situ.",
    src: "/assets/mockups/4-5/portal-mobile-1080w.webp",
    placeholder: "/assets/mockups/4-5/portal-mobile-540w.webp",
  },
  {
    title: "Reposiciones inteligentes",
    description:
      "Solicita kits y amenities críticos con trazabilidad por lote.",
    src: "/assets/mockups/4-5/portal-mobile-services-1080w.webp",
    placeholder: "/assets/mockups/4-5/portal-mobile-services-540w.webp",
  },
];

const faqItems = [
  {
    question: "¿Operan 24/7?",
    answer:
      "Sí. Miami concentra la demanda en temporada alta (noviembre-marzo); mantenemos guardias 24/7 para cubrir emergencias y same-day turnovers.",
  },
  {
    question: "¿Usan productos ecológicos?",
    answer:
      "Operamos con líneas certificadas por EPA Safer Choice e insumos hipoalergénicos; podemos trabajar con tu inventario o abastecerlo íntegramente.",
  },
  {
    question: "¿Cómo funciona el portal cliente?",
    answer:
      "Recibes un enlace mágico válido por 12 horas; allí gestionas reservas, reagendos, cancelaciones y descargas evidencias con fotos y firmas digitales.",
  },
];

export const revalidate = 3600;

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-brisa-950 text-gray-900 dark:text-brisa-50">
      <div className="relative overflow-hidden bg-gradient-to-br from-brisa-100 via-white to-white dark:from-brisa-900/60 dark:via-brisa-950 dark:to-brisa-950">
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
          <header className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] items-center">
            <div className="flex flex-col gap-6 lg:gap-8">
              <span className="text-xs tracking-[0.45em] uppercase text-brisa-600 dark:text-brisa-300">
                Brisa Cubana Clean Intelligence
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.05] max-w-3xl">
                Limpieza profesional y documentada para propiedades premium en
                Miami.
              </h1>
              <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 dark:text-brisa-200 max-w-2xl">
                Turnovers same-day con checklists de más de 100 puntos, deep
                cleaning y mantenimiento preventivo con reportes en menos de 4
                horas.
              </p>
              <div className="flex flex-wrap gap-4">
                <MarketingLink
                  href="/checkout"
                  eventName="cta_request_proposal"
                  metadata={{ placement: "hero" }}
                  className="inline-flex items-center justify-center rounded-full bg-brisa-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-brisa-600/20 hover:bg-brisa-700 transition-colors"
                >
                  Solicitar cotización
                </MarketingLink>
                <MarketingLink
                  href="/clientes"
                  eventName="cta_portal_demo"
                  metadata={{ placement: "hero" }}
                  className="inline-flex items-center justify-center rounded-full border border-brisa-600 px-6 py-3 text-base font-semibold text-brisa-600 hover:bg-brisa-50 dark:border-brisa-300 dark:text-brisa-200 dark:hover:bg-brisa-900 transition-colors"
                >
                  Explora el portal cliente
                </MarketingLink>
              </div>
            </div>
            <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-xl shadow-brisa-900/5 dark:border-brisa-800 dark:bg-brisa-950">
              <div className="space-y-6">
                <div className="relative overflow-hidden rounded-2xl">
                  <Image
                    src="/assets/hero/hero-2400w.webp"
                    alt="Brisa Cubana Clean Intelligence - Professional Cleaning Services Landing Page"
                    width={2400}
                    height={1600}
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
                <div className="grid gap-4 rounded-2xl bg-gradient-to-br from-brisa-100 via-white to-white p-6 dark:from-brisa-900/60 dark:via-brisa-950">
                  <p className="text-sm font-semibold text-brisa-700 dark:text-brisa-100">
                    Datos clave
                  </p>
                  <dl className="grid grid-cols-2 gap-3 text-sm text-gray-700 dark:text-brisa-200">
                    <div>
                      <dt className="font-medium text-brisa-600 dark:text-brisa-300">
                        12-25
                      </dt>
                      <dd>rotaciones/año por propiedad</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-brisa-600 dark:text-brisa-300">
                        81%
                      </dt>
                      <dd>reviews influidas por la limpieza</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-brisa-600 dark:text-brisa-300">
                        13K+
                      </dt>
                      <dd>listados activos en Miami y alrededores</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-brisa-600 dark:text-brisa-300">
                        24/7
                      </dt>
                      <dd>cobertura operativa en temporada alta</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </header>
        </div>
      </div>

      <section className="relative -mt-12 sm:-mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 rounded-3xl border border-white/70 bg-white/90 p-6 shadow-xl backdrop-blur dark:border-brisa-800/60 dark:bg-brisa-950/80 dark:shadow-brisa-900/50">
            {kpiHighlights.map((item) => (
              <div key={item.label} className="flex flex-col gap-1">
                <span className="text-sm uppercase tracking-[0.2em] text-brisa-500 dark:text-brisa-300">
                  {item.label}
                </span>
                <span className="text-3xl font-semibold text-brisa-700 dark:text-white">
                  {item.value}
                </span>
                <p className="text-sm text-gray-600 dark:text-brisa-300 leading-snug">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
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
                <div className="relative aspect-[16/9] overflow-hidden rounded-2xl">
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
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid gap-8 lg:grid-cols-2">
          <article className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-brisa-800 dark:bg-brisa-950">
            <div className="space-y-4">
              <header>
                <p className="text-xs uppercase tracking-[0.3em] text-brisa-500 dark:text-brisa-300">
                  Agenda en vivo
                </p>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-brisa-50">
                  Turnos coordinados minuto a minuto
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-brisa-300">
                  Visualiza en una sola vista quién está en campo, qué
                  propiedades siguen en cola y cuándo se libera cada cuadrilla.
                </p>
              </header>
              <div className="relative overflow-hidden rounded-2xl border border-brisa-200/70 shadow-inner dark:border-brisa-700">
                <Image
                  src="/assets/mockups/16-9/portal-bookings-1920w.webp"
                  alt="Panel con turnos confirmados y cuadrillas en progreso"
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

      <section className="bg-gray-50 dark:bg-brisa-900/40">
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
                <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-brisa-100/70 shadow-inner dark:border-brisa-800">
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
                  KPI en el dashboard
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

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid gap-8 lg:grid-cols-3">
          {differentiators.map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm transition hover:shadow-lg dark:border-brisa-800 dark:bg-brisa-950"
            >
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
          ))}
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
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] items-center">
          <NightShiftMedia />
          <div className="relative aspect-[9/16] w-full overflow-hidden rounded-3xl border border-dashed border-brisa-200 bg-gradient-to-br from-brisa-200 via-white to-brisa-50 text-center shadow-inner dark:border-brisa-700 dark:from-brisa-800 dark:via-brisa-900 dark:to-brisa-950">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-brisa-500 dark:text-brisa-300">
              <ArrowUpRightIcon className="h-8 w-8" aria-hidden />
              <p className="text-sm font-semibold">
                Inserta video vertical (MP4) + poster estático
              </p>
              <p className="text-xs leading-relaxed">
                El reproductor se configurará con auto-play, loop y captions
                cuando recibamos el asset final.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="space-y-8">
          <div className="max-w-3xl">
            <h2 className="text-3xl sm:text-4xl font-semibold">
              Experiencia móvil sin fricciones
            </h2>
            <p className="mt-4 text-base sm:text-lg text-gray-600 dark:text-brisa-300 leading-relaxed">
              Field ops confirman turnos, suben evidencias y solicitan
              reposición desde el teléfono. Los administradores obtienen
              trazabilidad total incluso fuera de la oficina.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {mobileMockups.map((mockup) => (
              <div
                key={mockup.title}
                className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-brisa-800 dark:bg-brisa-950"
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl">
                  <Image
                    src={mockup.src}
                    alt={mockup.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 80vw, (max-width: 1280px) 40vw, 320px"
                    placeholder="blur"
                    blurDataURL={mockup.placeholder}
                    loading="lazy"
                  />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-brisa-700 dark:text-white">
                  {mockup.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-brisa-200">
                  {mockup.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <h2 className="text-3xl sm:text-4xl font-semibold text-center mb-12">
          Historias de clientes
        </h2>
        <div className="grid gap-8 lg:grid-cols-2">
          {testimonials.map((item) => (
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

      <PricingTiers
        tiers={pricingTiers}
        renderCTA={(tier) => (
          <MarketingLink
            href="/checkout"
            eventName="cta_request_proposal"
            metadata={{ placement: "pricing", tierId: tier.id }}
            className="inline-flex items-center justify-center rounded-full border border-brisa-600 px-4 py-2 text-sm font-semibold text-brisa-600 hover:bg-brisa-50 dark:border-brisa-300 dark:text-brisa-200 dark:hover:bg-brisa-900 transition-colors"
          >
            Solicitar onboarding
          </MarketingLink>
        )}
      />

      <section className="py-16 sm:py-20 bg-brisa-50 dark:bg-brisa-950/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-semibold text-center mb-6">
            Conecta con la operación en vivo
          </h2>
          <p className="max-w-3xl mx-auto text-center text-base sm:text-lg text-gray-600 dark:text-brisa-200">
            Sigue nuestras cuadrillas, casos de éxito y tips diarios en redes.
            Compartimos procesos, métricas y aprendizajes para anfitriones y
            property managers premium.
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

      <FAQSection items={faqItems} />

      <LeadCaptureForm />
    </main>
  );
}
