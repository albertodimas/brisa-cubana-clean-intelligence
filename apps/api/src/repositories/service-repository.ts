import type { Prisma, PrismaClient, Service } from "@prisma/client";
import type {
  BaseRepository,
  FindManyOptions,
  PaginatedResult,
} from "./base-repository.js";

/**
 * Tipos para Service Repository
 */
export type ServiceCreateInput = {
  name: string;
  description?: string;
  basePrice: number;
  durationMin: number;
  active?: boolean;
};

export type ServiceUpdateInput = Partial<ServiceCreateInput>;

const DEFAULT_TENANT_ID =
  process.env.DEFAULT_TENANT_ID ?? "tenant_brisa_cubana";

function assertTenantId(tenantId?: string): string {
  return tenantId ?? DEFAULT_TENANT_ID;
}

/**
 * Repositorio para la entidad Service
 *
 * Abstrae el acceso a datos de servicios usando Prisma.
 * Implementa el patrón Repository para desacoplar la lógica de negocio
 * de la capa de persistencia.
 */
export class ServiceRepository
  implements BaseRepository<Service, ServiceCreateInput, ServiceUpdateInput>
{
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string, tenantId?: string): Promise<Service | null> {
    const scopedTenantId = assertTenantId(tenantId);
    return await this.prisma.service.findFirst({
      where: { id, tenantId: scopedTenantId },
    });
  }

  async findMany(
    options: FindManyOptions = {},
    tenantId?: string,
  ): Promise<Service[]> {
    const scopedTenantId = assertTenantId(tenantId);
    const { take, skip, cursor, where, orderBy } = options;

    return await this.prisma.service.findMany({
      where: {
        ...where,
        tenantId: scopedTenantId,
      },
      take,
      skip,
      cursor,
      orderBy: orderBy ?? { createdAt: "desc" },
    });
  }

  async findManyPaginated(
    limit: number = 50,
    cursor?: string,
    options: {
      orderBy?:
        | Prisma.ServiceOrderByWithRelationInput
        | Prisma.ServiceOrderByWithRelationInput[];
      where?: Prisma.ServiceWhereInput;
    } = {},
    tenantId?: string,
  ): Promise<PaginatedResult<Service>> {
    const scopedTenantId = assertTenantId(tenantId);
    const take = limit + 1; // Traer uno extra para saber si hay más
    const { orderBy, where } = options;

    const services = await this.prisma.service.findMany({
      where: {
        ...where,
        tenantId: scopedTenantId,
      },
      take,
      ...(cursor && {
        skip: 1,
        cursor: { id: cursor },
      }),
      orderBy: orderBy ?? { createdAt: "desc" },
    });

    const hasMore = services.length > limit;
    const data = hasMore ? services.slice(0, limit) : services;
    const nextCursor = hasMore
      ? (data[data.length - 1]?.id ?? undefined)
      : undefined;

    return {
      data,
      nextCursor,
      hasMore,
    };
  }

  async create(data: ServiceCreateInput, tenantId?: string): Promise<Service> {
    const scopedTenantId = assertTenantId(tenantId);
    return await this.prisma.service.create({
      data: { ...data, tenantId: scopedTenantId },
    });
  }

  async update(
    id: string,
    data: ServiceUpdateInput,
    tenantId?: string,
  ): Promise<Service> {
    const scopedTenantId = assertTenantId(tenantId);
    return await this.prisma.service.update({
      where: { id, tenantId: scopedTenantId },
      data,
    });
  }

  async count(where?: any, tenantId?: string): Promise<number> {
    const scopedTenantId = assertTenantId(tenantId);
    return await this.prisma.service.count({
      where: {
        ...where,
        tenantId: scopedTenantId,
      },
    });
  }

  async delete(id: string, tenantId?: string): Promise<void> {
    const scopedTenantId = assertTenantId(tenantId);
    await this.prisma.service.update({
      where: { id, tenantId: scopedTenantId },
      data: { deletedAt: new Date() },
    });
  }

  async restore(id: string, tenantId?: string): Promise<Service> {
    const scopedTenantId = assertTenantId(tenantId);
    return await this.prisma.service.update({
      where: { id, tenantId: scopedTenantId },
      data: { deletedAt: null },
    });
  }

  /**
   * Busca servicios activos
   */
  async findActive(tenantId?: string): Promise<Service[]> {
    const scopedTenantId = assertTenantId(tenantId);
    return await this.prisma.service.findMany({
      where: { active: true, tenantId: scopedTenantId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Busca servicios por nombre (búsqueda parcial)
   */
  async findByName(name: string, tenantId?: string): Promise<Service[]> {
    const scopedTenantId = assertTenantId(tenantId);
    return await this.prisma.service.findMany({
      where: {
        tenantId: scopedTenantId,
        name: {
          contains: name,
          mode: "insensitive",
        },
      },
      orderBy: { name: "asc" },
    });
  }

  async findManyWithSearch(
    options: {
      search?: string;
      active?: boolean;
      limit?: number;
      cursor?: string;
    },
    tenantId?: string,
  ): Promise<PaginatedResult<Service>> {
    const scopedTenantId = assertTenantId(tenantId);
    const { search, active, limit = 50, cursor } = options;

    const where: Prisma.ServiceWhereInput = {};

    if (typeof active === "boolean") {
      where.active = active;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    where.tenantId = scopedTenantId;

    return await this.findManyPaginated(
      limit,
      cursor,
      {
        where,
        orderBy: [{ name: "asc" }, { id: "asc" }],
      },
      scopedTenantId,
    );
  }
}
