import { Hono } from "hono";
import { z } from "zod";
import { authenticate, requireRoles } from "../middleware/auth.js";
import { parsePaginationQuery } from "../lib/pagination.js";
import { validateRequest } from "../lib/validation.js";
import { serializeService } from "../lib/serializers.js";
import { handlePrismaError } from "../lib/prisma-error-handler.js";
import { getServiceRepository } from "../container.js";

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

  const repository = getServiceRepository();
  const result = await repository.findManyPaginated(limit, cursor, {
    orderBy: [{ name: "asc" }, { id: "asc" }],
  });

  const normalized = result.data.map(serializeService);

  return c.json({
    data: normalized,
    pagination: {
      limit,
      cursor: cursor ?? null,
      nextCursor: result.nextCursor ?? null,
      hasMore: result.hasMore,
    },
  });
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

    try {
      const repository = getServiceRepository();
      const service = await repository.create(validation.data);
      return c.json({ data: serializeService(service) }, 201);
    } catch (error) {
      return handlePrismaError(c, error, {
        conflict: "El nombre del servicio ya está registrado",
        default: "No se pudo crear el servicio",
      });
    }
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

    try {
      const repository = getServiceRepository();
      const service = await repository.update(id, validation.data);
      return c.json({ data: serializeService(service) });
    } catch (error) {
      return handlePrismaError(c, error, {
        notFound: "Servicio no encontrado",
        conflict: "El nombre del servicio ya está registrado",
        default: "No se pudo actualizar el servicio",
      });
    }
  },
);

router.delete("/:id", authenticate, requireRoles(["ADMIN"]), async (c) => {
  const id = c.req.param("id");

  try {
    const repository = getServiceRepository();
    await repository.delete(id);
    return c.json({ message: "Service deleted successfully" });
  } catch (error) {
    return handlePrismaError(c, error, {
      notFound: "Servicio no encontrado",
      default: "No se pudo eliminar el servicio",
    });
  }
});

export default router;
