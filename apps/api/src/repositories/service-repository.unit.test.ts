import { describe, expect, it, vi, beforeEach } from "vitest";
import { ServiceRepository } from "./service-repository.js";
import type { Prisma, PrismaClient } from "@prisma/client";

describe("ServiceRepository (Unit)", () => {
  let repository: ServiceRepository;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      service: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
      },
    };

    repository = new ServiceRepository(mockPrisma as PrismaClient);
  });

  describe("findById", () => {
    it("returns a service when found", async () => {
      const mockService = {
        id: "service_1",
        name: "Test Service",
        basePrice: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.service.findUnique.mockResolvedValue(mockService);

      const result = await repository.findById("service_1");

      expect(result).toEqual(mockService);
      expect(mockPrisma.service.findUnique).toHaveBeenCalledWith({
        where: { id: "service_1" },
      });
    });

    it("returns null when service not found", async () => {
      mockPrisma.service.findUnique.mockResolvedValue(null);

      const result = await repository.findById("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("findMany", () => {
    it("returns services with default ordering", async () => {
      const mockServices = [
        { id: "1", name: "Service A" },
        { id: "2", name: "Service B" },
      ];

      mockPrisma.service.findMany.mockResolvedValue(mockServices);

      const result = await repository.findMany();

      expect(result).toEqual(mockServices);
      expect(mockPrisma.service.findMany).toHaveBeenCalledWith({
        where: undefined,
        take: undefined,
        skip: undefined,
        cursor: undefined,
        orderBy: { createdAt: "desc" },
      });
    });

    it("applies pagination options", async () => {
      mockPrisma.service.findMany.mockResolvedValue([]);

      await repository.findMany({
        take: 10,
        skip: 5,
        cursor: { id: "cursor_id" },
      });

      expect(mockPrisma.service.findMany).toHaveBeenCalledWith({
        where: undefined,
        take: 10,
        skip: 5,
        cursor: { id: "cursor_id" },
        orderBy: { createdAt: "desc" },
      });
    });
  });

  describe("findManyPaginated", () => {
    it("returns paginated result with hasMore=true when more items exist", async () => {
      const mockServices = Array.from({ length: 11 }, (_, i) => ({
        id: `service_${i}`,
        name: `Service ${i}`,
      }));

      mockPrisma.service.findMany.mockResolvedValue(mockServices);

      const result = await repository.findManyPaginated(10);

      expect(result.data).toHaveLength(10);
      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).toBe("service_9");
    });

    it("returns paginated result with hasMore=false when no more items", async () => {
      const mockServices = Array.from({ length: 5 }, (_, i) => ({
        id: `service_${i}`,
        name: `Service ${i}`,
      }));

      mockPrisma.service.findMany.mockResolvedValue(mockServices);

      const result = await repository.findManyPaginated(10);

      expect(result.data).toHaveLength(5);
      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBeUndefined();
    });

    it("applies cursor for pagination", async () => {
      mockPrisma.service.findMany.mockResolvedValue([]);

      await repository.findManyPaginated(10, "cursor_123");

      expect(mockPrisma.service.findMany).toHaveBeenCalledWith({
        where: undefined,
        take: 11,
        skip: 1,
        cursor: { id: "cursor_123" },
        orderBy: { createdAt: "desc" },
      });
    });

    it("honors custom orderBy option", async () => {
      mockPrisma.service.findMany.mockResolvedValue([]);

      const orderBy: Prisma.ServiceOrderByWithRelationInput[] = [
        { name: "asc" },
        { id: "asc" },
      ];
      await repository.findManyPaginated(5, undefined, { orderBy });

      expect(mockPrisma.service.findMany).toHaveBeenCalledWith({
        where: undefined,
        take: 6,
        orderBy,
      });
    });
  });

  describe("create", () => {
    it("creates a new service", async () => {
      const input = {
        name: "New Service",
        description: "Description",
        basePrice: 150,
        durationMin: 60,
      };

      const mockCreated = {
        id: "new_id",
        ...input,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.service.create.mockResolvedValue(mockCreated);

      const result = await repository.create(input);

      expect(result).toEqual(mockCreated);
      expect(mockPrisma.service.create).toHaveBeenCalledWith({
        data: input,
      });
    });
  });

  describe("update", () => {
    it("updates an existing service", async () => {
      const updates = { basePrice: 200 };
      const mockUpdated = {
        id: "service_1",
        name: "Service",
        basePrice: 200,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.service.update.mockResolvedValue(mockUpdated);

      const result = await repository.update("service_1", updates);

      expect(result).toEqual(mockUpdated);
      expect(mockPrisma.service.update).toHaveBeenCalledWith({
        where: { id: "service_1" },
        data: updates,
      });
    });
  });

  describe("delete", () => {
    it("marks a service as deleted", async () => {
      mockPrisma.service.update.mockResolvedValue({
        id: "service_1",
        deletedAt: new Date(),
      });

      await repository.delete("service_1");

      expect(mockPrisma.service.update).toHaveBeenCalledWith({
        where: { id: "service_1" },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });

  describe("restore", () => {
    it("restores a soft deleted service", async () => {
      const restored = {
        id: "service_1",
        name: "Service",
        basePrice: 200,
        durationMin: 60,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrisma.service.update.mockResolvedValue(restored);

      const result = await repository.restore("service_1");

      expect(mockPrisma.service.update).toHaveBeenCalledWith({
        where: { id: "service_1" },
        data: { deletedAt: null },
      });
      expect(result).toEqual(restored);
    });
  });

  describe("count", () => {
    it("returns total count", async () => {
      mockPrisma.service.count.mockResolvedValue(42);

      const result = await repository.count();

      expect(result).toBe(42);
      expect(mockPrisma.service.count).toHaveBeenCalledWith({
        where: undefined,
      });
    });

    it("applies where clause", async () => {
      mockPrisma.service.count.mockResolvedValue(5);

      const result = await repository.count({ category: "limpieza" });

      expect(result).toBe(5);
      expect(mockPrisma.service.count).toHaveBeenCalledWith({
        where: { category: "limpieza" },
      });
    });
  });

  describe("findActive", () => {
    it("finds only active services", async () => {
      const mockServices = [
        { id: "1", name: "Service A", active: true },
        { id: "2", name: "Service B", active: true },
      ];

      mockPrisma.service.findMany.mockResolvedValue(mockServices);

      const result = await repository.findActive();

      expect(result).toEqual(mockServices);
      expect(mockPrisma.service.findMany).toHaveBeenCalledWith({
        where: { active: true },
        orderBy: { createdAt: "desc" },
      });
    });
  });

  describe("findByName", () => {
    it("finds services by name", async () => {
      const mockServices = [
        { id: "1", name: "Limpieza profunda" },
        { id: "2", name: "Limpieza express" },
      ];

      mockPrisma.service.findMany.mockResolvedValue(mockServices);

      const result = await repository.findByName("limpieza");

      expect(result).toEqual(mockServices);
      expect(mockPrisma.service.findMany).toHaveBeenCalledWith({
        where: {
          name: {
            contains: "limpieza",
            mode: "insensitive",
          },
        },
        orderBy: { name: "asc" },
      });
    });
  });
});
