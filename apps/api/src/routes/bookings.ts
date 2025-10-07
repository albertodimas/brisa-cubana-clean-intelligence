import { Hono } from "hono";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

const createBookingSchema = z.object({
  customerId: z.string().cuid(),
  propertyId: z.string().cuid(),
  serviceId: z.string().cuid(),
  scheduledAt: z.coerce.date(),
  durationMin: z.coerce.number().int().positive().optional(),
  notes: z.string().max(500).optional(),
});

const router = new Hono();

router.get("/", async (c) => {
  const bookings = await prisma.booking.findMany({
    orderBy: { scheduledAt: "asc" },
    include: {
      customer: { select: { id: true, fullName: true, email: true } },
      property: { select: { id: true, label: true, city: true } },
      service: { select: { id: true, name: true, basePrice: true } },
    },
  });
  return c.json({ data: bookings });
});

router.post("/", requireAuth, async (c) => {
  const parsed = createBookingSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const { durationMin, serviceId, customerId, propertyId, ...rest } = parsed.data;
  const [service, customer, property] = await Promise.all([
    prisma.service.findUnique({ where: { id: serviceId } }),
    prisma.user.findUnique({ where: { id: customerId } }),
    prisma.property.findUnique({ where: { id: propertyId } }),
  ]);
  if (!service) {
    return c.json({ error: "Service not found" }, 404);
  }
  if (!customer) {
    return c.json({ error: "Customer not found" }, 404);
  }
  if (!property) {
    return c.json({ error: "Property not found" }, 404);
  }

  const booking = await prisma.booking.create({
    data: {
      ...rest,
      serviceId,
      customerId,
      propertyId,
      durationMin: durationMin ?? service.durationMin,
      totalAmount: service.basePrice,
      code: `BRISA-${randomUUID().slice(0, 8)}`,
    },
    include: {
      customer: { select: { id: true, fullName: true, email: true } },
      property: { select: { id: true, label: true, city: true } },
      service: { select: { id: true, name: true, basePrice: true } },
    },
  });

  return c.json({ data: booking }, 201);
});

export default router;
