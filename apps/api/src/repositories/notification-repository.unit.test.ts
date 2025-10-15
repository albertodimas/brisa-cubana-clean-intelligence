import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationRepository } from "./notification-repository.js";
import type { PrismaClient } from "@prisma/client";

describe("NotificationRepository (Unit)", () => {
  let repository: NotificationRepository;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      notification: {
        findMany: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
        create: vi.fn(),
      },
    };

    repository = new NotificationRepository(mockPrisma as PrismaClient);
  });

  describe("findManyForUser", () => {
    it("returns notifications with pagination metadata", async () => {
      const notifications = Array.from({ length: 6 }, (_, index) => ({
        id: `notif_${index}`,
        userId: "user_1",
        type: "BOOKING_CREATED",
        message: "Notification",
        createdAt: new Date(),
        readAt: null,
      }));

      mockPrisma.notification.findMany.mockResolvedValue(notifications);

      const result = await repository.findManyForUser({
        userId: "user_1",
        limit: 5,
      });

      expect(result.data).toHaveLength(5);
      expect(result.pagination.hasMore).toBe(true);
      expect(result.pagination.nextCursor).toBe("notif_4");
      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: "user_1" },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 6,
      });
    });

    it("applies unreadOnly filter and cursor", async () => {
      mockPrisma.notification.findMany.mockResolvedValue([]);

      await repository.findManyForUser({
        userId: "user_1",
        cursor: "cursor_1",
        limit: 10,
        unreadOnly: true,
      });

      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: "user_1", readAt: null },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 11,
        skip: 1,
        cursor: { id: "cursor_1" },
      });
    });
  });

  describe("markAsRead", () => {
    it("updates a notification readAt timestamp", async () => {
      const notification = {
        id: "notif_1",
        userId: "user_1",
        type: "BOOKING_CREATED",
        message: "Hello",
        createdAt: new Date(),
        readAt: new Date(),
      };
      mockPrisma.notification.update.mockResolvedValue(notification);

      const result = await repository.markAsRead("notif_1", "user_1");

      expect(result).toEqual(notification);
      expect(mockPrisma.notification.update).toHaveBeenCalledWith({
        where: { id: "notif_1", userId: "user_1" },
        data: { readAt: expect.any(Date) },
      });
    });
  });

  describe("markAllAsRead", () => {
    it("returns updated count", async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 3 });

      const result = await repository.markAllAsRead("user_1");

      expect(result).toBe(3);
      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: "user_1", readAt: null },
        data: { readAt: expect.any(Date) },
      });
    });
  });

  describe("createNotification", () => {
    it("creates a notification", async () => {
      const created = {
        id: "notif_1",
        userId: "user_1",
        type: "BOOKING_CREATED",
        message: "A new booking is ready",
        createdAt: new Date(),
        readAt: null,
      };

      mockPrisma.notification.create.mockResolvedValue(created);

      const result = await repository.createNotification({
        userId: "user_1",
        type: "BOOKING_CREATED",
        message: "A new booking is ready",
      });

      expect(result).toEqual(created);
      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: "user_1",
          type: "BOOKING_CREATED",
          message: "A new booking is ready",
        },
      });
    });
  });
});
