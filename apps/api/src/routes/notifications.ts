import { Hono } from "hono";
import { z } from "zod";
import { authenticate, getAuthenticatedUser } from "../middleware/auth.js";
import { getNotificationRepository } from "../container.js";
import { handlePrismaError } from "../lib/prisma-error-handler.js";
import type { NotificationResponse } from "../interfaces/notification.interface.js";
import { subscribeToNotifications } from "../lib/notification-hub.js";

const notificationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
  cursor: z.string().optional(),
  unreadOnly: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
});

const router = new Hono();

router.use("*", authenticate);

router.get("/", async (c) => {
  const authUser = getAuthenticatedUser(c);
  if (!authUser) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const parsed = notificationQuerySchema.safeParse(c.req.query());
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const repository = getNotificationRepository();
  const result = await repository.findManyForUser({
    userId: authUser.id,
    limit: parsed.data.limit,
    cursor: parsed.data.cursor,
    unreadOnly: parsed.data.unreadOnly ?? false,
  });

  return c.json(result);
});

router.patch("/:notificationId/read", async (c) => {
  const authUser = getAuthenticatedUser(c);
  if (!authUser) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const notificationId = c.req.param("notificationId");
  try {
    const repository = getNotificationRepository();
    const notification = await repository.markAsRead(
      notificationId,
      authUser.id,
    );
    return c.json({ data: notification });
  } catch (error) {
    return handlePrismaError(c, error, {
      notFound: "Notification not found",
      default: "Unable to update notification",
    });
  }
});

router.patch("/read-all", async (c) => {
  const authUser = getAuthenticatedUser(c);
  if (!authUser) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const repository = getNotificationRepository();
  const updatedCount = await repository.markAllAsRead(authUser.id);
  return c.json({ data: { updatedCount } });
});

const STREAM_HEARTBEAT_INTERVAL_MS = Number.parseInt(
  process.env.NOTIFICATION_STREAM_HEARTBEAT_MS ?? "25000",
  10,
);
const STREAM_LIMIT = Number.parseInt(
  process.env.NOTIFICATION_STREAM_LIMIT ?? "20",
  10,
);

router.get("/stream", async (c) => {
  const authUser = getAuthenticatedUser(c);
  if (!authUser) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const repository = getNotificationRepository();
  const encoder = new TextEncoder();
  const heartbeatInterval = Number.isFinite(STREAM_HEARTBEAT_INTERVAL_MS)
    ? STREAM_HEARTBEAT_INTERVAL_MS
    : 25000;
  const streamLimit = Number.isFinite(STREAM_LIMIT) ? STREAM_LIMIT : 20;

  let lastEventId = Number.parseInt(c.req.header("last-event-id") ?? "0", 10);
  if (!Number.isInteger(lastEventId) || lastEventId < 0) {
    lastEventId = 0;
  }

  const headers = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  } as Record<string, string>;

  const controllerRef = {
    current: null as ReadableStreamDefaultController<Uint8Array> | null,
  };
  let heartbeatTimer: NodeJS.Timeout | null = null;
  let closed = false;
  let snapshot = new Map<
    string,
    { readAt: string | null; createdAt: string }
  >();
  let unsubscribe: (() => void) | null = null;

  const sendEvent = (
    event: string,
    data: Record<string, unknown> | Record<string, unknown>[] | null,
  ) => {
    if (closed || !controllerRef.current) {
      return;
    }
    lastEventId += 1;
    const payloadLines = [
      `id: ${lastEventId}`,
      `event: ${event}`,
      `data: ${JSON.stringify(data)}`,
      "",
    ];
    controllerRef.current.enqueue(
      encoder.encode(`${payloadLines.join("\n")}\n`),
    );
  };

  const buildSnapshot = (notifications: NotificationResponse[]) =>
    new Map(
      notifications.map((notification) => [
        notification.id,
        {
          readAt: notification.readAt
            ? notification.readAt.toISOString()
            : null,
          createdAt: notification.createdAt.toISOString(),
        },
      ]),
    );

  const toSerializable = (notification: NotificationResponse) => ({
    id: notification.id,
    type: notification.type,
    message: notification.message,
    readAt: notification.readAt ? notification.readAt.toISOString() : null,
    createdAt: notification.createdAt.toISOString(),
  });

  const stream = new ReadableStream<Uint8Array>({
    start: async (streamController) => {
      controllerRef.current = streamController;
      streamController.enqueue(
        encoder.encode(`retry: ${heartbeatInterval}\n\n`),
      );

      try {
        const result = await repository.findManyForUser({
          userId: authUser.id,
          limit: streamLimit,
        });
        snapshot = buildSnapshot(result.data);
        sendEvent("init", {
          notifications: result.data.map(toSerializable),
        });
      } catch (error) {
        console.error("[notifications] init stream error", error);
        sendEvent("error", {
          message: "Unable to initialize notification stream",
        });
      }

      heartbeatTimer = setInterval(() => {
        sendEvent("ping", { ts: new Date().toISOString() });
      }, heartbeatInterval);

      unsubscribe = subscribeToNotifications(authUser.id, async (event) => {
        if (closed) {
          return;
        }
        try {
          if (event.type === "notification:bulk") {
            const result = await repository.findManyForUser({
              userId: authUser.id,
              limit: streamLimit,
            });
            sendEvent("notification:sync", {
              notifications: result.data.map(toSerializable),
            });
            snapshot = buildSnapshot(result.data);
            return;
          }
          const serializable = toSerializable(event.notification);
          switch (event.type) {
            case "notification:new":
              snapshot.set(event.notification.id, {
                readAt: serializable.readAt,
                createdAt: serializable.createdAt,
              });
              sendEvent("notification:new", serializable);
              break;
            case "notification:update":
              snapshot.set(event.notification.id, {
                readAt: serializable.readAt,
                createdAt: serializable.createdAt,
              });
              sendEvent("notification:update", {
                id: serializable.id,
                readAt: serializable.readAt,
              });
              break;
            default:
              break;
          }
        } catch (error) {
          console.error("[notifications] stream event error", error);
        }
      });

      const abortSignal = c.req.raw.signal;
      const onAbort = () => {
        if (!closed) {
          closed = true;
          if (heartbeatTimer) clearInterval(heartbeatTimer);
          streamController.close();
          if (unsubscribe) {
            unsubscribe();
            unsubscribe = null;
          }
        }
        abortSignal.removeEventListener("abort", onAbort);
      };
      abortSignal.addEventListener("abort", onAbort);
    },
    cancel: () => {
      closed = true;
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
      }
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
    },
  });

  return new Response(stream, {
    headers,
    status: 200,
  });
});

export default router;
