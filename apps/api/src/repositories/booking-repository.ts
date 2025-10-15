import type {
  PrismaClient,
  Booking,
  BookingStatus,
  Prisma,
} from "@prisma/client";
import type {
  BaseRepository,
  FindManyOptions,
  PaginatedResult,
} from "./base-repository.js";

/**
 * Tipos para Booking Repository
 */
export type BookingCreateInput = {
  code: string;
  scheduledAt: Date;
  durationMin: number;
  status: BookingStatus;
  totalAmount: number;
  serviceId: string;
  propertyId: string;
  customerId: string;
  notes?: string;
};

export type BookingUpdateInput = Partial<
  Omit<BookingCreateInput, "code" | "notes">
> & {
  notes?: string | null;
};

export type BookingWithRelations = Booking & {
  service?: any;
  property?: any;
  customer?: any;
};

export interface BookingFilters {
  status?: BookingStatus;
  propertyId?: string;
  serviceId?: string;
  customerId?: string;
  from?: Date;
  to?: Date;
  search?: string;
}

/**
 * Repositorio para la entidad Booking
 */
export class BookingRepository
  implements BaseRepository<Booking, BookingCreateInput, BookingUpdateInput>
{
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Booking | null> {
    return await this.prisma.booking.findUnique({
      where: { id },
    });
  }

  async findByIdWithRelations(
    id: string,
  ): Promise<BookingWithRelations | null> {
    return await this.prisma.booking.findUnique({
      where: { id },
      include: {
        service: true,
        property: true,
        customer: true,
      },
    });
  }

  async findMany(options: FindManyOptions = {}): Promise<Booking[]> {
    const { take, skip, cursor, where, include, orderBy } = options;

    return await this.prisma.booking.findMany({
      where,
      include,
      take,
      skip,
      cursor,
      orderBy: orderBy ?? { scheduledAt: "desc" },
    });
  }

  async findManyPaginated(
    limit: number = 50,
    cursor?: string,
    filters?: BookingFilters,
    includeRelations: boolean = false,
    options: {
      orderBy?:
        | Prisma.BookingOrderByWithRelationInput
        | Prisma.BookingOrderByWithRelationInput[];
    } = {},
  ): Promise<PaginatedResult<Booking | BookingWithRelations>> {
    const take = limit + 1;

    const where = this.buildWhereClause(filters);
    const { orderBy } = options;

    const bookings = await this.prisma.booking.findMany({
      where,
      take,
      ...(cursor && {
        skip: 1,
        cursor: { id: cursor },
      }),
      ...(includeRelations && {
        include: {
          service: true,
          property: true,
          customer: true,
        },
      }),
      orderBy: orderBy ?? { scheduledAt: "desc" },
    });

    const hasMore = bookings.length > limit;
    const data = hasMore ? bookings.slice(0, limit) : bookings;
    const nextCursor = hasMore ? data[data.length - 1]?.id : undefined;

    return {
      data,
      nextCursor,
      hasMore,
    };
  }

  async create(data: BookingCreateInput): Promise<Booking> {
    return await this.prisma.booking.create({
      data,
    });
  }

  async update(id: string, data: BookingUpdateInput): Promise<Booking> {
    return await this.prisma.booking.update({
      where: { id },
      data,
    });
  }

  async count(where?: any): Promise<number> {
    return await this.prisma.booking.count({
      where,
    });
  }

  /**
   * Busca reservas por rango de fechas
   */
  async findByDateRange(from: Date, to: Date): Promise<Booking[]> {
    return await this.prisma.booking.findMany({
      where: {
        scheduledAt: {
          gte: from,
          lte: to,
        },
      },
      orderBy: { scheduledAt: "asc" },
    });
  }

  /**
   * Busca reservas por estado
   */
  async findByStatus(status: BookingStatus): Promise<Booking[]> {
    return await this.prisma.booking.findMany({
      where: { status },
      orderBy: { scheduledAt: "desc" },
    });
  }

  /**
   * Busca reservas de una propiedad específica
   */
  async findByProperty(propertyId: string): Promise<Booking[]> {
    return await this.prisma.booking.findMany({
      where: { propertyId },
      include: {
        service: true,
        customer: true,
      },
      orderBy: { scheduledAt: "desc" },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.booking.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async restore(id: string): Promise<Booking> {
    return await this.prisma.booking.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  /**
   * Construye la cláusula WHERE para filtros
   */
  private buildWhereClause(
    filters?: BookingFilters,
  ): Prisma.BookingWhereInput | undefined {
    if (!filters) return undefined;

    const where: Prisma.BookingWhereInput = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.propertyId) {
      where.propertyId = filters.propertyId;
    }

    if (filters.serviceId) {
      where.serviceId = filters.serviceId;
    }

    if (filters.customerId) {
      where.customerId = filters.customerId;
    }

    if (filters.from || filters.to) {
      where.scheduledAt = {
        ...(filters.from ? { gte: filters.from } : {}),
        ...(filters.to ? { lte: filters.to } : {}),
      };
    }

    if (filters.search) {
      const search = filters.search;
      where.OR = [
        { code: { contains: search, mode: "insensitive" } },
        {
          customer: {
            OR: [
              { email: { contains: search, mode: "insensitive" } },
              { fullName: { contains: search, mode: "insensitive" } },
            ],
          },
        },
        {
          property: {
            label: { contains: search, mode: "insensitive" },
          },
        },
      ];
    }

    return Object.keys(where).length > 0 ? where : undefined;
  }
}
