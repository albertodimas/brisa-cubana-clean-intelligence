import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

const PASSWORD_HASH =
  "$2a$10$Rh8ljaYqrkUNe4l.rxkDKek/pixK3GkjRuHM47fOjf80gZIydzoL."; // hash de "Brisa123!"
const DEFAULT_TENANT_ID =
  process.env.DEFAULT_TENANT_ID ?? "tenant_brisa_cubana";
const DEFAULT_TENANT_SLUG = process.env.DEFAULT_TENANT_SLUG ?? "brisa-cubana";

async function ensureDefaultTenant() {
  return prisma.tenant.upsert({
    where: { slug: DEFAULT_TENANT_SLUG },
    update: {
      name: "Brisa Cubana Clean Intelligence",
    },
    create: {
      id: DEFAULT_TENANT_ID,
      slug: DEFAULT_TENANT_SLUG,
      name: "Brisa Cubana Clean Intelligence",
      plan: "SCALE",
      status: "ACTIVE",
    },
  });
}

async function upsertMembership(userId: string, role: UserRole) {
  await prisma.userTenant.upsert({
    where: {
      userId_tenantId: {
        userId,
        tenantId: DEFAULT_TENANT_ID,
      },
    },
    update: { role },
    create: {
      userId,
      tenantId: DEFAULT_TENANT_ID,
      role,
    },
  });
}

async function seedOperativo() {
  await ensureDefaultTenant();

  const [admin, coordinator] = await Promise.all([
    prisma.user.upsert({
      where: { email: "admin@brisacubanacleanintelligence.com" },
      update: {},
      create: {
        email: "admin@brisacubanacleanintelligence.com",
        fullName: "Laura Domínguez",
        role: UserRole.ADMIN,
        isActive: true,
        passwordHash: PASSWORD_HASH,
      },
    }),
    prisma.user.upsert({
      where: { email: "operaciones@brisacubanacleanintelligence.com" },
      update: {},
      create: {
        email: "operaciones@brisacubanacleanintelligence.com",
        fullName: "Andrés Cabrera",
        role: UserRole.COORDINATOR,
        isActive: true,
        passwordHash: PASSWORD_HASH,
      },
    }),
  ]);

  await Promise.all([
    upsertMembership(admin.id, admin.role),
    upsertMembership(coordinator.id, coordinator.role),
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
