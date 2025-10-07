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

const router = new Hono();

router.get("/", async (c) => {
  const properties = await prisma.property.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      owner: { select: { id: true, email: true, fullName: true } },
    },
  });
  return c.json({ data: properties });
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
