import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authenticate, requireRoles } from "../middleware/auth.js";

const serviceSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  basePrice: z.coerce.number().positive(),
  durationMin: z.coerce.number().int().positive(),
  active: z.boolean().default(true),
});

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  cursor: z.string().cuid().optional(),
});

const router = new Hono();

router.get("/", async (c) => {
  const url = new URL(c.req.url, "http://localhost");
  const parsed = querySchema.safeParse(
    Object.fromEntries(url.searchParams.entries()),
  );
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const { limit, cursor } = parsed.data;

  // Fetch limit + 1 to determine if there are more results
  const services = await prisma.service.findMany({
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: [{ name: "asc" }, { id: "asc" }],
  });

  const hasMore = services.length > limit;
  const data = hasMore ? services.slice(0, limit) : services;
  const nextCursor = hasMore ? data[data.length - 1]?.id : null;

  return c.json({
    data,
    pagination: {
      limit,
      cursor: cursor ?? null,
      nextCursor,
      hasMore,
    },
  });
});

router.post(
  "/",
  authenticate,
  requireRoles(["ADMIN", "COORDINATOR"]),
  async (c) => {
    const parsed = serviceSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json({ error: parsed.error.flatten() }, 400);
    }

    const service = await prisma.service.create({ data: parsed.data });
    return c.json({ data: service }, 201);
  },
);

router.patch(
  "/:id",
  authenticate,
  requireRoles(["ADMIN", "COORDINATOR"]),
  async (c) => {
    const id = c.req.param("id");
    const parsed = serviceSchema.partial().safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json({ error: parsed.error.flatten() }, 400);
    }

    const service = await prisma.service.update({
      where: { id },
      data: parsed.data,
    });
    return c.json({ data: service });
  },
);

export default router;
