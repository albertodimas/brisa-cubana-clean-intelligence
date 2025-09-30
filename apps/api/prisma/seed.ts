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

  // Create users with different roles
  const passwordHash = await hashPassword("demo123");

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@brisacubanaclean.com" },
    update: {},
    create: {
      email: "admin@brisacubanaclean.com",
      name: "Admin User",
      phone: "+1-305-555-0001",
      role: "ADMIN",
      passwordHash,
    },
  });

  const staffUser = await prisma.user.upsert({
    where: { email: "staff@brisacubanaclean.com" },
    update: {},
    create: {
      email: "staff@brisacubanaclean.com",
      name: "Staff Member",
      phone: "+1-305-555-0002",
      role: "STAFF",
      passwordHash,
    },
  });

  const clientUser = await prisma.user.upsert({
    where: { email: "client@brisacubanaclean.com" },
    update: {},
    create: {
      email: "client@brisacubanaclean.com",
      name: "Maria Rodriguez",
      phone: "+1-305-555-0100",
      role: "CLIENT",
      passwordHash,
    },
  });

  const propertyManager = await prisma.user.upsert({
    where: { email: "carlos.mendez@example.com" },
    update: {},
    create: {
      email: "carlos.mendez@example.com",
      name: "Carlos Mendez",
      phone: "+1-305-555-0200",
      role: "CLIENT",
      passwordHash,
    },
  });

  console.log("✅ Users created:", {
    admin: adminUser.email,
    staff: staffUser.email,
    client: clientUser.email,
    propertyManager: propertyManager.email,
  });

  // Create properties for different scenarios
  const residentialProperty = await prisma.property.upsert({
    where: { id: "prop-residential-1" },
    update: {},
    create: {
      id: "prop-residential-1",
      name: "Brickell Luxury Apartment",
      address: "1234 Brickell Ave, Unit 2501",
      city: "Miami",
      state: "FL",
      zipCode: "33131",
      type: "RESIDENTIAL",
      size: 1200,
      userId: clientUser.id,
    },
  });

  const vacationRentalProperty = await prisma.property.upsert({
    where: { id: "prop-vacation-1" },
    update: {},
    create: {
      id: "prop-vacation-1",
      name: "Wynwood Vacation Rental",
      address: "567 NW 2nd Ave",
      city: "Miami",
      state: "FL",
      zipCode: "33127",
      type: "VACATION_RENTAL",
      size: 900,
      userId: propertyManager.id,
    },
  });

  const officeProperty = await prisma.property.upsert({
    where: { id: "prop-office-1" },
    update: {},
    create: {
      id: "prop-office-1",
      name: "Downtown Miami Office",
      address: "100 SE 2nd Street, Suite 4000",
      city: "Miami",
      state: "FL",
      zipCode: "33131",
      type: "OFFICE",
      size: 3000,
      userId: propertyManager.id,
    },
  });

  const hospitalityProperty = await prisma.property.upsert({
    where: { id: "prop-hospitality-1" },
    update: {},
    create: {
      id: "prop-hospitality-1",
      name: "South Beach Boutique Hotel",
      address: "1500 Ocean Drive",
      city: "Miami Beach",
      state: "FL",
      zipCode: "33139",
      type: "HOSPITALITY",
      size: 15000,
      userId: propertyManager.id,
    },
  });

  console.log("✅ Properties created:", {
    residential: residentialProperty.name,
    vacation: vacationRentalProperty.name,
    office: officeProperty.name,
    hospitality: hospitalityProperty.name,
  });

  // Create sample bookings with different statuses
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  await prisma.booking.upsert({
    where: { id: "booking-completed-1" },
    update: {},
    create: {
      id: "booking-completed-1",
      userId: clientUser.id,
      propertyId: residentialProperty.id,
      serviceId: basicClean.id,
      scheduledAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      totalPrice: 89.99,
      status: "COMPLETED",
      paymentStatus: "PAID",
      completedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.booking.upsert({
    where: { id: "booking-confirmed-1" },
    update: {},
    create: {
      id: "booking-confirmed-1",
      userId: clientUser.id,
      propertyId: residentialProperty.id,
      serviceId: deepClean.id,
      scheduledAt: tomorrow,
      totalPrice: 149.99,
      status: "CONFIRMED",
      paymentStatus: "PENDING",
    },
  });

  await prisma.booking.upsert({
    where: { id: "booking-pending-1" },
    update: {},
    create: {
      id: "booking-pending-1",
      userId: propertyManager.id,
      propertyId: vacationRentalProperty.id,
      serviceId: vacationRental.id,
      scheduledAt: nextWeek,
      totalPrice: 119.99,
      status: "PENDING",
      paymentStatus: "PENDING",
    },
  });

  await prisma.booking.upsert({
    where: { id: "booking-office-1" },
    update: {},
    create: {
      id: "booking-office-1",
      userId: propertyManager.id,
      propertyId: officeProperty.id,
      serviceId: deepClean.id,
      scheduledAt: nextWeek,
      totalPrice: 299.99,
      status: "CONFIRMED",
      paymentStatus: "PAID",
    },
  });

  console.log("✅ Sample bookings created");

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
