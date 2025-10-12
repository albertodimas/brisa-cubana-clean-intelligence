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

  async findById(id: string): Promise<Service | null> {
    return await this.prisma.service.findUnique({
      where: { id },
    });
  }

  async findMany(options: FindManyOptions = {}): Promise<Service[]> {
    const { take, skip, cursor, where, orderBy } = options;

    return await this.prisma.service.findMany({
      where,
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
  ): Promise<PaginatedResult<Service>> {
    const take = limit + 1; // Traer uno extra para saber si hay más
    const { orderBy, where } = options;

    const services = await this.prisma.service.findMany({
      where,
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

  async create(data: ServiceCreateInput): Promise<Service> {
    return await this.prisma.service.create({
      data,
    });
  }

  async update(id: string, data: ServiceUpdateInput): Promise<Service> {
    return await this.prisma.service.update({
      where: { id },
      data,
    });
  }

  async count(where?: any): Promise<number> {
    return await this.prisma.service.count({
      where,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.service.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async restore(id: string): Promise<Service> {
    return await this.prisma.service.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  /**
   * Busca servicios activos
   */
  async findActive(): Promise<Service[]> {
    return await this.prisma.service.findMany({
      where: { active: true },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Busca servicios por nombre (búsqueda parcial)
   */
  async findByName(name: string): Promise<Service[]> {
    return await this.prisma.service.findMany({
      where: {
        name: {
          contains: name,
          mode: "insensitive",
        },
      },
      orderBy: { name: "asc" },
    });
  }
}
