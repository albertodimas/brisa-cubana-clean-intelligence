import {
  PrismaClient,
  BookingStatus,
  NotificationType,
  PropertyType,
  UserRole,
} from "@prisma/client";
import { addHours } from "date-fns";

const prisma = new PrismaClient();

const PASSWORD_HASH =
  "$2a$10$Rh8ljaYqrkUNe4l.rxkDKek/pixK3GkjRuHM47fOjf80gZIydzoL."; // hash de "Brisa123!"

async function seedDemo() {
  const demoClient = await prisma.user.upsert({
    where: { email: "cliente@brisacubanacleanintelligence.com" },
    update: {},
    create: {
      email: "cliente@brisacubanacleanintelligence.com",
      fullName: "Sofía Márquez",
      role: UserRole.CLIENT,
      isActive: true,
      passwordHash: PASSWORD_HASH,
    },
  });

  const [
    turnoverPremium,
    deepCleanBrickell,
    _postConstructionBoutique,
    amenityRefresh,
  ] = await Promise.all([
    prisma.service.upsert({
      where: { name: "Turnover Premium Airbnb" },
      update: {},
      create: {
        name: "Turnover Premium Airbnb",
        description:
          "Cambio integral entre huéspedes con restocking completo, lavandería express y reporte fotográfico en menos de 4 horas.",
        basePrice: 209.0,
        durationMin: 160,
      },
    }),
    prisma.service.upsert({
      where: { name: "Deep Clean Brickell Collection" },
      update: {},
      create: {
        name: "Deep Clean Brickell Collection",
        description:
          "Limpieza profunda trimestral con detailing premium, tratamiento antivaho y control de inventario.",
        basePrice: 289.0,
        durationMin: 210,
      },
    }),
    prisma.service.upsert({
      where: { name: "Post-Construcción Boutique" },
      update: {},
      create: {
        name: "Post-Construcción Boutique",
        description:
          "Limpieza fina tras remodelaciones: pulido de superficies, remoción de residuos y staging final para entrega premium.",
        basePrice: 349.0,
        durationMin: 240,
      },
    }),
    prisma.service.upsert({
      where: { name: "Amenity Refresh Express" },
      update: {},
      create: {
        name: "Amenity Refresh Express",
        description:
          "Reposición y staging rápido entre estancias back-to-back con checklist de decoración ligera.",
        basePrice: 129.0,
        durationMin: 90,
      },
    }),
  ]);

  const [skylineLoft, azureVilla] = await Promise.all([
    prisma.property.upsert({
      where: { label: "Skyline Loft Brickell" },
      update: {},
      create: {
        label: "Skyline Loft Brickell",
        addressLine: "120 SW 8th St",
        city: "Miami",
        state: "FL",
        zipCode: "33130",
        type: PropertyType.VACATION_RENTAL,
        ownerId: demoClient.id,
        sqft: 1150,
        bedrooms: 2,
        bathrooms: 2,
        notes: "Vista panorámica · Smart-home · Piso 32",
      },
    }),
    prisma.property.upsert({
      where: { label: "Azure Villa Key Biscayne" },
      update: {},
      create: {
        label: "Azure Villa Key Biscayne",
        addressLine: "745 Harbor Dr",
        city: "Key Biscayne",
        state: "FL",
        zipCode: "33149",
        type: PropertyType.VACATION_RENTAL,
        ownerId: demoClient.id,
        sqft: 3800,
        bedrooms: 4,
        bathrooms: 5,
        notes:
          "Piscina climatizada · Acceso privado a playa · Calendario high-turnover",
      },
    }),
  ]);

  await prisma.booking.upsert({
    where: { code: "BRISA-0001" },
    update: {},
    create: {
      code: "BRISA-0001",
      customerId: demoClient.id,
      propertyId: skylineLoft.id,
      serviceId: turnoverPremium.id,
      scheduledAt: addHours(new Date(), 24),
      durationMin: turnoverPremium.durationMin,
      status: BookingStatus.CONFIRMED,
      totalAmount: turnoverPremium.basePrice,
      notes:
        "Stock de amenities ‘Signature Citrus’. Revisar sensor de humedad en master bedroom antes de la entrega.",
    },
  });

  await prisma.booking.upsert({
    where: { code: "BRISA-0002" },
    update: {},
    create: {
      code: "BRISA-0002",
      customerId: demoClient.id,
      propertyId: skylineLoft.id,
      serviceId: deepCleanBrickell.id,
      scheduledAt: addHours(new Date(), 72),
      durationMin: deepCleanBrickell.durationMin,
      status: BookingStatus.PENDING,
      totalAmount: deepCleanBrickell.basePrice,
      notes:
        "Cliente solicita aromaterapia ‘Ocean Mist’. Ajustar difusor al modo eco al finalizar.",
    },
  });

  await prisma.booking.upsert({
    where: { code: "BRISA-0003" },
    update: {},
    create: {
      code: "BRISA-0003",
      customerId: demoClient.id,
      propertyId: azureVilla.id,
      serviceId: amenityRefresh.id,
      scheduledAt: addHours(new Date(), 36),
      durationMin: amenityRefresh.durationMin,
      status: BookingStatus.CONFIRMED,
      totalAmount: amenityRefresh.basePrice,
      notes:
        "Back-to-back check-in/out. Reponer welcome kit, revisar toallas de playa y staging del patio.",
    },
  });

  const coordinator = await prisma.user.findUnique({
    where: { email: "operaciones@brisacubanacleanintelligence.com" },
    select: { id: true },
  });

  if (coordinator) {
    await prisma.notification.createMany({
      data: [
        {
          userId: coordinator.id,
          type: NotificationType.BOOKING_CREATED,
          message:
            "Se agendó BRISA-0003 – Amenity Refresh Express en Azure Villa Key Biscayne.",
          readAt: null,
        },
        {
          userId: coordinator.id,
          type: NotificationType.SERVICE_UPDATED,
          message:
            "El servicio Turnover Premium Airbnb ahora incluye auditoría de inventario con RFID.",
          readAt: null,
        },
        {
          userId: coordinator.id,
          type: NotificationType.BOOKING_RESCHEDULED,
          message:
            "Alerta: cliente reporta humedad en baño de visitas (Skyline Loft Brickell) – coordinar inspección preventiva.",
          readAt: null,
        },
      ],
      skipDuplicates: true,
    });
  }

  await prisma.lead.createMany({
    data: [
      {
        name: "Mariana López",
        email: "mariana@brickellbnb.com",
        phone: "+1 305-555-8120",
        company: "Brickell BNB Collective",
        propertyCount: "12",
        serviceInterest: "Turnover Premium Airbnb",
        planCode: "turnover",
        status: "CONTACTED",
        notes:
          "Demo agendada para 2 de noviembre. Solicita integración con Guesty.",
        utmSource: "google",
        utmMedium: "cpc",
        utmCampaign: "turnover-miami-q4",
        utmContent: "headline_a",
        utmTerm: "airbnb cleaning miami",
      },
      {
        name: "Andrés Torres",
        email: "atorres@luxstaymiami.com",
        phone: "+1 786-555-4421",
        company: "LuxStay Miami",
        propertyCount: "28",
        serviceInterest: "Deep Clean Brickell Collection",
        planCode: "deep-clean",
        status: "QUALIFIED",
        notes:
          "Busca proveedor recurrente para tres penthouses en Brickell. Pide SLA de 3h post-checkout.",
        utmSource: "linkedin",
        utmMedium: "inmail",
        utmCampaign: "luxury-host-outreach",
      },
      {
        name: "Claudia Fernández",
        email: "claudia@keybiscayneescapes.com",
        phone: "+1 954-555-7770",
        company: "Key Biscayne Escapes",
        propertyCount: "6",
        serviceInterest: "Amenity Refresh Express",
        planCode: "post-construction",
        status: "NEW",
        notes: "Solicita cotización piloto para fin de semana largo (5-7 dic).",
        utmSource: "instagram",
        utmMedium: "organic",
        utmCampaign: "october-before-after",
      },
      {
        name: "Alexander Ruiz",
        email: "aruiz@sunsetstays.co",
        phone: "+1 786-555-9910",
        company: "Sunset Stays Co.",
        propertyCount: "18",
        serviceInterest: "Turnover Premium Airbnb",
        planCode: "turnover",
        status: "CONVERTED",
        notes:
          "Contrato piloto firmado (4 propiedades). Arrancan el 4-nov. Requiere reporte semanal KPI.",
        utmSource: "referral",
        utmMedium: "partner",
        utmCampaign: "partner-2025",
      },
      {
        name: "Patricia Vega",
        email: "patricia@miamiboutiquerentals.com",
        phone: "+1 305-555-3345",
        company: "Miami Boutique Rentals",
        propertyCount: "10",
        serviceInterest: "Deep Clean Brickell Collection",
        planCode: "deep-clean",
        status: "LOST",
        notes:
          "Decidió esperar hasta enero 2026 por presupuesto. Mantener en nurture trimestral.",
        utmSource: "newsletter",
        utmMedium: "email",
        utmCampaign: "oct-2025-product-launch",
      },
    ],
    skipDuplicates: true,
  });
}

seedDemo()
  .catch((error) => {
    console.error("Seed demo falló", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
