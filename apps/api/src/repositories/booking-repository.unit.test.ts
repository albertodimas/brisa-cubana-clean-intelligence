import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Prisma, PrismaClient } from "@prisma/client";
import { BookingRepository } from "./booking-repository.js";

const DEFAULT_TENANT = "tenant_brisa_cubana";

describe("BookingRepository (Unit)", () => {
  let repository: BookingRepository;
  let prisma: {
    booking: {
      findMany: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    prisma = {
      booking: {
        findMany: vi.fn().mockResolvedValue([]),
        update: vi.fn(),
      },
    };

    repository = new BookingRepository(prisma as unknown as PrismaClient);
  });

  it("builds where clause with filters and tenant constraint", async () => {
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

    expect(prisma.booking.findMany).toHaveBeenCalledWith({
      where: {
        status: "CONFIRMED",
        propertyId: "prop_1",
        serviceId: "service_1",
        customerId: "customer_1",
        scheduledAt: { gte: from, lte: to },
        tenantId: DEFAULT_TENANT,
      },
      take: 11,
      orderBy: { scheduledAt: "desc" },
    });
  });

  it("defaults to tenant filter when no additional filters provided", async () => {
    await repository.findManyPaginated(5);

    expect(prisma.booking.findMany).toHaveBeenCalledWith({
      where: { tenantId: DEFAULT_TENANT },
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

    expect(prisma.booking.findMany).toHaveBeenCalledWith({
      where: { tenantId: DEFAULT_TENANT },
      take: 6,
      orderBy,
    });
  });

  it("delete/restore operations scope by tenant id", async () => {
    vi.mocked(prisma.booking.update).mockResolvedValue({} as any);

    await repository.delete("booking_1");
    expect(prisma.booking.update).toHaveBeenCalledWith({
      where: { id: "booking_1", tenantId: DEFAULT_TENANT },
      data: { deletedAt: expect.any(Date) },
    });

    vi.mocked(prisma.booking.update).mockResolvedValue({
      id: "booking_1",
      tenantId: DEFAULT_TENANT,
      deletedAt: null,
    } as any);

    const restored = await repository.restore("booking_1");
    expect(restored).toEqual({
      id: "booking_1",
      tenantId: DEFAULT_TENANT,
      deletedAt: null,
    });
    expect(prisma.booking.update).toHaveBeenCalledWith({
      where: { id: "booking_1", tenantId: DEFAULT_TENANT },
      data: { deletedAt: null },
    });
  });
});
