import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import {
  authenticate,
  requireRoles,
  getAuthenticatedUser,
} from "../middleware/auth.js";
import { hashPassword } from "../lib/bcrypt-helpers.js";
import { handlePrismaError } from "../lib/prisma-error-handler.js";

const router = new Hono();

const roleSchema = z.enum(["ADMIN", "COORDINATOR", "STAFF", "CLIENT"], {
  required_error: "role es requerido",
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

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  cursor: z.string().cuid().optional(),
});

router.get("/", authenticate, requireRoles(["ADMIN"]), async (c) => {
  const url = new URL(c.req.url, "http://localhost");
  const parsed = querySchema.safeParse(
    Object.fromEntries(url.searchParams.entries()),
  );
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const { limit, cursor } = parsed.data;

  const users = await prisma.user.findMany({
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const hasMore = users.length > limit;
  const data = hasMore ? users.slice(0, limit) : users;
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

    const user = await prisma.user.create({
      data: {
        email,
        fullName,
        role,
        isActive: true,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
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
  if (authUser?.id === id) {
    if (data.role) {
      return c.json({ error: "No puedes cambiar tu propio rol" }, 400);
    }
    if (data.isActive === false) {
      return c.json({ error: "No puedes desactivar tu propia cuenta" }, 400);
    }
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return c.json({ data: user });
  } catch {
    return c.json({ error: "User not found" }, 404);
  }
});

export default router;
