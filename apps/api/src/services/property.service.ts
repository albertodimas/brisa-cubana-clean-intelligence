import { db } from "../lib/db";
import { logger } from "../lib/logger";
import type { Property, PropertyType } from "../generated/prisma";
import { NotFoundError, ValidationError, ForbiddenError } from "../lib/errors";

export interface CreatePropertyData {
  name: string;
  address: string;
  city?: string;
  state?: string;
  zipCode: string;
  type: PropertyType;
  size?: number;
  bedrooms?: number;
  bathrooms?: number;
  notes?: string;
  userId: string;
}

export interface UpdatePropertyData {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  type?: PropertyType;
  size?: number;
  bedrooms?: number;
  bathrooms?: number;
  notes?: string;
}

/**
 * Property Service
 * 
 * Handles all business logic related to properties:
 * - CRUD operations
 * - Authorization checks (user can only manage their own properties)
 * - Validation
 */
export class PropertyService {
  /**
   * Get a property by ID
   * 
   * @param id - Property ID
   * @param userId - Optional user ID for authorization check
   */
  async getById(id: string, userId?: string): Promise<Property> {
    const property = await db.property.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!property) {
      throw new NotFoundError(`Property with ID ${id} not found`);
    }

    // Authorization check: if userId is provided, verify ownership
    if (userId && property.userId !== userId) {
      throw new ForbiddenError("You do not have access to this property");
    }

    return property;
  }

  /**
   * Get all properties with pagination and filters
   */
  async getAll(
    page: number,
    limit: number,
    filters?: {
      userId?: string;
      type?: PropertyType;
      city?: string;
    },
  ): Promise<{
    data: Property[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    if (page < 1) {
      throw new ValidationError("Page must be >= 1");
    }

    if (limit < 1 || limit > 100) {
      throw new ValidationError("Limit must be between 1 and 100");
    }

    const skip = (page - 1) * limit;

    const where = filters
      ? {
          ...(filters.userId && { userId: filters.userId }),
          ...(filters.type && { type: filters.type }),
          ...(filters.city && { city: filters.city }),
        }
      : undefined;

    const [data, total] = await Promise.all([
      db.property.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      db.property.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get properties for a specific user
   */
  async getUserProperties(userId: string): Promise<Property[]> {
    return await db.property.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Create a new property
   */
  async create(data: CreatePropertyData): Promise<Property> {
    // Validate required fields
    if (!data.name || !data.address || !data.zipCode) {
      throw new ValidationError("Name, address, and zip code are required");
    }

    // Validate zip code format (US format)
    const zipCodeRegex = /^\d{5}(-\d{4})?$/;
    if (!zipCodeRegex.test(data.zipCode)) {
      throw new ValidationError("Invalid zip code format");
    }

    // Verify user exists
    const user = await db.user.findUnique({
      where: { id: data.userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundError(`User with ID ${data.userId} not found`);
    }

    // Create property
    const property = await db.property.create({
      data: {
        name: data.name,
        address: data.address,
        city: data.city ?? "Miami",
        state: data.state ?? "FL",
        zipCode: data.zipCode,
        type: data.type,
        size: data.size,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        notes: data.notes,
        userId: data.userId,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    logger.info(`Property created: ${property.id} by user ${data.userId}`);

    return property;
  }

  /**
   * Update a property
   * 
   * Verifies ownership before updating
   */
  async update(
    id: string,
    data: UpdatePropertyData,
    userId: string,
  ): Promise<Property> {
    // Verify property exists and user has access
    await this.getById(id, userId);

    // Validate zip code if provided
    if (data.zipCode) {
      const zipCodeRegex = /^\d{5}(-\d{4})?$/;
      if (!zipCodeRegex.test(data.zipCode)) {
        throw new ValidationError("Invalid zip code format");
      }
    }

    // Update property
    const property = await db.property.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.city !== undefined && { city: data.city }),
        ...(data.state !== undefined && { state: data.state }),
        ...(data.zipCode !== undefined && { zipCode: data.zipCode }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.size !== undefined && { size: data.size }),
        ...(data.bedrooms !== undefined && { bedrooms: data.bedrooms }),
        ...(data.bathrooms !== undefined && { bathrooms: data.bathrooms }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    logger.info(`Property updated: ${id} by user ${userId}`);

    return property;
  }

  /**
   * Delete a property
   * 
   * Verifies ownership before deletion
   * Only allows deletion if no active bookings exist
   */
  async delete(id: string, userId: string): Promise<void> {
    // Verify property exists and user has access
    await this.getById(id, userId);

    // Check for active bookings
    const activeBookings = await db.booking.count({
      where: {
        propertyId: id,
        status: { in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] },
      },
    });

    if (activeBookings > 0) {
      throw new ValidationError(
        `Cannot delete property with ${activeBookings} active booking(s). Cancel bookings first.`,
      );
    }

    await db.property.delete({ where: { id } });

    logger.info(`Property deleted: ${id} by user ${userId}`);
  }
}

// Export singleton instance
export const propertyService = new PropertyService();
