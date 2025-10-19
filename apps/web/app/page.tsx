import Image from "next/image";
import { FAQSection } from "@/components/landing/faq-section";
import { LeadCaptureForm } from "@/components/landing/lead-capture-form";
import {
  PricingTiers,
  type PricingTier,
} from "@/components/landing/pricing-tiers";
import { MarketingLink } from "@/components/landing/marketing-link";

const testimonials = [
  {
    quote: "Brisa Cubana nos salvó la agenda de check-ins en alta temporada.",
    author: "Ana",
    role: "Superhost · Brickell",
  },
  {
    quote:
      "La inspección final y el reporte fotográfico nos dieron tranquilidad total.",
    author: "Carlos",
    role: "Propietario · Key Biscayne",
  },
];

const pricingTiers: PricingTier[] = [
  {
    id: "turnover",
    name: "Turnover Vacation Rental",
    headline: "Desde $139 por salida",
    price: "$139+",
    priceSuffix: "por salida",
    description:
      "Para anfitriones con turnovers constantes que necesitan checklist Airbnb y reposición de amenities.",
    features: [
      "Reposición completa de amenities y textiles",
      "Checklist Airbnb Pro con evidencias fotográficas",
      "Reporte posterior en portal cliente en menos de 6 horas",
      "Supervisión en sitio durante alta ocupación",
    ],
  },
  {
    id: "deep-clean",
    name: "Deep Clean Residencial",
    headline: "Desde $189",
    price: "$189+",
    priceSuffix: "por servicio",
    description:
      "Limpieza profunda para residencias y segundas propiedades con mantenimiento esporádico.",
    features: [
      "Enfoque especial en cocina, baños y zonas de alto contacto",
      "Equipos con insumos hipoalergénicos certificados EPA",
      "Control de humedad y mantenimiento preventivo ligero",
      "Checklist digital con seguimiento de incidencias",
    ],
    highlighted: true,
  },
  {
    id: "premium",
    name: "Mantenimiento Premium",
    headline: "Cotización personalizada",
    price: "Bajo demanda",
    priceSuffix: "según SLA",
    description:
      "Portafolios de lujo y edificios con estándares cinco estrellas y servicios combinados.",
    features: [
      "Cuadrillas fijas con reemplazos garantizados 24/7",
      "Integración con PMS (Guesty, Hostaway, ResNexus)",
      "Mantenimiento preventivo y gestión de inventario premium",
      "Alertas automáticas y reportes ejecutivos en portal",
    ],
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

      <FAQSection items={faqItems} />

      <LeadCaptureForm />
    </main>
  );
}
