import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PrismaClient, UserRole } from "@prisma/client";
import { UserRepository } from "./user-repository.js";

const DEFAULT_TENANT = "tenant_brisa_cubana";
const CUSTOM_TENANT = "tenant_custom";

function buildUser(index = 0, role: UserRole = "STAFF") {
  return {
    id: `user_${index}`,
    email: `user${index}@test.com`,
    fullName: `User ${index}`,
    role,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    tenants: [
      {
        tenantId: DEFAULT_TENANT,
        role,
        tenant: {
          slug: "brisa",
          name: "Brisa Cubana",
          status: "ACTIVE",
        },
      },
    ],
  };
}

describe("UserRepository", () => {
  let repository: UserRepository;
  let prisma: {
    user: {
      findMany: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    prisma = {
      user: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
    };

    repository = new UserRepository(prisma as unknown as PrismaClient);
  });

  it("findMany scopes by tenant and returns paginated data", async () => {
    const users = [buildUser(0, "ADMIN"), buildUser(1, "STAFF"), buildUser(2)];
    vi.mocked(prisma.user.findMany).mockResolvedValue(users);

    const result = await repository.findMany({ limit: 2 });

    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: {
        AND: [
          {
            tenants: { some: { tenantId: DEFAULT_TENANT } },
          },
        ],
      },
      take: 3,
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: expect.any(Object),
    });
    expect(result.data).toHaveLength(2);
    expect(result.data[0]).toMatchObject({
      role: "ADMIN",
      tenants: [
        expect.objectContaining({
          tenantId: DEFAULT_TENANT,
          tenantSlug: "brisa",
        }),
      ],
    });
    expect(result.pagination.hasMore).toBe(true);
  });

  it("findByEmail selects tenants and normalizes response", async () => {
    const user = buildUser();
    vi.mocked(prisma.user.findUnique).mockResolvedValue(user);

    const result = await repository.findByEmail("user0@test.com");

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "user0@test.com" },
      select: expect.objectContaining({
        tenants: expect.any(Object),
      }),
    });
    expect(result?.tenants?.[0]?.tenantId).toBe(DEFAULT_TENANT);
  });

  it("findAuthByEmail includes password hash in select", async () => {
    const authUser = {
      ...buildUser(0, "COORDINATOR"),
      passwordHash: "hashed",
    };
    vi.mocked(prisma.user.findUnique).mockResolvedValue(authUser as any);

    const result = await repository.findAuthByEmail("login@test.com");

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "login@test.com" },
      select: expect.objectContaining({
        passwordHash: true,
        tenants: expect.any(Object),
      }),
    });
    expect(result?.passwordHash).toBe("hashed");
    expect(result?.tenants?.[0]?.tenantId).toBe(DEFAULT_TENANT);
  });

  it("creates a user with tenant membership", async () => {
    const payload = {
      email: "new@test.com",
      fullName: "New User",
      passwordHash: "hashed",
      role: "STAFF" as UserRole,
      tenantId: DEFAULT_TENANT,
    };
    const created = buildUser(99, "STAFF");
    vi.mocked(prisma.user.create).mockResolvedValue(created as any);

    await repository.create(payload);

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: payload.email,
        fullName: payload.fullName,
        role: payload.role,
        isActive: true,
        passwordHash: payload.passwordHash,
        tenants: {
          create: {
            tenantId: payload.tenantId,
            role: payload.role,
          },
        },
      },
      select: expect.any(Object),
    });
  });

  it("update, delete and restore follow tenant rules", async () => {
    const updated = buildUser(1, "ADMIN");
    vi.mocked(prisma.user.update).mockResolvedValue(updated as any);

    const result = await repository.update(
      "user_1",
      { fullName: "Updated" },
      CUSTOM_TENANT,
    );

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user_1" },
      data: { fullName: "Updated" },
      select: expect.any(Object),
    });
    expect(result.role).toBe("ADMIN");

    await repository.delete("user_1");
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user_1" },
      data: { deletedAt: expect.any(Date) },
    });

    vi.mocked(prisma.user.update).mockResolvedValue(updated as any);
    const restored = await repository.restore("user_1");
    expect(restored.role).toBe("ADMIN");
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user_1" },
      data: { deletedAt: null },
      select: expect.any(Object),
    });
  });
});
