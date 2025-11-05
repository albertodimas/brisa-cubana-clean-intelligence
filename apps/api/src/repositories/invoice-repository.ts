import type {
  PrismaClient,
  Invoice,
  InvoiceStatus,
  Prisma,
} from "@prisma/client";
import type { BaseRepository, FindManyOptions } from "./base-repository.js";

/**
 * Tipos para Invoice Repository
 */
export type InvoiceCreateInput = {
  bookingId: string;
  amount: number;
  status?: InvoiceStatus;
  stripePaymentIntentId?: string;
  paidAt?: Date;
  metadata?: Prisma.InputJsonValue;
};

export type InvoiceUpdateInput = Partial<InvoiceCreateInput>;

export type InvoiceWithRelations = Invoice & {
  booking?: any;
};

export interface InvoiceFilters {
  status?: InvoiceStatus;
  bookingId?: string;
  stripePaymentIntentId?: string;
}

/**
 * Repositorio para la entidad Invoice
 */
export class InvoiceRepository
  implements BaseRepository<Invoice, InvoiceCreateInput, InvoiceUpdateInput>
{
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Invoice | null> {
    return await this.prisma.invoice.findUnique({
      where: { id },
    });
  }

  async findByIdWithRelations(
    id: string,
  ): Promise<InvoiceWithRelations | null> {
    return await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            customer: true,
            property: true,
            service: true,
          },
        },
      },
    });
  }

  async findByBookingId(bookingId: string): Promise<Invoice[]> {
    return await this.prisma.invoice.findMany({
      where: { bookingId },
      orderBy: { createdAt: "desc" },
    });
  }

  async findByStripePaymentIntentId(
    stripePaymentIntentId: string,
  ): Promise<Invoice | null> {
    return await this.prisma.invoice.findUnique({
      where: { stripePaymentIntentId },
    });
  }

  async findMany(options: FindManyOptions = {}): Promise<Invoice[]> {
    const { take, skip, cursor, where, include, orderBy } = options;

    return await this.prisma.invoice.findMany({
      where,
      include,
      take,
      skip,
      cursor: cursor ?? undefined,
      orderBy: orderBy ?? { createdAt: "desc" },
    });
  }

  async findManyWithFilters(filters: InvoiceFilters): Promise<Invoice[]> {
    const where: Prisma.InvoiceWhereInput = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.bookingId) {
      where.bookingId = filters.bookingId;
    }

    if (filters.stripePaymentIntentId) {
      where.stripePaymentIntentId = filters.stripePaymentIntentId;
    }

    return await this.prisma.invoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        booking: {
          include: {
            customer: true,
            property: true,
            service: true,
          },
        },
      },
    });
  }

  async create(data: InvoiceCreateInput): Promise<Invoice> {
    return await this.prisma.invoice.create({
      data: {
        bookingId: data.bookingId,
        amount: data.amount,
        status: data.status ?? "PENDING",
        stripePaymentIntentId: data.stripePaymentIntentId,
        paidAt: data.paidAt,
        metadata: data.metadata,
      },
    });
  }

  async update(id: string, data: InvoiceUpdateInput): Promise<Invoice> {
    const updateData: Prisma.InvoiceUpdateInput = {};

    if (data.amount !== undefined) {
      updateData.amount = data.amount;
    }
    if (data.status !== undefined) {
      updateData.status = data.status;
    }
    if (data.stripePaymentIntentId !== undefined) {
      updateData.stripePaymentIntentId = data.stripePaymentIntentId;
    }
    if (data.paidAt !== undefined) {
      updateData.paidAt = data.paidAt;
    }
    if (data.metadata !== undefined) {
      updateData.metadata = data.metadata;
    }

    return await this.prisma.invoice.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.invoice.delete({
      where: { id },
    });
  }

  async count(where?: Prisma.InvoiceWhereInput): Promise<number> {
    return await this.prisma.invoice.count({
      where,
    });
  }

  async restore(_id: string): Promise<Invoice> {
    throw new Error("Invoices do not support restore after deletion");
  }
}
