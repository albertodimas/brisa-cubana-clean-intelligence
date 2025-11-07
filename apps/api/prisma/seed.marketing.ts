import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding marketing content...");

  await Promise.all([
    prisma.marketStat.deleteMany(),
    prisma.pricingTier.deleteMany(),
    prisma.fAQ.deleteMany(),
    prisma.testimonial.deleteMany(),
    prisma.portfolioStats.deleteMany(),
  ]);

  // Portfolio Stats
  console.log("📊 Seeding portfolio stats...");
  await prisma.portfolioStats.create({
    data: {
      activeProperties: 42,
      averageRating: 4.92,
      totalTurnovers: 1240,
      period: "Q4 2025",
    },
  });

  // Testimonials
  console.log("💬 Seeding testimonials...");
  const testimonials = [
    {
      author: "María González Castro",
      role: "Property Manager, Brickell Portfolio (18 unidades)",
      quote:
        "Brisa transformó nuestra operación STR. Antes gastábamos 8+ horas coordinando turnovers; ahora recibimos reportes con fotos en menos de 4 horas y cero sorpresas. El portal cliente es un game-changer para nuestros propietarios.",
      status: "APPROVED" as const,
      order: 1,
      isActive: true,
    },
    {
      author: "Javier Sánchez Ruiz",
      role: "Owner, Miami Beach Vacation Rentals (6 propiedades)",
      quote:
        "Probé otros servicios premium y ninguno documenta como Brisa. Las evidencias fotográficas con timestamp y checklist digital me dieron la confianza para escalar a 3 propiedades más. Ahora compito con hoteles boutique.",
      status: "APPROVED" as const,
      order: 2,
      isActive: true,
    },
    {
      author: "Carolina Pérez Valdés",
      role: "Superhost, Downtown Miami (4 propiedades STR)",
      quote:
        "Desde que Brisa opera mis turnovers, mis ratings subieron de 4.7 a 4.95⭐. Los huéspedes destacan la limpieza impecable en cada reseña. El staging premium realmente hace la diferencia en fotos y experiencia.",
      status: "APPROVED" as const,
      order: 3,
      isActive: true,
    },
    {
      author: "Luis Hernández Ortega",
      role: "Investor, Edgewater Portfolio (12 condos premium)",
      quote:
        "El QA semanal con auditoría fotográfica me permite gestionar el portfolio remotamente sin sorpresas. Brisa se convirtió en mi brazo derecho operativo; puedo enfocarme en adquisiciones y dejar la ejecución a profesionales.",
      status: "APPROVED" as const,
      order: 4,
      isActive: true,
    },
  ];

  for (const testimonial of testimonials) {
    await prisma.testimonial.create({ data: testimonial });
  }

  // FAQs
  console.log("❓ Seeding FAQs...");
  const faqs = [
    {
      question: "¿Operan 24/7?",
      answer:
        "Sí. Miami concentra la demanda en temporada alta (noviembre-marzo); mantenemos guardias 24/7 para cubrir emergencias y same-day turnovers.",
      order: 1,
      isActive: true,
    },
    {
      question: "¿Qué productos de limpieza usan?",
      answer:
        "Operamos con líneas certificadas por EPA Safer Choice e insumos hipoalergénicos; podemos trabajar con tu inventario o abastecerlo íntegramente.",
      order: 2,
      isActive: true,
    },
    {
      question: "¿Cómo funciona el portal cliente?",
      answer:
        "Recibes un enlace mágico válido por 12 horas; allí gestionas reservas, reagendos, cancelaciones y descargas evidencias con fotos y firmas digitales.",
      order: 3,
      isActive: true,
    },
    {
      question: "¿Cuál es el tiempo mínimo de contrato?",
      answer:
        "No tenemos contratos de permanencia. Operamos con acuerdos mensuales flexibles que puedes ajustar según tu ocupación y temporada. Ideal para portfolios que escalan o reducen unidades.",
      order: 4,
      isActive: true,
    },
    {
      question: "¿Cubren todas las zonas de Miami?",
      answer:
        "Actualmente operamos en Brickell, Downtown, Edgewater, Wynwood y Miami Beach. Para zonas fuera de estas áreas, evaluamos caso por caso basándonos en la concentración de propiedades del portfolio.",
      order: 5,
      isActive: true,
    },
    {
      question: "¿Qué pasa si hay un problema durante el turno?",
      answer:
        "Incidencias críticas se reportan en menos de 15 minutos con fotos y plan de acción. El supervisor asignado coordina la resolución y documenta todo en el portal con timeline completo.",
      order: 6,
      isActive: true,
    },
  ];

  for (const faq of faqs) {
    await prisma.fAQ.create({ data: faq });
  }

  // Pricing Tiers
  console.log("💰 Seeding pricing tiers...");
  const pricingTiers = [
    {
      tierCode: "turnover",
      name: "Turnover Premium",
      headline: "Turnos garantizados < 120 min",
      description:
        "Limpieza completa entre huéspedes con staging para fotografías five-star. Ideal para STR con ocupación moderada-alta.",
      price: "$249",
      priceSuffix: "por salida confirmada",
      features: [
        "Limpieza profunda de todas las áreas",
        "Staging profesional para fotos",
        "Checklist digital + 15-30 fotos",
        "Entrega <4h desde checkout",
        "Kit de amenidades incluido",
        "Reporte PDF descargable",
      ],
      addons: [
        "Lavado de ropa de cama: +$35",
        "Reabastecimiento de insumos: +$25",
        "Limpieza de electrodomésticos: +$40",
      ],
      highlighted: false,
      order: 1,
      isActive: true,
    },
    {
      tierCode: "deep-clean",
      name: "Deep Clean Mensual",
      headline: "Detallado premium trimestral",
      description:
        "Limpieza exhaustiva programada para mantener estándares premium en propiedades con uso intensivo.",
      price: "$399",
      priceSuffix: "por propiedad de 2BR",
      features: [
        "Limpieza exhaustiva de techos, paredes, zócalos",
        "Electrodomésticos (dentro y fuera)",
        "Desinfección total de baños y cocina",
        "Ventanas + marcos + cortinas",
        "Documentación fotográfica completa",
        "Coordinación con owner/PM",
      ],
      addons: [
        "Limpieza de balcón/terraza: +$75",
        "Aspirado de muebles tapizados: +$50",
      ],
      highlighted: true,
      order: 2,
      isActive: true,
    },
    {
      tierCode: "post-construction",
      name: "Post-Construction / Move-In Ready",
      headline: "Ready para listing nuevo",
      description:
        "Servicio especializado para nuevas adquisiciones, renovaciones o lanzamientos de listing.",
      price: "Cotización",
      priceSuffix: "según alcance",
      features: [
        "Remoción de residuos de obra",
        "Limpieza industrial de superficies",
        "Desinfección profunda de toda la unidad",
        "Preparación para primeras fotos profesionales",
        "Staging inicial + kit de bienvenida",
        "Certificado de limpieza con firma",
      ],
      addons: [],
      highlighted: false,
      order: 3,
      isActive: true,
    },
  ];

  for (const tier of pricingTiers) {
    await prisma.pricingTier.create({ data: tier });
  }

  console.log("✅ Marketing content seeded successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Error seeding marketing content:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
