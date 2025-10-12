import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Prisma, PrismaClient } from "@prisma/client";
import { BookingRepository } from "./booking-repository.js";

describe("BookingRepository (Unit)", () => {
  let repository: BookingRepository;
  let mockPrisma: {
    booking: {
      findMany: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    mockPrisma = {
      booking: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    };

    repository = new BookingRepository(mockPrisma as unknown as PrismaClient);
  });

  it("builds where clause with full set of filters", async () => {
    const from = new Date("2025-01-01T00:00:00Z");
    const to = new Date("2025-01-31T23:59:59Z");

    await repository.findManyPaginated(10, undefined, {
      status: "CONFIRMED",
      propertyId: "prop_1",
      serviceId: "service_1",
      customerId: "customer_1",
      from,
      to,
    });

    expect(mockPrisma.booking.findMany).toHaveBeenCalledWith({
      where: {
        status: "CONFIRMED",
        propertyId: "prop_1",
        serviceId: "service_1",
        customerId: "customer_1",
        scheduledAt: {
          gte: from,
          lte: to,
        },
      },
      take: 11,
      orderBy: { scheduledAt: "desc" },
    });
  });

  it("omits where clause when filters are empty", async () => {
    await repository.findManyPaginated(5);

    expect(mockPrisma.booking.findMany).toHaveBeenCalledWith({
      where: undefined,
      take: 6,
      orderBy: { scheduledAt: "desc" },
    });
  });

  it("applies custom ordering when provided", async () => {
    const orderBy: Prisma.BookingOrderByWithRelationInput[] = [
      { scheduledAt: "asc" },
      { id: "asc" },
    ];

    await repository.findManyPaginated(5, undefined, undefined, false, {
      orderBy,
    });

    expect(mockPrisma.booking.findMany).toHaveBeenCalledWith({
      where: undefined,
      take: 6,
      orderBy,
    });
  });
});
