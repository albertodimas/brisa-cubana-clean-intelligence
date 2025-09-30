import { Hono } from "hono";
import { db } from "../lib/db";
import { hashPassword } from "../lib/password";
import { getAuthUser, requireAuth } from "../middleware/auth";
import {
  createUserSchema,
  updateUserPasswordSchema,
  updateUserSchema,
} from "../schemas";
import type {
  CreateUserInput,
  UpdateUserInput,
  UpdateUserPasswordInput,
} from "../schemas";

const users = new Hono();

users.use("*", requireAuth());

// Get all users (admin/staff only)
users.get("/", async (c) => {
  const authUser = getAuthUser(c);
  if (authUser?.role !== "ADMIN" && authUser?.role !== "STAFF") {
    return c.json({ error: "Forbidden" }, 403);
  }
  const allUsers = await db.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          bookings: true,
          properties: true,
        },
      },
    },
  });
  return c.json(allUsers);
});

// Get user by ID
users.get("/:id", async (c) => {
  const id = c.req.param("id");
  const authUser = getAuthUser(c);

  if (!authUser) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  if (
    authUser.role !== "ADMIN" &&
    authUser.role !== "STAFF" &&
    authUser.sub !== id
  ) {
    return c.json({ error: "Forbidden" }, 403);
  }
  const user = await db.user.findUnique({
    where: { id },
    include: {
      properties: true,
      bookings: {
        include: {
          service: true,
          property: true,
        },
        orderBy: { scheduledAt: "desc" },
        take: 10,
      },
    },
  });

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  const { passwordHash: _passwordHash, ...sanitized } = user;

  return c.json(sanitized);
});

// Create user
users.post("/", async (c) => {
  const authUser = getAuthUser(c);
  if (authUser?.role !== "ADMIN") {
    return c.json({ error: "Forbidden" }, 403);
  }
  const json = (await c.req.json()) as unknown;
  const parseResult = createUserSchema.safeParse(json);

  if (!parseResult.success) {
    return c.json(
      {
        error: "Invalid user payload",
        details: parseResult.error.flatten().fieldErrors,
      },
      400,
    );
  }

  const payload: CreateUserInput = parseResult.data;

  const existing = await db.user.findUnique({
    where: { email: payload.email },
  });

  if (existing) {
    return c.json({ error: "Email already exists" }, 400);
  }

  const user = await db.user.create({
    data: {
      email: payload.email,
      name: payload.name,
      phone: payload.phone,
      role: payload.role ?? "CLIENT",
      passwordHash: await hashPassword(payload.password),
    },
  });

  const { passwordHash: _passwordHash2, ...sanitized } = user;

  return c.json(sanitized, 201);
});

// Update user
users.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const authUser = getAuthUser(c);

  if (!authUser) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  if (authUser.role !== "ADMIN" && authUser.sub !== id) {
    return c.json({ error: "Forbidden" }, 403);
  }
  const json = (await c.req.json()) as unknown;
  const parseResult = updateUserSchema.safeParse(json);

  if (!parseResult.success) {
    return c.json(
      {
        error: "Invalid user update payload",
        details: parseResult.error.flatten().fieldErrors,
      },
      400,
    );
  }

  const payload: UpdateUserInput = parseResult.data;
  const updateData: UpdateUserInput = {};

  if (payload.name !== undefined) {
    updateData.name = payload.name;
  }

  if (payload.phone !== undefined) {
    updateData.phone = payload.phone;
  }

  if (payload.role !== undefined) {
    updateData.role = payload.role;
  }

  if (Object.keys(updateData).length === 0) {
    return c.json({ error: "No updates supplied" }, 400);
  }

  const user = await db.user.update({
    where: { id },
    data: updateData,
  });

  const { passwordHash: _passwordHash, ...sanitized } = user;

  return c.json(sanitized);
});

// Update user password
users.patch("/:id/password", async (c) => {
  const id = c.req.param("id");
  const authUser = getAuthUser(c);

  if (!authUser) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  if (authUser.role !== "ADMIN" && authUser.sub !== id) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const json = (await c.req.json()) as unknown;
  const parseResult = updateUserPasswordSchema.safeParse(json);

  if (!parseResult.success) {
    return c.json(
      {
        error: "Invalid user password payload",
        details: parseResult.error.flatten().fieldErrors,
      },
      400,
    );
  }

  const payload: UpdateUserPasswordInput = parseResult.data;
  const passwordHash = await hashPassword(payload.password);

  await db.user.update({
    where: { id },
    data: { passwordHash },
  });

  return c.json({ ok: true });
});

export default users;
