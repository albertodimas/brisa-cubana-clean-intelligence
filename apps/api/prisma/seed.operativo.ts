import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

const PASSWORD_HASH =
  "$2a$10$Rh8ljaYqrkUNe4l.rxkDKek/pixK3GkjRuHM47fOjf80gZIydzoL."; // hash de "Brisa123!"

async function seedOperativo() {
  await Promise.all([
    prisma.user.upsert({
      where: { email: "admin@brisacubanaclean.com" },
      update: {},
      create: {
        email: "admin@brisacubanaclean.com",
        fullName: "Admin Brisa",
        role: UserRole.ADMIN,
        isActive: true,
        passwordHash: PASSWORD_HASH,
      },
    }),
    prisma.user.upsert({
      where: { email: "ops@brisacubanaclean.com" },
      update: {},
      create: {
        email: "ops@brisacubanaclean.com",
        fullName: "Coordinadora Operaciones",
        role: UserRole.COORDINATOR,
        isActive: true,
        passwordHash: PASSWORD_HASH,
      },
    }),
  ]);
}

seedOperativo()
  .catch((error) => {
    console.error("Seed operativo falló", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
