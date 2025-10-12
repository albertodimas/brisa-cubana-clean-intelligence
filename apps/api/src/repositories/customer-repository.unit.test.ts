import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PrismaClient, UserRole } from "@prisma/client";
import { CustomerRepository } from "./customer-repository.js";

describe("CustomerRepository", () => {
  let repository: CustomerRepository;
  let prisma: Pick<PrismaClient, "user">;

  beforeEach(() => {
    prisma = {
      user: {
        findMany: vi.fn(),
      },
    } as unknown as Pick<PrismaClient, "user">;

    repository = new CustomerRepository(prisma as PrismaClient);
  });

  it("returns paginated customers", async () => {
    const customers = Array.from({ length: 3 }, (_, index) => ({
      id: `cust_${index}`,
      email: `customer${index}@test.com`,
      fullName: `Customer ${index}`,
      role: "CLIENT" as UserRole,
      passwordHash: "hashed",
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    }));

    vi.mocked(prisma.user.findMany).mockResolvedValue(customers);

    const result = await repository.findMany({ limit: 2 });

    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: { role: "CLIENT" },
      take: 3,
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: {
        id: true,
        email: true,
        fullName: true,
      },
    });

    expect(result.data).toHaveLength(2);
    expect(result.pagination.hasMore).toBe(true);
    expect(result.pagination.nextCursor).toBe("cust_1");
  });
});
