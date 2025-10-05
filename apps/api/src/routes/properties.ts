import { Hono } from "hono";
import { db } from "../lib/db";
import { getAuthUser, requireAuth } from "../middleware/auth";
import { rateLimiter, RateLimits } from "../middleware/rate-limit";
import {
  createPropertySchema,
  updatePropertySchema,
  type CreatePropertyInput,
  type UpdatePropertyInput,
} from "../schemas";

const properties = new Hono();

// Get all properties for authenticated user
properties.get("/", rateLimiter(RateLimits.read), requireAuth(), async (c) => {
  const authUser = getAuthUser(c);

  if (!authUser) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Admin can see all properties, users see only their own
  const whereClause = authUser.role === "ADMIN" ? {} : { userId: authUser.sub };

  const userProperties = await db.property.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      _count: {
        select: {
          bookings: true,
        },
      },
    },
  });

  return c.json(userProperties);
});

// Get specific property by ID
properties.get(
  "/:id",
  rateLimiter(RateLimits.read),
  requireAuth(),
  async (c) => {
    const authUser = getAuthUser(c);

    if (!authUser) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const propertyId = c.req.param("id");

    const property = await db.property.findUnique({
      where: { id: propertyId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        bookings: {
          orderBy: { scheduledAt: "desc" },
          take: 10,
          include: {
            service: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!property) {
      return c.json({ error: "Property not found" }, 404);
    }

    // Users can only see their own properties, admins can see all
    if (authUser.role !== "ADMIN" && property.userId !== authUser.sub) {
      return c.json({ error: "Forbidden" }, 403);
    }

    return c.json(property);
  },
);

// Create new property
properties.post(
  "/",
  rateLimiter(RateLimits.write),
  requireAuth(),
  async (c) => {
    const authUser = getAuthUser(c);

    if (!authUser) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const json = (await c.req.json()) as unknown;
    const parseResult = createPropertySchema.safeParse(json);

    if (!parseResult.success) {
      return c.json(
        {
          error: "Invalid property data",
          details: parseResult.error.flatten().fieldErrors,
        },
        400,
      );
    }

    const data: CreatePropertyInput = parseResult.data;

    const property = await db.property.create({
      data: {
        name: data.name,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        type: data.type,
        userId: authUser.sub,
        size: data.size ?? null,
        bedrooms: data.bedrooms ?? null,
        bathrooms: data.bathrooms ?? null,
        notes: data.notes ?? null,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    return c.json(property, 201);
  },
);

// Update property
properties.patch(
  "/:id",
  rateLimiter(RateLimits.write),
  requireAuth(),
  async (c) => {
    const authUser = getAuthUser(c);

    if (!authUser) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const propertyId = c.req.param("id");

    // Check if property exists and user has access
    const existingProperty = await db.property.findUnique({
      where: { id: propertyId },
    });

    if (!existingProperty) {
      return c.json({ error: "Property not found" }, 404);
    }

    // Users can only update their own properties, admins can update all
    if (authUser.role !== "ADMIN" && existingProperty.userId !== authUser.sub) {
      return c.json({ error: "Forbidden" }, 403);
    }

    const json = (await c.req.json()) as unknown;
    const parseResult = updatePropertySchema.safeParse(json);

    if (!parseResult.success) {
      return c.json(
        {
          error: "Invalid property data",
          details: parseResult.error.flatten().fieldErrors,
        },
        400,
      );
    }

    const data: UpdatePropertyInput = parseResult.data;

    const property = await db.property.update({
      where: { id: propertyId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.address !== undefined ? { address: data.address } : {}),
        ...(data.city !== undefined ? { city: data.city } : {}),
        ...(data.state !== undefined ? { state: data.state } : {}),
        ...(data.zipCode !== undefined ? { zipCode: data.zipCode } : {}),
        ...(data.type !== undefined ? { type: data.type } : {}),
        ...(data.size !== undefined ? { size: data.size ?? null } : {}),
        ...(data.bedrooms !== undefined
          ? { bedrooms: data.bedrooms ?? null }
          : {}),
        ...(data.bathrooms !== undefined
          ? { bathrooms: data.bathrooms ?? null }
          : {}),
        ...(data.notes !== undefined ? { notes: data.notes ?? null } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    return c.json(property);
  },
);

// Delete property
properties.delete(
  "/:id",
  rateLimiter(RateLimits.write),
  requireAuth(),
  async (c) => {
    const authUser = getAuthUser(c);

    if (!authUser) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const propertyId = c.req.param("id");

    // Check if property exists and user has access
    const existingProperty = await db.property.findUnique({
      where: { id: propertyId },
      include: {
        _count: {
          select: {
            bookings: true,
          },
        },
      },
    });

    if (!existingProperty) {
      return c.json({ error: "Property not found" }, 404);
    }

    // Users can only delete their own properties, admins can delete all
    if (authUser.role !== "ADMIN" && existingProperty.userId !== authUser.sub) {
      return c.json({ error: "Forbidden" }, 403);
    }

    // Prevent deletion if property has bookings
    if (existingProperty._count.bookings > 0) {
      return c.json(
        {
          error: "Cannot delete property with existing bookings",
          bookingsCount: existingProperty._count.bookings,
        },
        409,
      );
    }

    await db.property.delete({
      where: { id: propertyId },
    });

    return c.json({ success: true, message: "Property deleted" });
  },
);

export default properties;
