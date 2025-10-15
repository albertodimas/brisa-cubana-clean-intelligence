import type { NotificationType } from "@prisma/client";

export type NotificationResponse = {
  id: string;
  type: NotificationType;
  message: string;
  readAt: Date | null;
  createdAt: Date;
};

export type NotificationPagination = {
  limit: number;
  cursor: string | null;
  nextCursor: string | null;
  hasMore: boolean;
};

export type NotificationSearchParams = {
  userId: string;
  limit?: number;
  cursor?: string;
  unreadOnly?: boolean;
};

export interface INotificationRepository {
  findManyForUser(
    params: NotificationSearchParams,
  ): Promise<{
    data: NotificationResponse[];
    pagination: NotificationPagination;
  }>;
  markAsRead(
    notificationId: string,
    userId: string,
  ): Promise<NotificationResponse>;
  markAllAsRead(userId: string): Promise<number>;
  createNotification(input: {
    userId: string;
    type: NotificationType;
    message: string;
  }): Promise<NotificationResponse>;
}
