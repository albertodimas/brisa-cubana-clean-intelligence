import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, requireRoles } from "../middleware/auth";

const serviceSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  basePrice: z.coerce.number().positive(),
  durationMin: z.coerce.number().int().positive(),
  active: z.boolean().default(true),
});

const router = new Hono();

router.get("/", async (c) => {
  const services = await prisma.service.findMany({
    orderBy: { name: "asc" },
  });
  return c.json({ data: services });
});

router.post("/", authenticate, requireRoles(["ADMIN", "COORDINATOR"]), async (c) => {
  const parsed = serviceSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const service = await prisma.service.create({ data: parsed.data });
  return c.json({ data: service }, 201);
});

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
