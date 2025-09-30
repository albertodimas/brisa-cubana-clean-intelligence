/**
 * Integration tests for database operations
 * Tests actual Prisma queries against real database
 */
import { describe, expect, it, beforeAll, afterAll, beforeEach } from "vitest";
import { PrismaClient } from "../../generated/prisma";
import {
  setupTestDatabase,
  teardownTestDatabase,
  clearDatabase,
} from "../setup";
import bcrypt from "bcryptjs";

let prisma: PrismaClient;

describe("Database Integration Tests", () => {
  beforeAll(async () => {
    const setup = await setupTestDatabase();
    prisma = setup.prisma;
  }, 60000);

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearDatabase(prisma);
  });

  describe("User operations", () => {
    it("should create and retrieve a user", async () => {
      const hashedPassword = await bcrypt.hash("password123", 10);

      const user = await prisma.user.create({
        data: {
          email: "test@example.com",
          name: "Test User",
          role: "CLIENT",
          passwordHash: hashedPassword,
        },
      });

      expect(user).toBeDefined();
      expect(user.email).toBe("test@example.com");
      expect(user.role).toBe("CLIENT");

      const retrieved = await prisma.user.findUnique({
        where: { id: user.id },
      });

      expect(retrieved).not.toBeNull();
      expect(retrieved?.email).toBe("test@example.com");
    });

    it("should enforce unique email constraint", async () => {
      const hashedPassword = await bcrypt.hash("password123", 10);

      await prisma.user.create({
        data: {
          email: "unique@example.com",
          name: "User 1",
          role: "CLIENT",
          passwordHash: hashedPassword,
        },
      });

      await expect(
        prisma.user.create({
          data: {
            email: "unique@example.com",
            name: "User 2",
            role: "CLIENT",
            passwordHash: hashedPassword,
          },
        }),
      ).rejects.toThrow();
    });

    it("should hash and verify passwords correctly", async () => {
      const password = "SecurePass123!";
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          email: "password@example.com",
          name: "Password User",
          role: "CLIENT",
          passwordHash: hashedPassword,
        },
      });

      const retrieved = await prisma.user.findUnique({
        where: { id: user.id },
      });

      expect(retrieved).not.toBeNull();
      const isValid = await bcrypt.compare(password, retrieved!.passwordHash);
      expect(isValid).toBe(true);

      const isInvalid = await bcrypt.compare(
        "WrongPassword",
        retrieved!.passwordHash,
      );
      expect(isInvalid).toBe(false);
    });
  });

  describe("Booking operations", () => {
    let userId: string;
    let propertyId: string;
    let serviceId: string;

    beforeEach(async () => {
      // Create test data
      const user = await prisma.user.create({
        data: {
          email: "booking@example.com",
          name: "Booking User",
          role: "CLIENT",
          passwordHash: await bcrypt.hash("password", 10),
        },
      });
      userId = user.id;

      const property = await prisma.property.create({
        data: {
          name: "Test Property",
          address: "123 Test St",
          city: "Miami",
          state: "FL",
          zipCode: "33139",
          type: "VACATION_RENTAL",
          size: 1000,
          userId,
        },
      });
      propertyId = property.id;

      const service = await prisma.service.create({
        data: {
          name: "Test Service",
          description: "Test cleaning service",
          basePrice: 100,
          duration: 120,
          active: true,
        },
      });
      serviceId = service.id;
    });

    it("should create a booking with relations", async () => {
      const booking = await prisma.booking.create({
        data: {
          userId,
          propertyId,
          serviceId,
          scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          totalPrice: 100,
          status: "PENDING",
        },
        include: {
          user: true,
          property: true,
          service: true,
        },
      });

      expect(booking).toBeDefined();
      expect(booking.user.email).toBe("booking@example.com");
      expect(booking.property.name).toBe("Test Property");
      expect(booking.service.name).toBe("Test Service");
      expect(booking.status).toBe("PENDING");
    });

    it("should enforce foreign key constraints", async () => {
      await expect(
        prisma.booking.create({
          data: {
            userId: "invalid-user-id",
            propertyId,
            serviceId,
            scheduledAt: new Date(),
            totalPrice: 100,
            status: "PENDING",
          },
        }),
      ).rejects.toThrow();
    });

    it("should cascade delete bookings when user is deleted", async () => {
      const booking = await prisma.booking.create({
        data: {
          userId,
          propertyId,
          serviceId,
          scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          totalPrice: 100,
          status: "PENDING",
        },
      });

      await prisma.user.delete({ where: { id: userId } });

      const deletedBooking = await prisma.booking.findUnique({
        where: { id: booking.id },
      });

      expect(deletedBooking).toBeNull();
    });

    it("should prevent deletion of service with existing bookings", async () => {
      await prisma.booking.create({
        data: {
          userId,
          propertyId,
          serviceId,
          scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          totalPrice: 100,
          status: "PENDING",
        },
      });

      await expect(
        prisma.service.delete({ where: { id: serviceId } }),
      ).rejects.toThrow();
    });
  });

  describe("Complex queries", () => {
    it("should filter bookings by status", async () => {
      // Create user, property, service
      const user = await prisma.user.create({
        data: {
          email: "query@example.com",
          name: "Query User",
          role: "CLIENT",
          passwordHash: await bcrypt.hash("password", 10),
        },
      });

      const property = await prisma.property.create({
        data: {
          name: "Query Property",
          address: "456 Query Ave",
          city: "Miami",
          state: "FL",
          zipCode: "33139",
          type: "RESIDENTIAL",
          size: 1200,
          userId: user.id,
        },
      });

      const service = await prisma.service.create({
        data: {
          name: "Query Service",
          description: "Test service",
          basePrice: 150,
          duration: 180,
          active: true,
        },
      });

      // Create bookings with different statuses
      await prisma.booking.createMany({
        data: [
          {
            userId: user.id,
            propertyId: property.id,
            serviceId: service.id,
            scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            totalPrice: 150,
            status: "PENDING",
          },
          {
            userId: user.id,
            propertyId: property.id,
            serviceId: service.id,
            scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
            totalPrice: 150,
            status: "CONFIRMED",
          },
          {
            userId: user.id,
            propertyId: property.id,
            serviceId: service.id,
            scheduledAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
            totalPrice: 150,
            status: "COMPLETED",
          },
        ],
      });

      const confirmedBookings = await prisma.booking.findMany({
        where: { status: "CONFIRMED" },
      });

      expect(confirmedBookings).toHaveLength(1);
      expect(confirmedBookings[0].status).toBe("CONFIRMED");
    });

    it("should support pagination", async () => {
      // Create user, property, service
      const user = await prisma.user.create({
        data: {
          email: "pagination@example.com",
          name: "Pagination User",
          role: "CLIENT",
          passwordHash: await bcrypt.hash("password", 10),
        },
      });

      const property = await prisma.property.create({
        data: {
          name: "Pagination Property",
          address: "789 Page St",
          city: "Miami",
          state: "FL",
          zipCode: "33139",
          type: "OFFICE",
          size: 2000,
          userId: user.id,
        },
      });

      const service = await prisma.service.create({
        data: {
          name: "Pagination Service",
          description: "Test service",
          basePrice: 200,
          duration: 240,
          active: true,
        },
      });

      // Create 5 bookings
      for (let i = 0; i < 5; i++) {
        await prisma.booking.create({
          data: {
            userId: user.id,
            propertyId: property.id,
            serviceId: service.id,
            scheduledAt: new Date(Date.now() + (24 + i) * 60 * 60 * 1000),
            totalPrice: 200,
            status: "PENDING",
          },
        });
      }

      const page1 = await prisma.booking.findMany({
        skip: 0,
        take: 2,
        orderBy: { scheduledAt: "asc" },
      });

      const page2 = await prisma.booking.findMany({
        skip: 2,
        take: 2,
        orderBy: { scheduledAt: "asc" },
      });

      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(2);
      expect(page1[0].id).not.toBe(page2[0].id);
    });
  });
});
