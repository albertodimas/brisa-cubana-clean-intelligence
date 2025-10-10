import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authenticate, requireRoles } from "../middleware/auth.js";

const propertySchema = z.object({
  label: z.string().min(3),
  addressLine: z.string().min(5),
  city: z.string().min(2),
  state: z.string().min(2).max(2),
  zipCode: z.string().min(4),
  type: z.enum(["RESIDENTIAL", "VACATION_RENTAL", "OFFICE"]),
  ownerId: z.string().cuid(),
  bedrooms: z.coerce.number().int().min(0).optional(),
  bathrooms: z.coerce.number().int().min(0).optional(),
  sqft: z.coerce.number().int().min(0).optional(),
  notes: z.string().optional(),
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
  const properties = await prisma.property.findMany({
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    include: {
      owner: { select: { id: true, email: true, fullName: true } },
    },
  });

  const hasMore = properties.length > limit;
  const data = hasMore ? properties.slice(0, limit) : properties;
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
    const parsed = propertySchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json({ error: parsed.error.flatten() }, 400);
    }

    const property = await prisma.property.create({ data: parsed.data });
    return c.json({ data: property }, 201);
  },
);

router.patch(
  "/:id",
  authenticate,
  requireRoles(["ADMIN", "COORDINATOR"]),
  async (c) => {
    const id = c.req.param("id");
    const parsed = propertySchema.partial().safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json({ error: parsed.error.flatten() }, 400);
    }

    try {
      const property = await prisma.property.update({
        where: { id },
        data: parsed.data,
      });
      return c.json({ data: property });
    } catch {
      return c.json({ error: "Property not found" }, 404);
    }
  },
);

export default router;
