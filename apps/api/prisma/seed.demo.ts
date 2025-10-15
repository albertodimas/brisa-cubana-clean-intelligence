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
    where: { email: "client@brisacubanaclean.com" },
    update: {},
    create: {
      email: "client@brisacubanaclean.com",
      fullName: "Cliente Piloto",
      role: UserRole.CLIENT,
      isActive: true,
      passwordHash: PASSWORD_HASH,
    },
  });

  const [deepClean, turnover] = await Promise.all([
    prisma.service.upsert({
      where: { name: "Deep Clean Residencial" },
      update: {},
      create: {
        name: "Deep Clean Residencial",
        description: "Limpieza profunda con checklist de 60 puntos.",
        basePrice: 220.0,
        durationMin: 180,
      },
    }),
    prisma.service.upsert({
      where: { name: "Turnover Vacation Rental" },
      update: {},
      create: {
        name: "Turnover Vacation Rental",
        description:
          "Cambio completo entre huéspedes con reposición de amenities.",
        basePrice: 185.0,
        durationMin: 150,
      },
    }),
  ]);

  const property = await prisma.property.upsert({
    where: { label: "Brickell Loft" },
    update: {},
    create: {
      label: "Brickell Loft",
      addressLine: "120 SW 8th St",
      city: "Miami",
      state: "FL",
      zipCode: "33130",
      type: PropertyType.VACATION_RENTAL,
      ownerId: demoClient.id,
      sqft: 1100,
      bedrooms: 2,
      bathrooms: 2,
    },
  });

  await prisma.booking.upsert({
    where: { code: "BRISA-0001" },
    update: {},
    create: {
      code: "BRISA-0001",
      customerId: demoClient.id,
      propertyId: property.id,
      serviceId: deepClean.id,
      scheduledAt: addHours(new Date(), 24),
      durationMin: deepClean.durationMin,
      status: BookingStatus.CONFIRMED,
      totalAmount: deepClean.basePrice,
      notes: "Incluir aromaterapia y reposición de amenities premium.",
    },
  });

  await prisma.booking.upsert({
    where: { code: "BRISA-0002" },
    update: {},
    create: {
      code: "BRISA-0002",
      customerId: demoClient.id,
      propertyId: property.id,
      serviceId: turnover.id,
      scheduledAt: addHours(new Date(), 72),
      durationMin: turnover.durationMin,
      status: BookingStatus.PENDING,
      totalAmount: turnover.basePrice,
    },
  });

  const coordinator = await prisma.user.findUnique({
    where: { email: "ops@brisacubanaclean.com" },
    select: { id: true },
  });

  if (coordinator) {
    await prisma.notification.createMany({
      data: [
        {
          userId: coordinator.id,
          type: NotificationType.BOOKING_CREATED,
          message: "Se creó una nueva reserva para Brickell Loft",
        },
        {
          userId: coordinator.id,
          type: NotificationType.SERVICE_UPDATED,
          message: "El servicio Deep Clean Residencial cambió su precio base",
          readAt: null,
        },
      ],
      skipDuplicates: true,
    });
  }
}

seedDemo()
  .catch((error) => {
    console.error("Seed demo falló", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
