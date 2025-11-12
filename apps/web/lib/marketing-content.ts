import {
  ShieldCheckIcon,
  SparklesIcon,
  CloudArrowUpIcon,
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentCheckIcon,
  BoltIcon,
  ChartBarSquareIcon,
  ClipboardDocumentListIcon,
  BellAlertIcon,
  CpuChipIcon,
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

export type ValuePillar = {
  title: string;
  headline: string;
  description: string;
  proof: string;
  icon: typeof SparklesIcon;
};

export type PortalCapability = {
  title: string;
  description: string;
  statLabel: string;
  statValue: string;
  icon: typeof SparklesIcon;
};

export type QaHighlight = {
  title: string;
  description: string;
  proof: string;
  icon: typeof SparklesIcon;
};

export type CaseStudy = {
  id: string;
  client: string;
  vertical: string;
  units: string;
  challenge: string;
  resultSummary: string;
  impact: Array<{ label: string; value: string; description: string }>;
  quote: string;
  spokesperson: string;
  spokespersonRole: string;
};

export type ServiceComparison = {
  id: PricingTier["id"];
  name: string;
  idealFor: string;
  sla: string;
  crew: string;
  deliverables: string[];
  addOns: string;
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

export const fallbackFaqs: Array<{ question: string; answer: string }> = [
  {
    question: "¿En cuánto tiempo entregan un turnover same-day?",
    answer:
      "Operamos cuadrillas on-call 24/7 y rutas por zonas, lo que nos permite entregar turnovers en menos de 4 horas desde que recibimos la orden (incluye checklist, fotos y reporte firmado).",
  },
  {
    question: "¿Cómo documentan la calidad y los daños?",
    answer:
      "Cada servicio genera checklists digitales con evidencia fotográfica before/after, firmas digitales y registro de incidencias. Si detectamos daños o restocks, abrimos un ticket en el portal y notificamos por WhatsApp/Email.",
  },
  {
    question: "¿Pueden integrarse con mi PMS o workflows actuales?",
    answer:
      "Sí. Nos integramos con PMS como Guesty, Hostaway o Breezeway para sincronizar reservaciones y disparar alertas cuando hay cambios. También podemos conectarnos a Slack, Email o WhatsApp Business.",
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

export const valuePillars: ValuePillar[] = [
  {
    title: "Respuesta garantizada",
    headline: "Turnovers same-day en <120 min",
    description:
      "Cuadrillas on-call 24/7, inventario pre-empaquetado y rutas por zonas para cubrir emergencias sin sacrificar calidad.",
    proof: "97 % de turnos entregados a tiempo (Q3 2025)",
    icon: BoltIcon,
  },
  {
    title: "Visibilidad total",
    headline: "Dashboard en vivo + alertas automáticas",
    description:
      "Checklists digitales, evidencias fotográficas y KPI se actualizan en segundos para que cada anfitrión tenga datos de primera mano.",
    proof: "Reportes firmados en menos de 4 h",
    icon: ChartBarSquareIcon,
  },
  {
    title: "Operación sin fricción",
    headline: "Portal cliente + WhatsApp Business integrado",
    description:
      "Resuelve reagendos, restocks o incidencias desde un mismo lugar, con soporte humano en español e inglés.",
    proof: "CSAT 4.9 ⭐ en pilotos Brickell/Wynwood",
    icon: ClipboardDocumentListIcon,
  },
];

export const portalCapabilities: PortalCapability[] = [
  {
    title: "Timeline de servicio",
    description:
      "Cada turno incluye fotos before/after, checklist firmado y notas operativas para auditar en segundos.",
    statLabel: "Checklist completado",
    statValue: "100 puntos",
    icon: CpuChipIcon,
  },
  {
    title: "Alertas inteligentes",
    description:
      "Recibe pings por Slack/SMS cuando un PMS cambia la reserva, hay un restock pendiente o una cuadrilla reporta daño.",
    statLabel: "Notificaciones",
    statValue: "Tiempo real",
    icon: BellAlertIcon,
  },
  {
    title: "Control de inventario",
    description:
      "RFID y conteos rápidos para amenities y blancos; genera tickets de reposición con un toque.",
    statLabel: "Reposición promedio",
    statValue: "<18 h",
    icon: ClipboardDocumentCheckIcon,
  },
];

export const qaHighlights: QaHighlight[] = [
  {
    title: "Doble verificación QA",
    description:
      "Cada servicio se cierra con firma de cuadrilla y supervisor remoto, respaldado por evidencias fotográficas.",
    proof: "Checklist Turnover/Deep Clean + QA digital",
    icon: ShieldCheckIcon,
  },
  {
    title: "Auditorías semanales",
    description:
      "Sampling aleatorio de servicios, scoring de consistencia y playbooks correctivos documentados.",
    proof: "Informe en portal + Slack #operaciones-brisa",
    icon: ClipboardDocumentListIcon,
  },
  {
    title: "Escalamiento en 15 minutos",
    description:
      "Incidencias críticas se reportan a operaciones y cliente en menos de 15 minutos con plan de acción.",
    proof: "SLA alertas críticas ≤15 min",
    icon: BoltIcon,
  },
];

export const serviceComparisons: ServiceComparison[] = [
  {
    id: "turnover",
    name: "Turnover Premium",
    idealFor: "Airbnb / STR 6-20 unidades",
    sla: "<120 min same-day",
    crew: "2 personas (líder + auxiliar)",
    deliverables: [
      "Checklists 100 puntos + evidencia fotográfica",
      "Restock amenities + textiles RFID",
      "Reporte portal en <4 h",
    ],
    addOns: "Lavandería express · restock premium · staging ligero",
  },
  {
    id: "deep-clean",
    name: "Deep Clean Premium",
    idealFor: "Residencial recurrente / Luxury",
    sla: "Programación 24 h",
    crew: "2-3 personas (detalle + soporte)",
    deliverables: [
      "Detallado cocina/baños + aromaterapia",
      "Control humedad y saneamiento HVAC",
      "Informe QA + upsells sugeridos",
    ],
    addOns: "Organización closets · electrodomésticos · eco-kit",
  },
  {
    id: "post-construction",
    name: "Post-Construcción Boutique",
    idealFor: "Penthouses · handover proyectos",
    sla: "Programación 48 h",
    crew: "Equipo 3-4 con certificación OSHA",
    deliverables: [
      "Remoción polvo fino + pulido",
      "Staging final fotos + walk-through",
      "Checklist incidentes y punch list",
    ],
    addOns: "Amenity refresh · inventario amenidades · night shift",
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
      "Equipos con suministros estandarizados, lavado propio y checklists firmados in situ para cada turnover.",
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
    headline: "Turnos garantizados < 120 min",
    price: "$249",
    priceSuffix: "por salida confirmada",
    description:
      "Para portfolios urbanos con ocupaciones >70 %. Incluye restocking completo, lavandería express y reporte fotográfico en menos de 4 horas.",
    features: [
      "Reposición completa de amenities, textiles y welcome kit premium",
      "Checklist Airbnb Enhanced Cleaning + control RFID de inventario",
      "Reporte en portal cliente con fotos y firmas en <4 horas",
      "Supervisión on-site en ventanas críticas y lanzamientos",
    ],
  },
  {
    id: "deep-clean",
    name: "Deep Clean Brickell Collection",
    headline: "Detallado premium trimestral",
    price: "$369",
    priceSuffix: "por servicio programado",
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
    headline: "Entrega impecable tras obra",
    price: "$489",
    priceSuffix: "por servicio de handover",
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

const DEFAULT_BLUR_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";

export type BeforeAfterScenario = {
  id: string;
  label: string;
  title: string;
  description: string;
  highlights: string[];
  before: { src: string; alt: string; blurDataURL?: string };
  after: { src: string; alt: string; blurDataURL?: string };
};

export const beforeAfterScenarios: BeforeAfterScenario[] = [
  {
    id: "kitchen",
    label: "Cocina",
    title: "Deep Clean + staging premium",
    description:
      "Desengrasado industrial, reemplazo de amenities y staging con utilería para fotografías profesionales.",
    highlights: [
      "Desinfección de electrodomésticos + acero inoxidable sin huellas",
      "Reposición de kits de bienvenida y amenities de barra",
    ],
    before: {
      src: "/branding/kitchen-before.webp",
      alt: "Cocina antes del servicio de limpieza profunda Brisa Cubana",
      blurDataURL: DEFAULT_BLUR_DATA_URL,
    },
    after: {
      src: "/branding/kitchen-after.webp",
      alt: "Cocina impecable lista para huéspedes después del servicio Brisa Cubana",
      blurDataURL: DEFAULT_BLUR_DATA_URL,
    },
  },
  {
    id: "bathroom",
    label: "Baño",
    title: "Hotel readiness en menos de 50 minutos",
    description:
      "Remoción de depósitos minerales, cristales pulidos y textiles hoteleros plegados con estándares cinco estrellas.",
    highlights: [
      "Sellado express de cristal y grifería",
      "Reposición de amenities premium y toallas con folding hotelero",
    ],
    before: {
      src: "/branding/bathroom-before.webp",
      alt: "Baño antes de la intervención profunda",
      blurDataURL: DEFAULT_BLUR_DATA_URL,
    },
    after: {
      src: "/branding/bathroom-after.webp",
      alt: "Baño premium después del servicio de limpieza Brisa Cubana",
      blurDataURL: DEFAULT_BLUR_DATA_URL,
    },
  },
  {
    id: "bedroom",
    label: "Dormitorio",
    title: "Staging para foto + inspección QA",
    description:
      "Ropa de cama luxury, planchado in situ y ajuste de iluminación para elevar el CTR en OTAs.",
    highlights: [
      "Revisión RFID de blancos y almohadas",
      "Checklist Enhanced Cleaning con firma digital",
    ],
    before: {
      src: "/branding/bedroom-before.webp",
      alt: "Dormitorio antes del servicio de staging Brisa Cubana",
      blurDataURL: DEFAULT_BLUR_DATA_URL,
    },
    after: {
      src: "/branding/bedroom-after.webp",
      alt: "Dormitorio listo para fotografías profesionales después del servicio",
      blurDataURL: DEFAULT_BLUR_DATA_URL,
    },
  },
];

export const caseStudies: CaseStudy[] = [
  {
    id: "brickell-portfolio",
    client: "Miami Premium Rentals",
    vertical: "Property Management · Brickell / Edgewater",
    units: "12 unidades STR",
    challenge:
      "Respuestas irregulares de proveedores locales y 4.2 ★ en limpieza durante temporada alta.",
    resultSummary:
      "En 90 días estabilizamos el pipeline de turnovers same-day, incrementamos los ratings de limpieza a 4.95 ★ y eliminamos por completo los reclamos por inventario.",
    impact: [
      {
        label: "SLA cumplido",
        value: "97 %",
        description: "turnos entregados en <120 min durante Q3",
      },
      {
        label: "Tickets por restock",
        value: "-83 %",
        description: "gracias a inventario RFID y alertas automáticas",
      },
      {
        label: "CSAT anfitriones",
        value: "4.9/5",
        description: "evaluaciones internas después de cada turno",
      },
    ],
    quote:
      "Nunca había tenido tanta visibilidad. Los reportes fotográficos llegan antes que mi staff llegue al edificio, y el portal me permite reagendar sin chats interminables.",
    spokesperson: "María González Castro",
    spokespersonRole: "Property Manager · Miami Premium Rentals",
  },
  {
    id: "wynwood-superhost",
    client: "Roberto Martínez",
    vertical: "Airbnb Superhost · Wynwood / Midtown",
    units: "8 lofts creativos",
    challenge:
      "Expansión acelerada con cleaning scores cayendo a 4.6 y huéspedes solicitando partial refunds.",
    resultSummary:
      "Implementamos deep cleans bimestrales + checklist personalizado y redujimos los reclamos a cero; los reviews de limpieza ahora promedian 4.96.",
    impact: [
      {
        label: "Cleaning rating",
        value: "4.96 ★",
        description: "promedio rolling 6 semanas en Airbnb",
      },
      {
        label: "Tiempo de respuesta",
        value: "28 min",
        description: "para reagendos vía portal + WhatsApp Business",
      },
      {
        label: "Horas internas liberadas",
        value: "12 h/sem",
        description: "al delegar QA y reposiciones",
      },
    ],
    quote:
      "Brisa se volvió mi extensión operativa. Si un huésped pide early check-in, en segundos ya están coordinados y me comparten fotos before/after. Es literalmente plug & play.",
    spokesperson: "Roberto Martínez",
    spokespersonRole: "Airbnb Superhost",
  },
  {
    id: "luxury-beach",
    client: "Coastal Luxury Properties",
    vertical: "Portfolio de lujo · Miami Beach / Sunny Isles",
    units: "6 penthouses + 4 villas",
    challenge:
      "Clientes UHNW exigiendo evidencia diaria y protocolos de mantenimiento preventivo documentados.",
    resultSummary:
      "Digitalizamos los checklists con firmas duales, sumamos inspecciones QA sorpresa y habilitamos reportes PDF con branding del cliente para compartir con los owners.",
    impact: [
      {
        label: "Incidencias críticas",
        value: "0",
        description: "durante 7 meses consecutivos",
      },
      {
        label: "Tiempo de reporte",
        value: "2h 12m",
        description: "promedio desde cierre del turno hasta PDF final",
      },
      {
        label: "NPS owners",
        value: "+62",
        description: "según encuesta interna Coastal Luxury",
      },
    ],
    quote:
      "Por primera vez tenemos trazabilidad completa: checklist firmado, fotos, inventario y seguimiento de incidencias en un solo lugar. Nuestros owners están fascinados.",
    spokesperson: "Ana Sofía Ramírez",
    spokespersonRole: "Portfolio Manager · Coastal Luxury Properties",
  },
];
