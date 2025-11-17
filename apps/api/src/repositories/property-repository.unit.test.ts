import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PrismaClient, PropertyType } from "@prisma/client";
import { PropertyRepository } from "./property-repository.js";

const DEFAULT_TENANT = "tenant_brisa_cubana";
const CUSTOM_TENANT = "tenant_property";
const ownerSelect = { id: true, email: true, fullName: true } as const;

describe("PropertyRepository", () => {
  let repository: PropertyRepository;
  let prisma: {
    property: {
      findMany: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    prisma = {
      property: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
    };

    repository = new PropertyRepository(prisma as unknown as PrismaClient);
  });

  it("findMany returns paginated list scoped by tenant", async () => {
    const properties = Array.from({ length: 3 }, (_, index) => ({
      id: `prop_${index}`,
      label: `Property ${index}`,
      addressLine: "123 Main",
      city: "Miami",
      state: "FL",
      zipCode: "33130",
      type: "RESIDENTIAL" as PropertyType,
      ownerId: "owner_1",
      tenantId: DEFAULT_TENANT,
      bedrooms: null,
      bathrooms: null,
      sqft: null,
      notes: null,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      owner: { id: "owner_1", email: "owner@test.com", fullName: "Owner" },
    }));

    vi.mocked(prisma.property.findMany).mockResolvedValue(properties);

    const result = await repository.findMany({ limit: 2 });

    expect(prisma.property.findMany).toHaveBeenCalledWith({
      where: { tenantId: DEFAULT_TENANT },
      take: 3,
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      include: { owner: { select: ownerSelect } },
    });
    expect(result.data).toHaveLength(2);
    expect(result.pagination.hasMore).toBe(true);
    expect(result.pagination.nextCursor).toBe("prop_1");
    expect(result.data[0]).toHaveProperty("owner");
  });

  it("findById applies tenant filtering", async () => {
    const property = {
      id: "prop_1",
      label: "Prop",
      addressLine: "123",
      city: "Miami",
      state: "FL",
      zipCode: "33130",
      type: "RESIDENTIAL" as PropertyType,
      ownerId: "owner_1",
      tenantId: DEFAULT_TENANT,
      bedrooms: null,
      bathrooms: null,
      sqft: null,
      notes: null,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      owner: { id: "owner_1", email: "owner@test.com", fullName: "Owner" },
    };

    vi.mocked(prisma.property.findFirst).mockResolvedValue(property);

    await repository.findById("prop_1");

    expect(prisma.property.findFirst).toHaveBeenCalledWith({
      where: { id: "prop_1", tenantId: DEFAULT_TENANT },
      include: { owner: { select: ownerSelect } },
    });
  });

  it("create injects tenant id and selects owner", async () => {
    const payload = {
      label: "New Property",
      addressLine: "456 Ave",
      city: "Miami",
      state: "FL",
      zipCode: "33131",
      type: "OFFICE" as PropertyType,
      ownerId: "owner_2",
    };
    const created = { id: "prop_new", tenantId: DEFAULT_TENANT, ...payload };
    vi.mocked(prisma.property.create).mockResolvedValue(created as any);

    await repository.create(payload);

    expect(prisma.property.create).toHaveBeenCalledWith({
      data: { ...payload, tenantId: DEFAULT_TENANT },
      include: { owner: { select: ownerSelect } },
    });
  });

  it("update/delete/restore keep tenant constraint", async () => {
    const updated = {
      id: "prop_1",
      label: "Updated",
      tenantId: DEFAULT_TENANT,
    };
    vi.mocked(prisma.property.update).mockResolvedValue(updated as any);

    await repository.update("prop_1", { label: "Updated" });
    expect(prisma.property.update).toHaveBeenCalledWith({
      where: { id: "prop_1", tenantId: DEFAULT_TENANT },
      data: { label: "Updated" },
      include: { owner: { select: ownerSelect } },
    });

    await repository.delete("prop_1");
    expect(prisma.property.update).toHaveBeenCalledWith({
      where: { id: "prop_1", tenantId: DEFAULT_TENANT },
      data: { deletedAt: expect.any(Date) },
    });

    await repository.restore("prop_1");
    expect(prisma.property.update).toHaveBeenCalledWith({
      where: { id: "prop_1", tenantId: DEFAULT_TENANT },
      data: { deletedAt: null },
      include: { owner: { select: ownerSelect } },
    });
  });

  it("findManyWithSearch merges filters and tenantId", async () => {
    vi.mocked(prisma.property.findMany).mockResolvedValue([]);

    await repository.findManyWithSearch(
      {
        search: "Miami",
        city: "Miami",
        type: "RESIDENTIAL",
        ownerId: "owner_1",
        limit: 10,
        cursor: "prop_1",
      },
      CUSTOM_TENANT,
    );

    expect(prisma.property.findMany).toHaveBeenCalledWith({
      where: {
        city: "Miami",
        type: "RESIDENTIAL",
        ownerId: "owner_1",
        OR: [
          { label: { contains: "Miami", mode: "insensitive" } },
          { city: { contains: "Miami", mode: "insensitive" } },
          { addressLine: { contains: "Miami", mode: "insensitive" } },
        ],
        tenantId: CUSTOM_TENANT,
      },
      take: 11,
      skip: 1,
      cursor: { id: "prop_1" },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      include: { owner: { select: ownerSelect } },
    });
  });
});
