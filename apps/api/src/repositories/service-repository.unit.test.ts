import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Prisma, PrismaClient } from "@prisma/client";
import { ServiceRepository } from "./service-repository.js";

const DEFAULT_TENANT = "tenant_brisa_cubana";

function ownerSelect() {
  return {
    tenantId: DEFAULT_TENANT,
  };
}

describe("ServiceRepository (Unit)", () => {
  let repository: ServiceRepository;
  let prisma: {
    service: {
      findFirst: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    prisma = {
      service: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
      },
    };

    repository = new ServiceRepository(prisma as unknown as PrismaClient);
  });

  it("findById scopes the lookup by tenant", async () => {
    const service = { id: "service_1", name: "Checklist", ...ownerSelect() };
    vi.mocked(prisma.service.findFirst).mockResolvedValue(service);

    const result = await repository.findById("service_1");

    expect(result).toEqual(service);
    expect(prisma.service.findFirst).toHaveBeenCalledWith({
      where: { id: "service_1", tenantId: DEFAULT_TENANT },
    });
  });

  it("findMany applies tenant constraint and pagination options", async () => {
    vi.mocked(prisma.service.findMany).mockResolvedValue([]);

    await repository.findMany({
      take: 10,
      skip: 5,
      cursor: { id: "cursor" },
      where: { active: true },
    });

    expect(prisma.service.findMany).toHaveBeenCalledWith({
      where: { active: true, tenantId: DEFAULT_TENANT },
      take: 10,
      skip: 5,
      cursor: { id: "cursor" },
      orderBy: { createdAt: "desc" },
    });
  });

  describe("findManyPaginated", () => {
    it("returns pagination metadata and enforces tenant scoping", async () => {
      const data = Array.from({ length: 11 }, (_, index) => ({
        id: `service_${index}`,
        name: `Service ${index}`,
        ...ownerSelect(),
      }));

      vi.mocked(prisma.service.findMany).mockResolvedValue(data);

      const result = await repository.findManyPaginated(10);

      expect(result.data).toHaveLength(10);
      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).toBe("service_9");
      expect(prisma.service.findMany).toHaveBeenCalledWith({
        where: { tenantId: DEFAULT_TENANT },
        take: 11,
        orderBy: { createdAt: "desc" },
      });
    });

    it("applies cursor skipping when provided", async () => {
      vi.mocked(prisma.service.findMany).mockResolvedValue([]);

      await repository.findManyPaginated(5, "cursor_123");

      expect(prisma.service.findMany).toHaveBeenCalledWith({
        where: { tenantId: DEFAULT_TENANT },
        take: 6,
        skip: 1,
        cursor: { id: "cursor_123" },
        orderBy: { createdAt: "desc" },
      });
    });

    it("accepts custom ordering", async () => {
      const orderBy: Prisma.ServiceOrderByWithRelationInput[] = [
        { name: "asc" },
        { id: "asc" },
      ];
      vi.mocked(prisma.service.findMany).mockResolvedValue([]);

      await repository.findManyPaginated(5, undefined, { orderBy });

      expect(prisma.service.findMany).toHaveBeenCalledWith({
        where: { tenantId: DEFAULT_TENANT },
        take: 6,
        orderBy,
      });
    });
  });

  it("create injects tenantId automatically", async () => {
    const payload = {
      name: "Deep Clean",
      description: "Checklist",
      basePrice: 150,
      durationMin: 60,
    };
    const created = { id: "service_new", ...payload, ...ownerSelect() };
    vi.mocked(prisma.service.create).mockResolvedValue(created);

    const result = await repository.create(payload);

    expect(result).toEqual(created);
    expect(prisma.service.create).toHaveBeenCalledWith({
      data: { ...payload, tenantId: DEFAULT_TENANT },
    });
  });

  it("update and lifecycle ops keep tenant in where clause", async () => {
    const updated = {
      id: "service_1",
      name: "Updated",
      basePrice: 250,
      ...ownerSelect(),
    };
    vi.mocked(prisma.service.update).mockResolvedValue(updated);

    const result = await repository.update("service_1", { basePrice: 250 });

    expect(result).toEqual(updated);
    expect(prisma.service.update).toHaveBeenCalledWith({
      where: { id: "service_1", tenantId: DEFAULT_TENANT },
      data: { basePrice: 250 },
    });

    await repository.delete("service_1");
    expect(prisma.service.update).toHaveBeenCalledWith({
      where: { id: "service_1", tenantId: DEFAULT_TENANT },
      data: { deletedAt: expect.any(Date) },
    });

    await repository.restore("service_1");
    expect(prisma.service.update).toHaveBeenCalledWith({
      where: { id: "service_1", tenantId: DEFAULT_TENANT },
      data: { deletedAt: null },
    });
  });

  it("count and findActive honor tenant scoping", async () => {
    vi.mocked(prisma.service.count).mockResolvedValue(5);
    vi.mocked(prisma.service.findMany).mockResolvedValue([]);

    await repository.count({ active: true });
    expect(prisma.service.count).toHaveBeenNthCalledWith(1, {
      where: { active: true, tenantId: DEFAULT_TENANT },
    });

    await repository.findActive();
    expect(prisma.service.findMany).toHaveBeenCalledWith({
      where: { active: true, tenantId: DEFAULT_TENANT },
      orderBy: { createdAt: "desc" },
    });
  });

  it("findByName adds LIKE filters plus tenant constraint", async () => {
    vi.mocked(prisma.service.findMany).mockResolvedValue([]);

    await repository.findByName("deep");

    expect(prisma.service.findMany).toHaveBeenCalledWith({
      where: {
        tenantId: DEFAULT_TENANT,
        name: { contains: "deep", mode: "insensitive" },
      },
      orderBy: { name: "asc" },
    });
  });
});
