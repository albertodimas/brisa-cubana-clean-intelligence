import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PrismaClient, UserRole } from "@prisma/client";
import { UserRepository } from "./user-repository.js";

describe("UserRepository", () => {
  let repository: UserRepository;
  let prisma: Pick<PrismaClient, "user">;

  beforeEach(() => {
    prisma = {
      user: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    } as unknown as Pick<PrismaClient, "user">;

    repository = new UserRepository(prisma as PrismaClient);
  });

  it("findMany returns paginated users", async () => {
    const records = Array.from({ length: 3 }, (_, index) => ({
      id: `user_${index}`,
      email: `user${index}@test.com`,
      fullName: `User ${index}`,
      role: "STAFF" as UserRole,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      passwordHash: "hashed",
    }));

    vi.mocked(prisma.user.findMany).mockResolvedValue(records);

    const result = await repository.findMany({ limit: 2 });

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 3,
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        select: expect.objectContaining({ email: true }),
      }),
    );

    expect(result.data).toHaveLength(2);
    expect(result.pagination.hasMore).toBe(true);
  });

  it("findByEmail delegates to prisma", async () => {
    const user = {
      id: "user_1",
      email: "user@test.com",
      fullName: "User",
      role: "ADMIN" as UserRole,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      passwordHash: "hashed",
    };

    vi.mocked(prisma.user.findUnique).mockResolvedValue(user);

    const result = await repository.findByEmail("user@test.com");

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "user@test.com" },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    expect(result).toBe(user);
  });

  it("findAuthByEmail returns user including password hash", async () => {
    const authUser = {
      id: "user_2",
      email: "secure@test.com",
      fullName: "Secure User",
      role: "COORDINATOR" as UserRole,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      passwordHash: "hashed",
    };

    vi.mocked(prisma.user.findUnique).mockResolvedValue(authUser);

    const result = await repository.findAuthByEmail("secure@test.com");

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "secure@test.com" },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        passwordHash: true,
      },
    });
    expect(result).toBe(authUser);
  });

  it("creates a user with hashed password", async () => {
    const payload = {
      email: "user@test.com",
      fullName: "User",
      passwordHash: "hashed",
      role: "COORDINATOR" as UserRole,
    };

    const created = {
      ...payload,
      isActive: true,
      id: "user_new",
      createdAt: new Date(),
      updatedAt: new Date(),
      passwordHash: payload.passwordHash,
    };

    vi.mocked(prisma.user.create).mockResolvedValue(created);

    const result = await repository.create(payload);

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: payload.email,
        fullName: payload.fullName,
        role: payload.role,
        isActive: true,
        passwordHash: payload.passwordHash,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    expect(result).toBe(created);
  });

  it("updates a user", async () => {
    const updated = {
      id: "user_1",
      email: "user@test.com",
      fullName: "Updated",
      role: "ADMIN" as UserRole,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      passwordHash: "hashed",
    };

    vi.mocked(prisma.user.update).mockResolvedValue(updated);

    const result = await repository.update("user_1", {
      fullName: "Updated",
      passwordHash: "hashed",
    });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user_1" },
      data: { fullName: "Updated", passwordHash: "hashed" },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    expect(result).toBe(updated);
  });

  it("deletes a user", async () => {
    vi.mocked(prisma.user.delete).mockResolvedValue({} as any);

    await repository.delete("user_1");

    expect(prisma.user.delete).toHaveBeenCalledWith({
      where: { id: "user_1" },
    });
  });
});
