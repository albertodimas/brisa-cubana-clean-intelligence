import { describe, expect, it, vi, beforeEach, type Mock } from "vitest";
import {
  NotificationChannel,
  NotificationType,
  Prisma,
  type Notification as PrismaNotification,
} from "@prisma/client";

import { createNotification } from "./notification-service.js";
import { prisma } from "../lib/prisma.js";
import { emitNotificationEvent } from "../lib/notification-hub.js";
import { logger } from "../lib/logger.js";

vi.mock("../lib/prisma.js", () => {
  return {
    prisma: {
      notification: {
        create: vi.fn(),
      },
    },
  };
});

vi.mock("../lib/logger.js", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../lib/notification-hub.js", () => ({
  emitNotificationEvent: vi.fn(),
}));

const basePayload = {
  userId: "user_123",
  type: "BOOKING_CREATED" as NotificationType,
  channel: "EMAIL" as NotificationChannel,
  message: "Test notification",
  bookingId: "booking_123",
};

const notificationRecord = {
  id: "notif_123",
  userId: basePayload.userId,
  type: basePayload.type,
  channel: basePayload.channel,
  status: "PENDING",
  subject: null,
  message: basePayload.message,
  metadata: null,
  sentAt: null,
  failedAt: null,
  errorMessage: null,
  readAt: null,
  bookingId: null,
  createdAt: new Date(),
} as unknown as PrismaNotification;

describe("createNotification", () => {
  const prismaCreateMock = prisma.notification.create as unknown as Mock;

  beforeEach(() => {
    prismaCreateMock.mockReset();
    vi.clearAllMocks();
  });

  it("reintenta sin bookingId cuando el booking no existe", async () => {
    const fkError = new Prisma.PrismaClientKnownRequestError(
      "Foreign key constraint failed",
      {
        code: "P2003",
        clientVersion: "6.19.0",
        meta: { constraint: "Notification_bookingId_fkey" },
      },
    );

    prismaCreateMock.mockRejectedValueOnce(fkError);
    prismaCreateMock.mockResolvedValueOnce(notificationRecord);

    const result = await createNotification(basePayload);

    expect(result).toBe(notificationRecord.id);
    expect(prismaCreateMock).toHaveBeenCalledTimes(2);
    expect(prismaCreateMock.mock.calls[0][0].data.bookingId).toBe(
      basePayload.bookingId,
    );
    expect(prismaCreateMock.mock.calls[1][0].data.bookingId).toBeUndefined();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ bookingId: basePayload.bookingId }),
      expect.stringContaining("booking reference missing"),
    );
    expect(emitNotificationEvent).not.toHaveBeenCalled();
  });
});
