import { Hono } from "hono";
import { db } from "../lib/db";
import { getAuthUser, requireAuth } from "../middleware/auth";
import { rateLimiter, RateLimits } from "../middleware/rate-limit";
import { z } from "zod";

const properties = new Hono();

// Apply rate limiting
properties.use("/", rateLimiter(RateLimits.read));

const createPropertySchema = z.object({
  name: z.string().min(1).max(255),
  address: z.string().min(1).max(500),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  zipCode: z.string().min(1).max(20),
  type: z.enum(["RESIDENTIAL", "VACATION_RENTAL", "OFFICE", "HOSPITALITY"]),
  size: z.number().int().positive().optional(),
  bedrooms: z.number().int().nonnegative().optional(),
  bathrooms: z.number().int().nonnegative().optional(),
  notes: z.string().max(1000).optional(),
});

const updatePropertySchema = createPropertySchema.partial();

type CreatePropertyInput = z.infer<typeof createPropertySchema>;
type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;

// Get all properties for authenticated user
properties.get("/", requireAuth(), async (c) => {
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
properties.get("/:id", requireAuth(), async (c) => {
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
});

// Create new property
properties.post(
  "/",
  requireAuth(),
  rateLimiter(RateLimits.write),
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

    // Create property for the authenticated user
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createData: any = {
      name: data.name,
      address: data.address,
      city: data.city,
      state: data.state,
      zipCode: data.zipCode,
      type: data.type,
      userId: authUser.sub,
    };

    if (data.size !== undefined) createData.size = data.size;
    if (data.bedrooms !== undefined) createData.bedrooms = data.bedrooms;
    if (data.bathrooms !== undefined) createData.bathrooms = data.bathrooms;
    if (data.notes !== undefined) createData.notes = data.notes;

    const property = await db.property.create({
      data: createData,
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
  requireAuth(),
  rateLimiter(RateLimits.write),
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
      data,
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
  requireAuth(),
  rateLimiter(RateLimits.write),
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
