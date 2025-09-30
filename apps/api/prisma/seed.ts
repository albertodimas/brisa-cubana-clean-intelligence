import { PrismaClient } from "../src/generated/prisma";
import { hashPassword } from "../src/lib/password";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create services
  const basicClean = await prisma.service.upsert({
    where: { id: "basic-clean-1" },
    update: {},
    create: {
      id: "basic-clean-1",
      name: "Limpieza Básica",
      description: "Limpieza estándar de espacios residenciales y oficinas",
      basePrice: 89.99,
      duration: 120,
      active: true,
    },
  });

  const deepClean = await prisma.service.upsert({
    where: { id: "deep-clean-1" },
    update: {},
    create: {
      id: "deep-clean-1",
      name: "Limpieza Profunda",
      description: "Limpieza detallada incluyendo áreas difíciles",
      basePrice: 149.99,
      duration: 180,
      active: true,
    },
  });

  const moveInOut = await prisma.service.upsert({
    where: { id: "move-in-out-1" },
    update: {},
    create: {
      id: "move-in-out-1",
      name: "Move In/Out",
      description: "Limpieza completa para mudanzas",
      basePrice: 199.99,
      duration: 240,
      active: true,
    },
  });

  const vacationRental = await prisma.service.upsert({
    where: { id: "vacation-rental-1" },
    update: {},
    create: {
      id: "vacation-rental-1",
      name: "Turnover Vacation Rental",
      description: "Limpieza express entre huéspedes con reporte fotográfico",
      basePrice: 119.99,
      duration: 90,
      active: true,
    },
  });

  console.log("✅ Services created:", {
    basicClean,
    deepClean,
    moveInOut,
    vacationRental,
  });

  // Create demo user
  const demoPasswordHash = await hashPassword("demo123");

  const demoUser = await prisma.user.upsert({
    where: { email: "demo@brisacubanaclean.com" },
    update: {},
    create: {
      email: "demo@brisacubanaclean.com",
      name: "Demo User",
      phone: "+1-305-555-0100",
      role: "CLIENT",
      passwordHash: demoPasswordHash,
    },
  });

  console.log("✅ Demo user created:", demoUser);

  // Create demo property
  const demoProperty = await prisma.property.create({
    data: {
      name: "Brickell Apartment",
      address: "1234 Brickell Ave",
      city: "Miami",
      state: "FL",
      zipCode: "33131",
      type: "RESIDENTIAL",
      size: 1200,
      userId: demoUser.id,
    },
  });

  console.log("✅ Demo property created:", demoProperty);

  console.log("🎉 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
