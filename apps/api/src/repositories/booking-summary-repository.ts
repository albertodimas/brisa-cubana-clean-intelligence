import type { BookingSummary, PrismaClient } from "@prisma/client";

export type UpsertBookingSummaryInput = {
  bookingId: string;
  tenantId?: string | null;
  summary: string;
  model: string;
  tokens: number;
};

export class BookingSummaryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findByBookingId(bookingId: string): Promise<BookingSummary | null> {
    return this.prisma.bookingSummary.findUnique({
      where: { bookingId },
    });
  }

  upsert(data: UpsertBookingSummaryInput): Promise<BookingSummary> {
    return this.prisma.bookingSummary.upsert({
      where: { bookingId: data.bookingId },
      create: {
        bookingId: data.bookingId,
        tenantId: data.tenantId ?? null,
        summary: data.summary,
        model: data.model,
        tokens: data.tokens,
      },
      update: {
        summary: data.summary,
        model: data.model,
        tokens: data.tokens,
        tenantId: data.tenantId ?? null,
      },
    });
  }
}
