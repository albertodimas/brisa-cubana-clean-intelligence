import { Hono } from "hono";
import { z } from "zod";
import { authenticate, requireRoles } from "../middleware/auth.js";
import { parseSearchableQuery } from "../lib/pagination.js";
import { validateRequest } from "../lib/validation.js";
import { handlePrismaError } from "../lib/prisma-error-handler.js";
import { getPropertyRepository } from "../container.js";

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

const propertyQuerySchema = z.object({
  city: z
    .string()
    .optional()
    .transform((value) => {
      if (!value) return undefined;
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }),
  type: z.enum(["RESIDENTIAL", "VACATION_RENTAL", "OFFICE"]).optional(),
});

const router = new Hono();

router.get("/", async (c) => {
  const queryResult = parseSearchableQuery(c, propertyQuerySchema);
  if (!queryResult.success) {
    return queryResult.response;
  }

  const repository = getPropertyRepository();
  const result = await repository.findManyWithSearch(queryResult.data);
  return c.json(result);
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

    try {
      const repository = getPropertyRepository();
      const property = await repository.create(validation.data);
      return c.json({ data: property }, 201);
    } catch (error) {
      return handlePrismaError(c, error, {
        conflict: "Ya existe una propiedad con esa etiqueta",
        foreignKey: "El propietario indicado no existe",
        default: "No se pudo crear la propiedad",
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
      propertySchema.partial(),
      await c.req.json(),
      c,
    );
    if (!validation.success) {
      return validation.response;
    }

    try {
      const repository = getPropertyRepository();
      const property = await repository.update(id, validation.data);
      return c.json({ data: property });
    } catch (error) {
      return handlePrismaError(c, error, {
        notFound: "Propiedad no encontrada",
        conflict: "Ya existe una propiedad con esa etiqueta",
        foreignKey: "El propietario indicado no existe",
        default: "No se pudo actualizar la propiedad",
      });
    }
  },
);

router.delete("/:id", authenticate, requireRoles(["ADMIN"]), async (c) => {
  const id = c.req.param("id");

  try {
    const repository = getPropertyRepository();
    await repository.delete(id);
    return c.json({ message: "Property deleted successfully" });
  } catch (error) {
    return handlePrismaError(c, error, {
      notFound: "Propiedad no encontrada",
      default: "No se pudo eliminar la propiedad",
    });
  }
});

export default router;
