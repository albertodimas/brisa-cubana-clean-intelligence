import { Hono } from "hono";
import { z } from "zod";
import { NotificationType } from "@prisma/client";
import { authenticate, getAuthenticatedUser } from "../middleware/auth.js";
import { getNotificationRepository, getPrisma } from "../container.js";

const createNotificationSchema = z.object({
  userId: z.string().uuid().optional(),
  userEmail: z.string().email().optional(),
  message: z.string().min(1).max(240),
  type: z
    .nativeEnum(NotificationType)
    .default(NotificationType.BOOKING_CREATED),
});

const router = new Hono();

router.use("*", authenticate);

router.post("/notifications", async (c) => {
  if (process.env.ENABLE_TEST_UTILS !== "true") {
    return c.json({ error: "Not Found" }, 404);
  }

  const authUser = getAuthenticatedUser(c);
  if (!authUser || authUser.role !== "ADMIN") {
    return c.json({ error: "Forbidden" }, 403);
  }

  const body = await c.req.json().catch(() => undefined);
  const parsed = createNotificationSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const { userId, userEmail, message, type } = parsed.data;
  if (!userId && !userEmail) {
    return c.json(
      {
        error: {
          message: "Debe proporcionar userId o userEmail",
        },
      },
      400,
    );
  }

  const prisma = getPrisma();
  let targetUserId = userId ?? null;

  if (!targetUserId && userEmail) {
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true },
    });
    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }
    targetUserId = user.id;
  }

  if (!targetUserId) {
    return c.json({ error: "User not found" }, 404);
  }

  const repository = getNotificationRepository();
  const notification = await repository.createNotification({
    userId: targetUserId,
    type,
    message,
  });

  return c.json({ data: notification }, 201);
});

export default router;
