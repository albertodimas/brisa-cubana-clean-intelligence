import { EventEmitter } from "node:events";
import type { NotificationResponse } from "../interfaces/notification.interface.js";

type NotificationStreamEvent =
  | { type: "notification:new"; notification: NotificationResponse }
  | { type: "notification:update"; notification: NotificationResponse }
  | { type: "notification:bulk" };

const emitter = new EventEmitter();
emitter.setMaxListeners(0);

function eventKey(userId: string): string {
  return `notification:${userId}`;
}

export function subscribeToNotifications(
  userId: string,
  listener: (event: NotificationStreamEvent) => void,
): () => void {
  const key = eventKey(userId);
  emitter.on(key, listener);
  return () => {
    emitter.off(key, listener);
  };
}

export function emitNotificationEvent(
  userId: string,
  event: NotificationStreamEvent,
): void {
  emitter.emit(eventKey(userId), event);
}

export type { NotificationStreamEvent };
