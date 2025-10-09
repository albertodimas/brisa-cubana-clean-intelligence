import { Hono } from "hono";
import { z } from "zod";
import * as bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import {
  authenticate,
  requireRoles,
  getAuthenticatedUser,
} from "../middleware/auth.js";

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

router.get("/", authenticate, requireRoles(["ADMIN"]), async (c) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
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

  return c.json({ data: users });
});

router.post("/", authenticate, requireRoles(["ADMIN"]), async (c) => {
  const parsed = createUserSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const { email, fullName, password, role } = parsed.data;

  const namespace = bcrypt as unknown as {
    hash?: typeof bcrypt.hash;
    default?: { hash?: typeof bcrypt.hash };
  };
  const hashFn = namespace.hash ?? namespace.default?.hash;
  if (!hashFn) {
    return c.json({ error: "Servicio de hashing no disponible" }, 500);
  }

  try {
    const user = await prisma.user.create({
      data: {
        email,
        fullName,
        role,
        isActive: true,
        passwordHash: await hashFn(password, 10),
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
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return c.json({ error: "Email ya registrado" }, 409);
    }
    // Also handle errors that look like Prisma errors (for testing)
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return c.json({ error: "Email ya registrado" }, 409);
    }
    console.error("[users] create", error);
    return c.json({ error: "No se pudo crear el usuario" }, 500);
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
    const namespace = bcrypt as unknown as {
      hash?: typeof bcrypt.hash;
      default?: { hash?: typeof bcrypt.hash };
    };
    const hashFn = namespace.hash ?? namespace.default?.hash;
    if (!hashFn) {
      return c.json({ error: "Servicio de hashing no disponible" }, 500);
    }
    data.passwordHash = await hashFn(password, 10);
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
