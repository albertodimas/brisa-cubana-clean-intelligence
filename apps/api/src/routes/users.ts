import { Hono } from "hono";
import { z } from "zod";
import * as bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { authenticate, requireRoles } from "../middleware/auth.js";

const router = new Hono();

const updateUserSchema = z
  .object({
    role: z
      .enum(["ADMIN", "COORDINATOR", "STAFF", "CLIENT"], {
        required_error: "role es requerido",
      })
      .optional(),
    fullName: z.string().min(3).max(120).optional(),
    password: z.string().min(8).max(64).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debe enviar al menos un campo para actualizar",
  });

router.get("/", authenticate, requireRoles(["ADMIN"]), async (c) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return c.json({ data: users });
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

  try {
    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        updatedAt: true,
      },
    });

    return c.json({ data: user });
  } catch {
    return c.json({ error: "User not found" }, 404);
  }
});

export default router;
