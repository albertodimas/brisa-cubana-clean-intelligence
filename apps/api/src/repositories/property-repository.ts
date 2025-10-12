import type { PrismaClient, Property } from "@prisma/client";
import type {
  CreatePropertyDto,
  IPropertyRepository,
  PropertyPaginationParams,
  PropertyResponse,
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

  async findMany({ limit = 50, cursor }: PropertyPaginationParams = {}) {
    const take = limit + 1;

    const properties = await this.prisma.property.findMany({
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

  async findById(id: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: { owner: { select: ownerSelect } },
    });
    if (!property) {
      return null;
    }
    return toPropertyResponse(property as PrismaPropertyWithOwner);
  }

  async create(data: CreatePropertyDto) {
    const property = await this.prisma.property.create({
      data,
      include: { owner: { select: ownerSelect } },
    });
    return toPropertyResponse(property as PrismaPropertyWithOwner);
  }

  async update(id: string, data: UpdatePropertyDto) {
    const property = await this.prisma.property.update({
      where: { id },
      data,
      include: { owner: { select: ownerSelect } },
    });
    return toPropertyResponse(property as PrismaPropertyWithOwner);
  }

  async delete(id: string) {
    await this.prisma.property.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async restore(id: string) {
    const property = await this.prisma.property.update({
      where: { id },
      data: { deletedAt: null },
      include: { owner: { select: ownerSelect } },
    });
    return toPropertyResponse(property as PrismaPropertyWithOwner);
  }
}
