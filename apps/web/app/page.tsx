import Image from "next/image";
import {
  ShieldCheckIcon,
  SparklesIcon,
  CloudArrowUpIcon,
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentCheckIcon,
  ArrowUpRightIcon,
} from "@heroicons/react/24/outline";
import { FAQSection } from "@/components/landing/faq-section";
import { LeadCaptureForm } from "@/components/landing/lead-capture-form";
import {
  PricingTiers,
  type PricingTier,
} from "@/components/landing/pricing-tiers";
import { MarketingLink } from "@/components/landing/marketing-link";

const testimonials = [
  {
    quote:
      "Con Brisa Cubana dejamos de bloquear noches entre huéspedes. 0 sorpresas, 100 % check-ins felices.",
    author: "Ana",
    role: "Superhost · Brickell",
  },
  {
    quote:
      "La auditoría RFID y los reportes en el portal me ahorran visitas improvisadas. El equipo opera como si fuera propio.",
    author: "Carlos",
    role: "Propietario · Key Biscayne",
  },
  {
    quote:
      "Escalar de 5 a 40 unidades sin aumentar staff interno fue posible gracias a su logística 24/7 y Amenity Refresh Express.",
    author: "Valeria",
    role: "Property Manager · Coconut Grove",
  },
];

const kpiHighlights = [
  {
    label: "Turnovers gestionados",
    value: "+12K",
    description: "Historias de check-in impecables para anfitriones premium.",
  },
  {
    label: "Satisfacción del huésped",
    value: "97%",
    description:
      "Encuestas post estancia en propiedades operadas por Brisa Cubana.",
  },
  {
    label: "Alertas resueltas",
    value: "< 15 min",
    description: "Tiempo promedio de respuesta ante incidencias reportadas.",
  },
  {
    label: "Cobertura",
    value: "24/7",
    description:
      "Cuadrillas activas en Miami, Brickell, Key Biscayne y Surfside.",
  },
];

const differentiators = [
  {
    title: "Protocolos cinco estrellas",
    description:
      "Checklist digital, reposición certificada y evidencia fotográfica en menos de seis horas.",
    icon: SparklesIcon,
  },
  {
    title: "Seguridad y compliance",
    description:
      "Supervisión operativa, inventario controlado y pólizas de responsabilidad civil actualizadas.",
    icon: ShieldCheckIcon,
  },
  {
    title: "Integraciones PMS",
    description:
      "Sincronizamos agenda con Guesty, Hostaway, ResNexus y reportamos incidencias en tiempo real.",
    icon: CloudArrowUpIcon,
  },
];

const processSteps = [
  {
    title: "Diagnóstico express",
    description:
      "Levantamos checklist, inventario y frecuencia ideal en una sesión remota de 30 minutos.",
    icon: ClipboardDocumentCheckIcon,
  },
  {
    title: "Operación continua",
    description:
      "Cuadrillas asignadas, reposición centralizada y inspección final con reporte fotográfico.",
    icon: ArrowPathIcon,
  },
  {
    title: "Visibilidad total",
    description:
      "Dashboard y alertas automatizadas, soporte humano 24/7 y mejoras trimestrales con tu equipo.",
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
      "Para anfitriones con turnovers frecuentes que exigen restocking completo, lavandería express y evidencia fotográfica en <4 h.",
    features: [
      "Reposición completa de amenities, textiles y welcome kit",
      "Checklist Airbnb Pro con auditoría RFID de inventario",
      "Reporte en portal cliente en menos de 4 horas",
      "Supervisión on-site durante ventanas críticas",
    ],
  },
  {
    id: "deep-clean",
    name: "Deep Clean Brickell Collection",
    headline: "Desde $289",
    price: "$289+",
    priceSuffix: "por servicio",
    description:
      "Ideal para residencias y segundas propiedades que requieren detailing premium, tratamiento antivaho y cuidado de superficies.",
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
      "Para entregas de penthouses y villas boutique tras obra o remodelación, con acabado de hotel cinco estrellas.",
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

const faqItems = [
  {
    question: "¿Operan 24/7?",
    answer:
      "Sí. Contamos con equipos de guardia para turnovers de madrugada y emergencias calendarizadas con menos de 12 horas de aviso.",
  },
  {
    question: "¿Usan productos ecológicos?",
    answer:
      "Trabajamos con líneas hipoalergénicas y certificados EPA. Podemos operar con tu inventario o proveerlo según plan.",
  },
  {
    question: "¿Cómo funciona el portal cliente?",
    answer:
      "Recibes un enlace mágico válido por 12 horas con acceso a reservas, reagendos, cancelaciones y reportes 24/7.",
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
                Limpieza profesional para propiedades premium en Miami.
              </h1>
              <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 dark:text-brisa-200 max-w-2xl">
                Turnover express, deep cleaning y mantenimiento preventivo para
                anfitriones con estándares cinco estrellas.
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
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-white/60 shadow-xl shadow-brisa-900/5 dark:border-brisa-800">
              <Image
                src="/images/landing/hero-miami-sunset.png"
                alt="Vista de Miami al atardecer con interiores preparados para la siguiente reserva."
                fill
                sizes="(max-width: 768px) 100vw, 420px"
                className="object-cover"
                priority
              />
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
            <div className="relative aspect-[3/4] overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl shadow-brisa-900/5 dark:border-brisa-700 dark:bg-brisa-950">
              <Image
                src="/images/landing/portal-preview.png"
                alt="Vista del portal cliente de Brisa Cubana mostrando reservas y acciones disponibles."
                fill
                sizes="(max-width: 768px) 100vw, 380px"
                className="object-cover"
              />
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
