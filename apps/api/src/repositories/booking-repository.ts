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

const DEFAULT_TENANT_ID =
  process.env.DEFAULT_TENANT_ID ?? "tenant_brisa_cubana";

function resolveTenantId(tenantId?: string) {
  return tenantId ?? DEFAULT_TENANT_ID;
}

function withTenantScope(
  where: Prisma.BookingWhereInput | undefined,
  tenantId: string,
): Prisma.BookingWhereInput {
  if (!where) {
    return { tenantId } satisfies Prisma.BookingWhereInput;
  }

  return {
    ...where,
    tenantId,
  } satisfies Prisma.BookingWhereInput;
}

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
  assignedStaffId?: string | null;
  tenantId?: string;
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
  assignedStaff?: {
    id: string;
    email: string;
    fullName: string | null;
    role: string;
    isActive: boolean;
  } | null;
};

export interface BookingFilters {
  status?: BookingStatus;
  propertyId?: string;
  serviceId?: string;
  customerId?: string;
  assignedStaffId?: string;
  code?: string;
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

  async findById(id: string, tenantId?: string): Promise<Booking | null> {
    const scopedTenantId = resolveTenantId(tenantId);
    return await this.prisma.booking.findFirst({
      where: { id, tenantId: scopedTenantId },
    });
  }

  async findByIdWithRelations(
    id: string,
    tenantId?: string,
  ): Promise<BookingWithRelations | null> {
    const scopedTenantId = resolveTenantId(tenantId);
    return await this.prisma.booking.findFirst({
      where: { id, tenantId: scopedTenantId },
      include: {
        service: true,
        property: true,
        customer: true,
        assignedStaff: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            isActive: true,
          },
        },
      },
    });
  }

  async findMany(
    options: FindManyOptions = {},
    tenantId?: string,
  ): Promise<Booking[]> {
    const { take, skip, cursor, where, include, orderBy } = options;
    const scopedTenantId = resolveTenantId(tenantId);

    return await this.prisma.booking.findMany({
      where: withTenantScope(where, scopedTenantId),
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
    tenantId?: string,
  ): Promise<PaginatedResult<Booking | BookingWithRelations>> {
    const take = limit + 1;

    const scopedTenantId = resolveTenantId(tenantId);
    const where = withTenantScope(
      this.buildWhereClause(filters),
      scopedTenantId,
    );
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
          assignedStaff: {
            select: {
              id: true,
              email: true,
              fullName: true,
              role: true,
              isActive: true,
            },
          },
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

  async create(data: BookingCreateInput, tenantId?: string): Promise<Booking> {
    const scopedTenantId = resolveTenantId(data.tenantId ?? tenantId);
    return await this.prisma.booking.create({
      data: { ...data, tenantId: scopedTenantId },
    });
  }

  async update(
    id: string,
    data: BookingUpdateInput,
    tenantId?: string,
  ): Promise<Booking> {
    const scopedTenantId = resolveTenantId(tenantId);
    return await this.prisma.booking.update({
      where: { id, tenantId: scopedTenantId },
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
  async findByDateRange(
    from: Date,
    to: Date,
    tenantId?: string,
  ): Promise<Booking[]> {
    const scopedTenantId = resolveTenantId(tenantId);
    return await this.prisma.booking.findMany({
      where: {
        scheduledAt: {
          gte: from,
          lte: to,
        },
        tenantId: scopedTenantId,
      },
      orderBy: { scheduledAt: "asc" },
    });
  }

  /**
   * Busca reservas por estado
   */
  async findByStatus(
    status: BookingStatus,
    tenantId?: string,
  ): Promise<Booking[]> {
    const scopedTenantId = resolveTenantId(tenantId);
    return await this.prisma.booking.findMany({
      where: { status, tenantId: scopedTenantId },
      orderBy: { scheduledAt: "desc" },
    });
  }

  /**
   * Busca reservas de una propiedad específica
   */
  async findByProperty(
    propertyId: string,
    tenantId?: string,
  ): Promise<Booking[]> {
    const scopedTenantId = resolveTenantId(tenantId);
    return await this.prisma.booking.findMany({
      where: { propertyId, tenantId: scopedTenantId },
      include: {
        service: true,
        customer: true,
      },
      orderBy: { scheduledAt: "desc" },
    });
  }

  async delete(id: string, tenantId?: string): Promise<void> {
    const scopedTenantId = resolveTenantId(tenantId);
    await this.prisma.booking.update({
      where: { id, tenantId: scopedTenantId },
      data: { deletedAt: new Date() },
    });
  }

  async restore(id: string, tenantId?: string): Promise<Booking> {
    const scopedTenantId = resolveTenantId(tenantId);
    return await this.prisma.booking.update({
      where: { id, tenantId: scopedTenantId },
      data: { deletedAt: null },
    });
  }

  /**
   * Detecta conflictos de horario para una propiedad
   * Verifica si existe una reserva activa en el mismo rango de tiempo
   *
   * @param propertyId - ID de la propiedad
   * @param scheduledAt - Fecha y hora de inicio propuesta
   * @param durationMin - Duración en minutos
   * @param excludeBookingId - ID opcional de booking a excluir (para updates)
   * @returns true si hay conflicto, false si está disponible
   */
  async hasTimeConflict(
    propertyId: string,
    scheduledAt: Date,
    durationMin: number,
    excludeBookingId?: string,
    tenantId?: string,
  ): Promise<boolean> {
    const endTime = new Date(scheduledAt.getTime() + durationMin * 60 * 1000);
    const scopedTenantId = resolveTenantId(tenantId);

    // Buscar reservas activas que se solapen con el rango propuesto
    const conflictingBooking = await this.prisma.booking.findFirst({
      where: {
        propertyId,
        tenantId: scopedTenantId,
        deletedAt: null,
        // Solo considerar reservas que no están canceladas
        status: {
          notIn: ["CANCELLED"],
        },
        // Excluir el booking actual si es un update
        ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
        // Detectar solapamiento: el nuevo booking se solapa si:
        // - Su inicio está antes del final de una reserva existente
        // - Y su final está después del inicio de esa reserva existente
        AND: [
          {
            scheduledAt: {
              lt: endTime,
            },
          },
          {
            // Calcular el final de la reserva existente
            scheduledAt: {
              gte: new Date(scheduledAt.getTime() - 24 * 60 * 60 * 1000), // Solo buscar en ventana de ±24h para performance
            },
          },
        ],
      },
      select: {
        id: true,
        scheduledAt: true,
        durationMin: true,
      },
    });

    if (!conflictingBooking) {
      return false;
    }

    // Verificar solapamiento preciso con la duración
    const existingEnd = new Date(
      conflictingBooking.scheduledAt.getTime() +
        conflictingBooking.durationMin * 60 * 1000,
    );

    // Hay conflicto si:
    // - El nuevo inicio está antes del final del existente Y
    // - El nuevo final está después del inicio del existente
    const hasConflict =
      scheduledAt < existingEnd && endTime > conflictingBooking.scheduledAt;

    return hasConflict;
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

    if (filters.assignedStaffId) {
      where.assignedStaffId = filters.assignedStaffId;
    }

    if (filters.code) {
      where.code = filters.code;
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
