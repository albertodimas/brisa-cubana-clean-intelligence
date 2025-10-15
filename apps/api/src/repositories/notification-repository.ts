import type { PrismaClient, NotificationType } from "@prisma/client";
import type {
  NotificationPagination,
  NotificationResponse,
  NotificationSearchParams,
} from "../interfaces/notification.interface.js";
import type { INotificationRepository } from "../interfaces/notification.interface.js";
import { emitNotificationEvent } from "../lib/notification-hub.js";

export class NotificationRepository implements INotificationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findManyForUser({
    userId,
    limit = 25,
    cursor,
    unreadOnly = false,
  }: NotificationSearchParams): Promise<{
    data: NotificationResponse[];
    pagination: NotificationPagination;
  }> {
    const take = Math.min(limit, 100) + 1;
    const notifications = await this.prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly ? { readAt: null } : {}),
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });

    const hasMore = notifications.length > limit;
    const data = hasMore ? notifications.slice(0, limit) : notifications;
    const nextCursor = hasMore ? (data[data.length - 1]?.id ?? null) : null;

    return {
      data,
      pagination: {
        limit,
        cursor: cursor ?? null,
        nextCursor,
        hasMore,
      },
    };
  }

  async markAsRead(
    notificationId: string,
    userId: string,
  ): Promise<NotificationResponse> {
    const updated = await this.prisma.notification.update({
      where: { id: notificationId, userId },
      data: { readAt: new Date() },
    });
    emitNotificationEvent(userId, {
      type: "notification:update",
      notification: updated,
    });
    return updated;
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    if (result.count > 0) {
      emitNotificationEvent(userId, { type: "notification:bulk" });
    }
    return result.count;
  }

  async createNotification(input: {
    userId: string;
    type: NotificationType;
    message: string;
  }): Promise<NotificationResponse> {
    const created = await this.prisma.notification.create({
      data: input,
    });
    emitNotificationEvent(input.userId, {
      type: "notification:new",
      notification: created,
    });
    return created;
  }
}
