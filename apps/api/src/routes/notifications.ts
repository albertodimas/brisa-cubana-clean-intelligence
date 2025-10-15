import { Hono } from "hono";
import { z } from "zod";
import { authenticate, getAuthenticatedUser } from "../middleware/auth.js";
import { getNotificationRepository } from "../container.js";
import { handlePrismaError } from "../lib/prisma-error-handler.js";

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

export default router;
