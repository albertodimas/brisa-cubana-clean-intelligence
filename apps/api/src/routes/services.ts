import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authenticate, requireRoles } from "../middleware/auth.js";
import {
  parsePaginationQuery,
  buildPaginatedResponse,
} from "../lib/pagination.js";
import { validateRequest } from "../lib/validation.js";

const serviceSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  basePrice: z.coerce.number().positive(),
  durationMin: z.coerce.number().int().positive(),
  active: z.boolean().default(true),
});

const router = new Hono();

router.get("/", async (c) => {
  const paginationResult = parsePaginationQuery(c);
  if (!paginationResult.success) {
    return paginationResult.response;
  }

  const { limit, cursor } = paginationResult.data;

  // Fetch limit + 1 to determine if there are more results
  const services = await prisma.service.findMany({
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: [{ name: "asc" }, { id: "asc" }],
  });

  return c.json(buildPaginatedResponse(services, limit, cursor));
});

router.post(
  "/",
  authenticate,
  requireRoles(["ADMIN", "COORDINATOR"]),
  async (c) => {
    const validation = validateRequest(serviceSchema, await c.req.json(), c);
    if (!validation.success) {
      return validation.response;
    }

    const service = await prisma.service.create({ data: validation.data });
    return c.json({ data: service }, 201);
  },
);

router.patch(
  "/:id",
  authenticate,
  requireRoles(["ADMIN", "COORDINATOR"]),
  async (c) => {
    const id = c.req.param("id");
    const validation = validateRequest(
      serviceSchema.partial(),
      await c.req.json(),
      c,
    );
    if (!validation.success) {
      return validation.response;
    }

    const service = await prisma.service.update({
      where: { id },
      data: validation.data,
    });
    return c.json({ data: service });
  },
);

export default router;
