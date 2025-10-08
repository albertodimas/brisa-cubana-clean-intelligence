import {
  PrismaClient,
  UserRole,
  PropertyType,
  BookingStatus,
} from "@prisma/client";
import { addHours } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  const passwordHash =
    "$2a$10$IvVmAwm6RG7yijDbnbiq8.qHhvrTwY3EeE559UaDlrY0lProxcWUu"; // bcrypt hash for "BrisaClean2025"

  const [_admin, coordinator, client] = await Promise.all([
    prisma.user.upsert({
      where: { email: "admin@brisacubanaclean.com" },
      update: {},
      create: {
        email: "admin@brisacubanaclean.com",
        fullName: "Admin Brisa",
        role: UserRole.ADMIN,
        passwordHash,
      },
    }),
    prisma.user.upsert({
      where: { email: "ops@brisacubanaclean.com" },
      update: {},
      create: {
        email: "ops@brisacubanaclean.com",
        fullName: "Coordinadora Operaciones",
        role: UserRole.COORDINATOR,
        passwordHash,
      },
    }),
    prisma.user.upsert({
      where: { email: "client@brisacubanaclean.com" },
      update: {},
      create: {
        email: "client@brisacubanaclean.com",
        fullName: "Cliente Piloto",
        role: UserRole.CLIENT,
        passwordHash,
      },
    }),
  ]);

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
      ownerId: client.id,
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
      customerId: client.id,
      assignedStaffId: coordinator.id,
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
      customerId: client.id,
      propertyId: property.id,
      serviceId: turnover.id,
      scheduledAt: addHours(new Date(), 72),
      durationMin: turnover.durationMin,
      status: BookingStatus.PENDING,
      totalAmount: turnover.basePrice,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
