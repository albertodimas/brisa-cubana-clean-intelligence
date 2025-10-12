import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authenticate, requireRoles } from "../middleware/auth.js";
import {
  parsePaginationQuery,
  buildPaginatedResponse,
} from "../lib/pagination.js";
import { validateRequest } from "../lib/validation.js";

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
  const paginationResult = parsePaginationQuery(c);
  if (!paginationResult.success) {
    return paginationResult.response;
  }

  const { limit, cursor } = paginationResult.data;

  // Fetch limit + 1 to determine if there are more results
  const properties = await prisma.property.findMany({
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    include: {
      owner: { select: { id: true, email: true, fullName: true } },
    },
  });

  return c.json(buildPaginatedResponse(properties, limit, cursor));
});

router.post(
  "/",
  authenticate,
  requireRoles(["ADMIN", "COORDINATOR"]),
  async (c) => {
    const validation = validateRequest(propertySchema, await c.req.json(), c);
    if (!validation.success) {
      return validation.response;
    }

    const property = await prisma.property.create({ data: validation.data });
    return c.json({ data: property }, 201);
  },
);

router.patch(
  "/:id",
  authenticate,
  requireRoles(["ADMIN", "COORDINATOR"]),
  async (c) => {
    const id = c.req.param("id");
    const validation = validateRequest(
      propertySchema.partial(),
      await c.req.json(),
      c,
    );
    if (!validation.success) {
      return validation.response;
    }

    try {
      const property = await prisma.property.update({
        where: { id },
        data: validation.data,
      });
      return c.json({ data: property });
    } catch {
      return c.json({ error: "Property not found" }, 404);
    }
  },
);

export default router;
