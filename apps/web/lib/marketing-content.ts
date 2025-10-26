import {
  ShieldCheckIcon,
  SparklesIcon,
  CloudArrowUpIcon,
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentCheckIcon,
} from "@heroicons/react/24/outline";
import type { PricingTier } from "@/components/landing/pricing-tiers";

export type Testimonial = {
  quote: string;
  author: string;
  role: string;
};

export type Differentiator = {
  title: string;
  description: string;
  icon: typeof SparklesIcon;
};

export type ProcessStep = {
  title: string;
  description: string;
  icon: typeof ClipboardDocumentCheckIcon;
};

export type SocialLink = {
  name: string;
  handle: string;
  href: string;
  description: string;
};

export type OperationsMockup = {
  title: string;
  description: string;
  src: string;
  placeholder: string;
};

/**
 * Placeholder copy basado en los estudios iniciales.
 * Reemplaza los textos cuando haya métricas testimoniales reales.
 */
export const testimonials: Testimonial[] = [
  {
    quote:
      "La ocupación media en Miami alcanzó el 70 % entre septiembre 2024 y agosto 2025. Diseñamos calendarios con buffers para sostener esa demanda sin sacrificios operativos.",
    author: "Airbtics · Miami STR Market Update (03-oct-2025)",
    role: "airbtics.com",
  },
  {
    quote:
      "El 81 % de los huéspedes prioriza la limpieza y 78 % deja reseñas positivas tras una estancia impecable; nuestros protocolos garantizan que cada turno llegue a esa expectativa.",
    author: "American Hotel & Lodging Association · vía Hospitable (2024)",
    role: "hospitable.com",
  },
  {
    quote:
      "Las reseñas de seguridad pueden reducir la ocupación un 2 %, pero la transparencia proactiva refuerza la confianza del huésped. Integramos revisiones y auditorías para adelantarnos a cualquier alerta.",
    author: "Marketing Science · Safety Reviews on Airbnb (oct-2025)",
    role: "informs.org",
  },
];

export const differentiators: Differentiator[] = [
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

export const processSteps: ProcessStep[] = [
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

/**
 * Ajusta pricing y beneficios cuando haya tarifas finales.
 */
export const pricingTiers: PricingTier[] = [
  {
    id: "turnover",
    name: "Turnover Premium Airbnb",
    headline: "Desde $249 por salida",
    price: "$249+",
    priceSuffix: "por salida",
    description:
      "Para listados urbanos con ocupaciones arriba del 70 %. Incluye restocking completo, lavandería express y evidencia fotográfica en <4 h.",
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
    headline: "Desde $329",
    price: "$329+",
    priceSuffix: "por servicio",
    description:
      "Ideal para residencias y estancias largas (>28 noches). Incluye detailing premium, tratamiento antivaho y saneamiento de HVAC.",
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
    headline: "Desde $399",
    price: "$399+",
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

/**
 * Sustituye handles y URLs por los perfiles oficiales.
 */
export const socialLinks: SocialLink[] = [
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

export const operationsMockups: OperationsMockup[] = [
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
