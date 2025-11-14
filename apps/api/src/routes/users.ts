import { Hono } from "hono";
import { z } from "zod";
import {
  authenticate,
  requireRoles,
  getAuthenticatedUser,
} from "../middleware/auth.js";
import { hashPassword } from "../lib/bcrypt-helpers.js";
import { handlePrismaError } from "../lib/prisma-error-handler.js";
import type { UpdateUserDto } from "../interfaces/user.interface.js";
import { getUserRepository } from "../container.js";
import { parseSearchableQuery } from "../lib/pagination.js";
import { isParseFailure } from "../lib/parse-result.js";

const router = new Hono();

const roleSchema = z.enum(["ADMIN", "COORDINATOR", "STAFF", "CLIENT"], {
  message: "role es requerido",
});

const updateUserSchema = z
  .object({
    role: roleSchema.optional(),
    fullName: z.string().min(3).max(120).optional(),
    password: z.string().min(8).max(64).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debe enviar al menos un campo para actualizar",
  });

const createUserSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(3).max(120),
  password: z.string().min(8).max(64),
  role: roleSchema,
});

const userQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  cursor: z.string().cuid().optional(),
  role: roleSchema.optional(),
  isActive: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
});

router.get("/", authenticate, requireRoles(["ADMIN"]), async (c) => {
  const queryResult = parseSearchableQuery(c, userQuerySchema);
  if (isParseFailure(queryResult)) {
    return queryResult.response;
  }

  const authUser = getAuthenticatedUser(c);
  if (!authUser?.tenantId) {
    return c.json({ error: "Tenant scope requerido" }, 400);
  }

  const { limit, cursor, search, role, isActive } = queryResult.data;

  const repository = getUserRepository();
  const result = await repository.findManyWithSearch(
    {
      limit,
      cursor,
      search,
      role,
      isActive,
    },
    authUser.tenantId,
  );
  return c.json(result);
});

router.post("/", authenticate, requireRoles(["ADMIN"]), async (c) => {
  const parsed = createUserSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const { email, fullName, password, role } = parsed.data;

  try {
    const passwordHash = await hashPassword(password);
    if (!passwordHash) {
      return c.json({ error: "Servicio de hashing no disponible" }, 500);
    }

    const authUser = getAuthenticatedUser(c);
    if (!authUser?.tenantId) {
      return c.json({ error: "Tenant scope requerido" }, 400);
    }

    const repository = getUserRepository();
    const user = await repository.create({
      email,
      fullName,
      role,
      passwordHash,
      isActive: true,
      tenantId: authUser.tenantId,
    });

    return c.json({ data: user }, 201);
  } catch (error) {
    return handlePrismaError(c, error, {
      conflict: "Email ya registrado",
      default: "No se pudo crear el usuario",
    });
  }
});

router.patch("/:userId", authenticate, requireRoles(["ADMIN"]), async (c) => {
  const id = c.req.param("userId");
  const parsed = updateUserSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const { password, ...rest } = parsed.data;
  const data: Record<string, unknown> = { ...rest };

  if (password) {
    const passwordHash = await hashPassword(password);
    if (!passwordHash) {
      return c.json({ error: "Servicio de hashing no disponible" }, 500);
    }
    data.passwordHash = passwordHash;
  }

  const authUser = getAuthenticatedUser(c);
  if (!authUser?.tenantId) {
    return c.json({ error: "Tenant scope requerido" }, 400);
  }

  if (authUser.id === id) {
    if (data.role) {
      return c.json({ error: "No puedes cambiar tu propio rol" }, 400);
    }
    if (data.isActive === false) {
      return c.json({ error: "No puedes desactivar tu propia cuenta" }, 400);
    }
  }

  try {
    const repository = getUserRepository();
    const user = await repository.update(
      id,
      data as unknown as UpdateUserDto,
      authUser.tenantId,
    );

    return c.json({ data: user });
  } catch (error) {
    return handlePrismaError(c, error, {
      notFound: "User not found",
      conflict: "Email ya registrado",
      default: "No se pudo actualizar el usuario",
    });
  }
});

router.delete("/:userId", authenticate, requireRoles(["ADMIN"]), async (c) => {
  const id = c.req.param("userId");
  const authUser = getAuthenticatedUser(c);

  if (authUser?.id === id) {
    return c.json({ error: "No puedes eliminar tu propia cuenta" }, 400);
  }

  try {
    const repository = getUserRepository();
    await repository.delete(id);
    return c.json({ message: "User deleted successfully" });
  } catch (error) {
    return handlePrismaError(c, error, {
      notFound: "User not found",
      default: "No se pudo eliminar el usuario",
    });
  }
});

export default router;
