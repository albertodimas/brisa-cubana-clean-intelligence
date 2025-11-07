import type {
  NotificationChannel,
  NotificationType,
  Notification as PrismaNotification,
} from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";
import { emitNotificationEvent } from "../lib/notification-hub.js";
import type { NotificationResponse } from "../interfaces/notification.interface.js";

function normalizeMetadata(
  metadata: PrismaNotification["metadata"],
): NotificationResponse["metadata"] {
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
    return metadata as Record<string, unknown>;
  }
  return null;
}

function toNotificationResponse(
  notification: PrismaNotification,
): NotificationResponse {
  return {
    ...notification,
    metadata: normalizeMetadata(notification.metadata),
  };
}

export type CreateNotificationPayload = {
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  subject?: string;
  message: string;
  metadata?: Record<string, unknown>;
  bookingId?: string;
};

export type SendNotificationResult =
  | { success: true; notificationId: string }
  | { success: false; error: string };

/**
 * Creates a notification record in the database
 */
export async function createNotification(
  payload: CreateNotificationPayload,
): Promise<string> {
  const isInApp = payload.channel === "IN_APP";

  const notification = await prisma.notification.create({
    data: {
      userId: payload.userId,
      type: payload.type,
      channel: payload.channel,
      subject: payload.subject,
      message: payload.message,
      metadata: payload.metadata,
      bookingId: payload.bookingId,
      status: isInApp ? "SENT" : "PENDING",
      sentAt: isInApp ? new Date() : undefined,
    },
  });

  logger.info(
    {
      notificationId: notification.id,
      userId: payload.userId,
      type: payload.type,
      channel: payload.channel,
    },
    "Notification created",
  );

  // Emit real-time event for in-app notifications
  if (payload.channel === "IN_APP") {
    const response = toNotificationResponse(notification);
    emitNotificationEvent(payload.userId, {
      type: "notification:new",
      notification: response,
    });
  }

  return notification.id;
}

/**
 * Marks a notification as sent
 */
export async function markNotificationAsSent(
  notificationId: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await prisma.notification.update({
    where: { id: notificationId },
    data: {
      status: "SENT",
      sentAt: new Date(),
      metadata: metadata ? { ...metadata } : undefined,
    },
  });

  logger.info(
    {
      notificationId,
    },
    "Notification marked as sent",
  );
}

/**
 * Marks a notification as failed
 */
export async function markNotificationAsFailed(
  notificationId: string,
  error: string,
): Promise<void> {
  await prisma.notification.update({
    where: { id: notificationId },
    data: {
      status: "FAILED",
      failedAt: new Date(),
      errorMessage: error,
    },
  });

  logger.error(
    {
      notificationId,
      error,
    },
    "Notification marked as failed",
  );
}

/**
 * Marks a notification as read
 */
export async function markNotificationAsRead(
  notificationId: string,
): Promise<void> {
  await prisma.notification.update({
    where: { id: notificationId },
    data: {
      readAt: new Date(),
    },
  });

  logger.info(
    {
      notificationId,
    },
    "Notification marked as read",
  );
}

/**
 * Gets unread notifications for a user
 */
export async function getUnreadNotifications(userId: string) {
  return await prisma.notification.findMany({
    where: {
      userId,
      readAt: null,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
  });
}

/**
 * Gets all notifications for a user with pagination
 */
export async function getUserNotifications(
  userId: string,
  options: {
    skip?: number;
    take?: number;
    includeRead?: boolean;
  } = {},
) {
  const { skip = 0, take = 20, includeRead = true } = options;

  return await prisma.notification.findMany({
    where: {
      userId,
      ...(includeRead ? {} : { readAt: null }),
    },
    orderBy: {
      createdAt: "desc",
    },
    skip,
    take,
  });
}

/**
 * Bulk mark notifications as read
 */
export async function markAllNotificationsAsRead(
  userId: string,
): Promise<void> {
  await prisma.notification.updateMany({
    where: {
      userId,
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });

  logger.info(
    {
      userId,
    },
    "All notifications marked as read",
  );

  emitNotificationEvent(userId, {
    type: "notification:bulk",
  });
}
