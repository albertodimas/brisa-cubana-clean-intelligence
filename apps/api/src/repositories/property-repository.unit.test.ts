import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PrismaClient, PropertyType } from "@prisma/client";
import { PropertyRepository } from "./property-repository.js";

describe("PropertyRepository", () => {
  let repository: PropertyRepository;
  let prisma: Pick<PrismaClient, "property">;

  beforeEach(() => {
    prisma = {
      property: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    } as unknown as Pick<PrismaClient, "property">;

    repository = new PropertyRepository(prisma as PrismaClient);
  });

  it("findMany returns paginated result", async () => {
    const propertyList = Array.from({ length: 3 }, (_, index) => ({
      id: `prop_${index}`,
      label: `Property ${index}`,
      addressLine: "123 St",
      city: "Miami",
      state: "FL",
      zipCode: "33130",
      type: "RESIDENTIAL" as PropertyType,
      ownerId: "owner_1",
      tenantId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      bedrooms: null,
      bathrooms: null,
      sqft: null,
      notes: null,
      deletedAt: null,
      owner: { id: "owner_1", email: "owner@test.com", fullName: "Owner" },
    }));

    vi.mocked(prisma.property.findMany).mockResolvedValue(propertyList);

    const result = await repository.findMany({ limit: 2 });

    expect(prisma.property.findMany).toHaveBeenCalledWith({
      take: 3,
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      include: { owner: { select: { id: true, email: true, fullName: true } } },
    });
    expect(result.data).toHaveLength(2);
    expect(result.pagination.hasMore).toBe(true);
    expect(result.pagination.nextCursor).toBe("prop_1");
  });

  it("creates a property", async () => {
    const payload = {
      label: "New Property",
      addressLine: "456 Ave",
      city: "Miami",
      state: "FL",
      zipCode: "33131",
      type: "OFFICE" as PropertyType,
      ownerId: "owner_2",
    };

    const created = {
      ...payload,
      id: "prop_new",
      tenantId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      bedrooms: null,
      bathrooms: null,
      sqft: null,
      notes: null,
      deletedAt: null,
    };

    vi.mocked(prisma.property.create).mockResolvedValue(created);

    const result = await repository.create(payload);

    expect(prisma.property.create).toHaveBeenCalledWith({
      data: payload,
      include: { owner: { select: { id: true, email: true, fullName: true } } },
    });
    expect(result).toEqual({ ...created, owner: undefined });
  });

  it("updates a property", async () => {
    const updated = {
      id: "prop_1",
      label: "Updated",
      addressLine: "123 St",
      city: "Miami",
      state: "FL",
      zipCode: "33130",
      type: "RESIDENTIAL" as PropertyType,
      ownerId: "owner_1",
      tenantId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      bedrooms: null,
      bathrooms: null,
      sqft: null,
      notes: null,
      deletedAt: null,
    };

    vi.mocked(prisma.property.update).mockResolvedValue(updated);

    const result = await repository.update("prop_1", { label: "Updated" });

    expect(prisma.property.update).toHaveBeenCalledWith({
      where: { id: "prop_1" },
      data: { label: "Updated" },
      include: { owner: { select: { id: true, email: true, fullName: true } } },
    });
    expect(result).toEqual({ ...updated, owner: undefined });
  });

  it("deletes a property", async () => {
    vi.mocked(prisma.property.update).mockResolvedValue({} as any);

    await repository.delete("prop_1");

    expect(prisma.property.update).toHaveBeenCalledWith({
      where: { id: "prop_1" },
      data: { deletedAt: expect.any(Date) },
    });
  });

  it("restores a property", async () => {
    const restored = {
      id: "prop_1",
      label: "Prop",
      addressLine: "123",
      city: "Miami",
      state: "FL",
      zipCode: "33130",
      type: "RESIDENTIAL" as PropertyType,
      ownerId: "owner_1",
      tenantId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      bedrooms: null,
      bathrooms: null,
      sqft: null,
      notes: null,
      deletedAt: null,
      owner: { id: "owner_1", email: "owner@test.com", fullName: "Owner" },
    };

    vi.mocked(prisma.property.update).mockResolvedValue(restored);

    const result = await repository.restore("prop_1");

    expect(prisma.property.update).toHaveBeenCalledWith({
      where: { id: "prop_1" },
      data: { deletedAt: null },
      include: { owner: { select: { id: true, email: true, fullName: true } } },
    });
    expect(result).toEqual({
      ...restored,
      owner: {
        id: "owner_1",
        email: "owner@test.com",
        fullName: "Owner",
      },
    });
  });
});
