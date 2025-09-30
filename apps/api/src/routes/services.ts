import { Hono } from "hono";
import { db } from "../lib/db";
import { requireAuth } from "../middleware/auth";
import { createServiceSchema, updateServiceSchema } from "../schemas";
import type { CreateServiceInput, UpdateServiceInput } from "../schemas";

const services = new Hono();

// Get all active services
services.get("/", async (c) => {
  const allServices = await db.service.findMany({
    where: { active: true },
    orderBy: { basePrice: "asc" },
  });
  return c.json(allServices);
});

// Get service by ID
services.get("/:id", async (c) => {
  const id = c.req.param("id");
  const service = await db.service.findUnique({
    where: { id },
  });

  if (!service) {
    return c.json({ error: "Service not found" }, 404);
  }

  return c.json(service);
});

// Create service (admin only)
services.post("/", requireAuth(["ADMIN"]), async (c) => {
  const json = (await c.req.json()) as unknown;
  const parseResult = createServiceSchema.safeParse(json);

  if (!parseResult.success) {
    return c.json(
      {
        error: "Invalid service payload",
        details: parseResult.error.flatten().fieldErrors,
      },
      400,
    );
  }

  const payload: CreateServiceInput = parseResult.data;
  const service = await db.service.create({
    data: {
      name: payload.name,
      description: payload.description,
      basePrice: payload.basePrice,
      duration: payload.duration,
      active: payload.active ?? true,
    },
  });
  return c.json(service, 201);
});

// Update service (admin only)
services.patch("/:id", requireAuth(["ADMIN"]), async (c) => {
  const id = c.req.param("id");
  const json = (await c.req.json()) as unknown;
  const parseResult = updateServiceSchema.safeParse(json);

  if (!parseResult.success) {
    return c.json(
      {
        error: "Invalid service update payload",
        details: parseResult.error.flatten().fieldErrors,
      },
      400,
    );
  }

  const payload: UpdateServiceInput = parseResult.data;
  const updateData: Partial<CreateServiceInput> = {};

  if (payload.name !== undefined) {
    updateData.name = payload.name;
  }

  if (payload.description !== undefined) {
    updateData.description = payload.description;
  }

  if (payload.basePrice !== undefined) {
    updateData.basePrice = payload.basePrice;
  }

  if (payload.duration !== undefined) {
    updateData.duration = payload.duration;
  }

  if (payload.active !== undefined) {
    updateData.active = payload.active;
  }

  const service = await db.service.update({
    where: { id },
    data: updateData,
  });

  return c.json(service);
});

export default services;
