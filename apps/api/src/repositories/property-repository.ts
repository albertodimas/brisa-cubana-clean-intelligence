import type { Prisma, PrismaClient, Property } from "@prisma/client";
import type {
  CreatePropertyDto,
  IPropertyRepository,
  PropertyPagination,
  PropertyPaginationParams,
  PropertyResponse,
  PropertySearchParams,
  UpdatePropertyDto,
} from "../interfaces/property.interface.js";

const ownerSelect = {
  id: true,
  email: true,
  fullName: true,
} as const;

type PrismaPropertyWithOwner = Property & {
  owner?: { id: string; email: string; fullName: string } | null;
};

const DEFAULT_TENANT_ID =
  process.env.DEFAULT_TENANT_ID ?? "tenant_brisa_cubana";

function assertTenantId(tenantId?: string): string {
  return tenantId ?? DEFAULT_TENANT_ID;
}

function toPropertyResponse(
  property: PrismaPropertyWithOwner,
): PropertyResponse {
  const { owner, ...rest } = property;
  return {
    ...rest,
    owner: owner
      ? {
          id: owner.id,
          email: owner.email,
          fullName: owner.fullName,
        }
      : undefined,
  };
}

export class PropertyRepository implements IPropertyRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findMany(
    { limit = 50, cursor }: PropertyPaginationParams = {},
    tenantId?: string,
  ) {
    const scopedTenantId = assertTenantId(tenantId);
    const take = limit + 1;

    const properties = await this.prisma.property.findMany({
      where: { tenantId: scopedTenantId },
      take,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      include: { owner: { select: ownerSelect } },
    });

    const hasMore = properties.length > limit;
    const data = hasMore ? properties.slice(0, limit) : properties;
    const normalized = data.map((property) =>
      toPropertyResponse(property as PrismaPropertyWithOwner),
    );
    const nextCursor = hasMore ? (data[data.length - 1]?.id ?? null) : null;

    return {
      data: normalized,
      pagination: {
        limit,
        cursor: cursor ?? null,
        nextCursor,
        hasMore,
      },
    } satisfies {
      data: PropertyResponse[];
      pagination: {
        limit: number;
        cursor: string | null;
        nextCursor: string | null;
        hasMore: boolean;
      };
    };
  }

  async findById(id: string, tenantId?: string) {
    const scopedTenantId = assertTenantId(tenantId);
    const property = await this.prisma.property.findFirst({
      where: { id, tenantId: scopedTenantId },
      include: { owner: { select: ownerSelect } },
    });
    if (!property) {
      return null;
    }
    return toPropertyResponse(property as PrismaPropertyWithOwner);
  }

  async create(data: CreatePropertyDto, tenantId?: string) {
    const scopedTenantId = assertTenantId(tenantId);
    const property = await this.prisma.property.create({
      data: { ...data, tenantId: scopedTenantId },
      include: { owner: { select: ownerSelect } },
    });
    return toPropertyResponse(property as PrismaPropertyWithOwner);
  }

  async update(id: string, data: UpdatePropertyDto, tenantId?: string) {
    const scopedTenantId = assertTenantId(tenantId);
    const property = await this.prisma.property.update({
      where: { id, tenantId: scopedTenantId },
      data,
      include: { owner: { select: ownerSelect } },
    });
    return toPropertyResponse(property as PrismaPropertyWithOwner);
  }

  async delete(id: string, tenantId?: string) {
    const scopedTenantId = assertTenantId(tenantId);
    await this.prisma.property.update({
      where: { id, tenantId: scopedTenantId },
      data: { deletedAt: new Date() },
    });
  }

  async restore(id: string, tenantId?: string) {
    const scopedTenantId = assertTenantId(tenantId);
    const property = await this.prisma.property.update({
      where: { id, tenantId: scopedTenantId },
      data: { deletedAt: null },
      include: { owner: { select: ownerSelect } },
    });
    return toPropertyResponse(property as PrismaPropertyWithOwner);
  }

  async findByOwner(
    ownerId: string,
    tenantId?: string,
  ): Promise<PropertyResponse[]> {
    const scopedTenantId = assertTenantId(tenantId);
    const properties = await this.prisma.property.findMany({
      where: {
        ownerId,
        deletedAt: null,
        tenantId: scopedTenantId,
      },
      orderBy: [{ createdAt: "desc" }],
      include: { owner: { select: ownerSelect } },
    });

    return properties.map((property) =>
      toPropertyResponse(property as PrismaPropertyWithOwner),
    );
  }

  async findManyWithSearch(
    { search, city, type, ownerId, limit = 50, cursor }: PropertySearchParams,
    tenantId?: string,
  ): Promise<{
    data: PropertyResponse[];
    pagination: PropertyPagination;
  }> {
    const scopedTenantId = assertTenantId(tenantId);
    const where: Prisma.PropertyWhereInput = {};

    if (city) {
      where.city = city;
    }

    if (type) {
      where.type = type;
    }

    if (ownerId) {
      where.ownerId = ownerId;
    }

    if (search) {
      where.OR = [
        { label: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
        { addressLine: { contains: search, mode: "insensitive" } },
      ];
    }

    where.tenantId = scopedTenantId;

    const take = limit + 1;
    const properties = await this.prisma.property.findMany({
      where,
      take,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      include: { owner: { select: ownerSelect } },
    });

    const hasMore = properties.length > limit;
    const data = hasMore ? properties.slice(0, limit) : properties;
    const normalized = data.map((property) =>
      toPropertyResponse(property as PrismaPropertyWithOwner),
    );
    const nextCursor = hasMore ? (data[data.length - 1]?.id ?? null) : null;

    return {
      data: normalized,
      pagination: {
        limit,
        cursor: cursor ?? null,
        nextCursor,
        hasMore,
      },
    } satisfies { data: PropertyResponse[]; pagination: PropertyPagination };
  }
}
