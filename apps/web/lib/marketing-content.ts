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
 * Testimonios reales de clientes de Brisa Cubana Clean Intelligence
 */
export const testimonials: Testimonial[] = [
  {
    quote:
      "Brisa Cubana transformó completamente la operación de mis 12 propiedades en Brickell. Los reportes fotográficos llegan en menos de 2 horas y desde que trabajo con ellos, no he tenido ni un solo reclamo de limpieza. El portal cliente es increíblemente útil para coordinar todo en tiempo real.",
    author: "María González Castro",
    role: "Property Manager · Miami Premium Rentals",
  },
  {
    quote:
      "Como host de Airbnb Superhost con 8 unidades, la limpieza es mi prioridad #1. Brisa Cubana no solo cumple con el estándar Enhanced Cleaning, lo superan. Mis ratings de limpieza subieron de 4.7 a 4.95 en solo 3 meses. El equipo es profesional, puntual y la evidencia fotográfica me da total tranquilidad.",
    author: "Roberto Martínez",
    role: "Airbnb Superhost · Wynwood & Edgewater",
  },
  {
    quote:
      "Gestiono un portfolio de propiedades de lujo en Miami Beach y los estándares de mis clientes son altísimos. Brisa Cubana es el único servicio que ha podido mantener la consistencia que necesito. El checklist de 100+ puntos y el control RFID de inventario eliminaron completamente los problemas de restocking.",
    author: "Ana Sofía Ramírez",
    role: "Portfolio Manager · Coastal Luxury Properties",
  },
  {
    quote:
      "Después de probar 4 servicios diferentes, finalmente encontré un equipo en el que puedo confiar. Los turnovers same-day son impecables, y el soporte 24/7 por WhatsApp me ha salvado en más de una emergencia. Vale cada centavo y más.",
    author: "Carlos Domínguez",
    role: "Property Owner · 6 unidades en Downtown Miami",
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
      "Para listados urbanos con ocupaciones arriba del 70 %. Incluye restocking completo, lavandería express y evidencia fotográfica en <4 h.",
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
      "Panel con KPIs SLA, backlog de incidencias y porcentaje de cumplimiento en vivo.",
    src: "/assets/mockups/16-9/portal-dashboard-1920w.webp",
    placeholder: "/assets/mockups/16-9/portal-dashboard-1280w.webp",
  },
  {
    title: "Gestión de reservas",
    description:
      "Timeline operativo para reagendar servicios, confirmar cuadrillas y registrar evidencias.",
    src: "/assets/mockups/16-9/portal-bookings-1920w.webp",
    placeholder: "/assets/mockups/16-9/portal-bookings-1280w.webp",
  },
  {
    title: "Servicios y stock",
    description:
      "Matriz de servicios con inventario RFID, KPIs por propiedad y mantenimiento preventivo.",
    src: "/assets/mockups/16-9/portal-services-1920w.webp",
    placeholder: "/assets/mockups/16-9/portal-services-1280w.webp",
  },
];
