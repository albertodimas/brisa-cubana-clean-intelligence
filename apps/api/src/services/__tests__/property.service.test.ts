import { describe, it, expect, vi, beforeEach } from "vitest";
import { PropertyService } from "../property.service";
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
} from "../../lib/errors";
import type { Property, PropertyType } from "../../generated/prisma";

// Global mock for db
vi.mock("../../lib/db", () => ({
  db: {
    property: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    booking: {
      count: vi.fn(),
    },
  },
}));

// Global mock for logger
vi.mock("../../lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

const { db } = await import("../../lib/db");

describe("PropertyService", () => {
  let service: PropertyService;

  // Helper function to create mock property
  const mockProperty = (overrides?: Partial<Property>): Property => ({
    id: "property-1",
    name: "Beautiful House",
    address: "123 Main St",
    city: "Miami",
    state: "FL",
    zipCode: "33101",
    type: "RESIDENTIAL" as PropertyType,
    size: 2000,
    bedrooms: 3,
    bathrooms: 2,
    notes: null,
    userId: "user-1",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  });

  beforeEach(() => {
    service = new PropertyService();
    vi.clearAllMocks();
  });

  describe("getById", () => {
    it("should return property when found", async () => {
      const property = mockProperty();
      vi.mocked(db.property.findUnique).mockResolvedValueOnce(property);

      const result = await service.getById("property-1");

      expect(result).toEqual(property);
      expect(db.property.findUnique).toHaveBeenCalledWith({
        where: { id: "property-1" },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      });
    });

    it("should throw NotFoundError when property does not exist", async () => {
      vi.mocked(db.property.findUnique).mockResolvedValueOnce(null);

      await expect(service.getById("nonexistent")).rejects.toThrow(
        NotFoundError,
      );
      await expect(service.getById("nonexistent")).rejects.toThrow(
        "Property with ID nonexistent not found",
      );
    });

    it("should verify ownership when userId is provided", async () => {
      const property = mockProperty({ userId: "user-1" });
      vi.mocked(db.property.findUnique).mockResolvedValueOnce(property);

      const result = await service.getById("property-1", "user-1");

      expect(result).toEqual(property);
    });

    it("should throw ForbiddenError when user does not own property", async () => {
      const property = mockProperty({ userId: "user-1" });
      vi.mocked(db.property.findUnique).mockResolvedValue(property);

      await expect(service.getById("property-1", "user-2")).rejects.toThrow(
        ForbiddenError,
      );
      await expect(service.getById("property-1", "user-2")).rejects.toThrow(
        "You do not have access to this property",
      );
    });
  });

  describe("getAll", () => {
    it("should return paginated properties", async () => {
      const properties = [mockProperty(), mockProperty({ id: "property-2" })];
      vi.mocked(db.property.findMany).mockResolvedValueOnce(properties);
      vi.mocked(db.property.count).mockResolvedValueOnce(2);

      const result = await service.getAll(1, 10);

      expect(result.data).toEqual(properties);
      expect(result.meta).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      });
      expect(db.property.findMany).toHaveBeenCalledWith({
        where: undefined,
        skip: 0,
        take: 10,
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      });
    });

    it("should throw ValidationError when page < 1", async () => {
      await expect(service.getAll(0, 10)).rejects.toThrow(ValidationError);
      await expect(service.getAll(0, 10)).rejects.toThrow("Page must be >= 1");
    });

    it("should throw ValidationError when limit < 1", async () => {
      await expect(service.getAll(1, 0)).rejects.toThrow(ValidationError);
      await expect(service.getAll(1, 0)).rejects.toThrow(
        "Limit must be between 1 and 100",
      );
    });

    it("should throw ValidationError when limit > 100", async () => {
      await expect(service.getAll(1, 101)).rejects.toThrow(ValidationError);
      await expect(service.getAll(1, 101)).rejects.toThrow(
        "Limit must be between 1 and 100",
      );
    });

    it("should apply filters correctly", async () => {
      const properties = [mockProperty()];
      vi.mocked(db.property.findMany).mockResolvedValueOnce(properties);
      vi.mocked(db.property.count).mockResolvedValueOnce(1);

      await service.getAll(1, 10, {
        userId: "user-1",
        type: "RESIDENTIAL" as PropertyType,
        city: "Miami",
      });

      expect(db.property.findMany).toHaveBeenCalledWith({
        where: {
          userId: "user-1",
          type: "RESIDENTIAL",
          city: "Miami",
        },
        skip: 0,
        take: 10,
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      });
    });
  });

  describe("getUserProperties", () => {
    it("should return all properties for a user", async () => {
      const properties = [
        mockProperty({ id: "property-1", userId: "user-1" }),
        mockProperty({ id: "property-2", userId: "user-1" }),
      ];
      vi.mocked(db.property.findMany).mockResolvedValueOnce(properties);

      const result = await service.getUserProperties("user-1");

      expect(result).toEqual(properties);
      expect(db.property.findMany).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        orderBy: { createdAt: "desc" },
      });
    });
  });

  describe("create", () => {
    it("should create a property successfully", async () => {
      const newProperty = mockProperty();
      vi.mocked(db.user.findUnique).mockResolvedValueOnce({
        id: "user-1",
      } as any);
      vi.mocked(db.property.create).mockResolvedValueOnce(newProperty);

      const result = await service.create({
        name: "Beautiful House",
        address: "123 Main St",
        city: "Miami",
        state: "FL",
        zipCode: "33101",
        type: "RESIDENTIAL" as PropertyType,
        size: 2000,
        bedrooms: 3,
        bathrooms: 2,
        userId: "user-1",
      });

      expect(result).toEqual(newProperty);
      expect(db.property.create).toHaveBeenCalled();
    });

    it("should throw ValidationError when name is missing", async () => {
      await expect(
        service.create({
          name: "",
          address: "123 Main St",
          zipCode: "33101",
          type: "RESIDENTIAL" as PropertyType,
          userId: "user-1",
        }),
      ).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError when address is missing", async () => {
      await expect(
        service.create({
          name: "House",
          address: "",
          zipCode: "33101",
          type: "RESIDENTIAL" as PropertyType,
          userId: "user-1",
        }),
      ).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError when zipCode is missing", async () => {
      await expect(
        service.create({
          name: "House",
          address: "123 Main St",
          zipCode: "",
          type: "RESIDENTIAL" as PropertyType,
          userId: "user-1",
        }),
      ).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError for invalid zipCode format", async () => {
      await expect(
        service.create({
          name: "House",
          address: "123 Main St",
          zipCode: "invalid",
          type: "RESIDENTIAL" as PropertyType,
          userId: "user-1",
        }),
      ).rejects.toThrow(ValidationError);
      await expect(
        service.create({
          name: "House",
          address: "123 Main St",
          zipCode: "invalid",
          type: "RESIDENTIAL" as PropertyType,
          userId: "user-1",
        }),
      ).rejects.toThrow("Invalid zip code format");
    });

    it("should accept valid zipCode formats", async () => {
      const newProperty = mockProperty();
      vi.mocked(db.user.findUnique).mockResolvedValue({ id: "user-1" } as any);
      vi.mocked(db.property.create).mockResolvedValue(newProperty);

      // Test 5-digit format
      await service.create({
        name: "House",
        address: "123 Main St",
        zipCode: "33101",
        type: "RESIDENTIAL" as PropertyType,
        userId: "user-1",
      });

      // Test 9-digit format (ZIP+4)
      await service.create({
        name: "House",
        address: "123 Main St",
        zipCode: "33101-1234",
        type: "RESIDENTIAL" as PropertyType,
        userId: "user-1",
      });

      expect(db.property.create).toHaveBeenCalledTimes(2);
    });

    it("should throw NotFoundError when user does not exist", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValueOnce(null);

      await expect(
        service.create({
          name: "House",
          address: "123 Main St",
          zipCode: "33101",
          type: "RESIDENTIAL" as PropertyType,
          userId: "nonexistent",
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it("should use default city and state when not provided", async () => {
      const newProperty = mockProperty();
      vi.mocked(db.user.findUnique).mockResolvedValueOnce({
        id: "user-1",
      } as any);
      vi.mocked(db.property.create).mockResolvedValueOnce(newProperty);

      await service.create({
        name: "House",
        address: "123 Main St",
        zipCode: "33101",
        type: "RESIDENTIAL" as PropertyType,
        userId: "user-1",
      });

      expect(db.property.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          city: "Miami",
          state: "FL",
        }),
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      });
    });
  });

  describe("update", () => {
    it("should update a property successfully", async () => {
      const existingProperty = mockProperty({ userId: "user-1" });
      const updatedProperty = mockProperty({
        name: "Updated House",
        userId: "user-1",
      });

      vi.mocked(db.property.findUnique).mockResolvedValueOnce(existingProperty);
      vi.mocked(db.property.update).mockResolvedValueOnce(updatedProperty);

      const result = await service.update(
        "property-1",
        { name: "Updated House" },
        "user-1",
      );

      expect(result).toEqual(updatedProperty);
      expect(db.property.update).toHaveBeenCalledWith({
        where: { id: "property-1" },
        data: { name: "Updated House" },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      });
    });

    it("should throw ForbiddenError when user does not own property", async () => {
      const property = mockProperty({ userId: "user-1" });
      vi.mocked(db.property.findUnique).mockResolvedValueOnce(property);

      await expect(
        service.update("property-1", { name: "Updated" }, "user-2"),
      ).rejects.toThrow(ForbiddenError);
    });

    it("should throw ValidationError for invalid zipCode in update", async () => {
      const property = mockProperty({ userId: "user-1" });
      vi.mocked(db.property.findUnique).mockResolvedValue(property);

      await expect(
        service.update("property-1", { zipCode: "invalid" }, "user-1"),
      ).rejects.toThrow(ValidationError);
      await expect(
        service.update("property-1", { zipCode: "invalid" }, "user-1"),
      ).rejects.toThrow("Invalid zip code format");
    });

    it("should allow partial updates", async () => {
      const property = mockProperty({ userId: "user-1" });
      const updatedProperty = mockProperty({ bedrooms: 4, userId: "user-1" });

      vi.mocked(db.property.findUnique).mockResolvedValueOnce(property);
      vi.mocked(db.property.update).mockResolvedValueOnce(updatedProperty);

      await service.update("property-1", { bedrooms: 4 }, "user-1");

      expect(db.property.update).toHaveBeenCalledWith({
        where: { id: "property-1" },
        data: { bedrooms: 4 },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      });
    });
  });

  describe("delete", () => {
    it("should delete a property successfully when no active bookings", async () => {
      const property = mockProperty({ userId: "user-1" });
      vi.mocked(db.property.findUnique).mockResolvedValueOnce(property);
      vi.mocked(db.booking.count).mockResolvedValueOnce(0);
      vi.mocked(db.property.delete).mockResolvedValueOnce(property);

      await service.delete("property-1", "user-1");

      expect(db.property.delete).toHaveBeenCalledWith({
        where: { id: "property-1" },
      });
    });

    it("should throw ForbiddenError when user does not own property", async () => {
      const property = mockProperty({ userId: "user-1" });
      vi.mocked(db.property.findUnique).mockResolvedValueOnce(property);

      await expect(service.delete("property-1", "user-2")).rejects.toThrow(
        ForbiddenError,
      );
    });

    it("should throw ValidationError when property has active bookings", async () => {
      const property = mockProperty({ userId: "user-1" });
      vi.mocked(db.property.findUnique).mockResolvedValue(property);
      vi.mocked(db.booking.count).mockResolvedValue(3);

      await expect(service.delete("property-1", "user-1")).rejects.toThrow(
        ValidationError,
      );
      await expect(service.delete("property-1", "user-1")).rejects.toThrow(
        "Cannot delete property with 3 active booking(s)",
      );
    });

    it("should check for PENDING, CONFIRMED, and IN_PROGRESS bookings", async () => {
      const property = mockProperty({ userId: "user-1" });
      vi.mocked(db.property.findUnique).mockResolvedValueOnce(property);
      vi.mocked(db.booking.count).mockResolvedValueOnce(1);

      await expect(service.delete("property-1", "user-1")).rejects.toThrow();

      expect(db.booking.count).toHaveBeenCalledWith({
        where: {
          propertyId: "property-1",
          status: { in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] },
        },
      });
    });

    it("should throw NotFoundError when property does not exist", async () => {
      vi.mocked(db.property.findUnique).mockResolvedValueOnce(null);

      await expect(service.delete("nonexistent", "user-1")).rejects.toThrow(
        NotFoundError,
      );
    });
  });
});
