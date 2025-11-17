import type { BookingSummary, Prisma, Service } from "@prisma/client";

type ServiceLike = {
  id: string;
  name: string;
  basePrice: Prisma.Decimal | number;
};

type BookingLike = {
  totalAmount: Prisma.Decimal | number;
  service?: ServiceLike | null;
  assignedStaff?: {
    id: string;
    email: string;
    fullName: string | null;
    role: string;
    isActive: boolean;
  } | null;
};

function decimalToNumber(value: Prisma.Decimal | number): number {
  return typeof value === "number" ? value : Number(value);
}

export function serializeService<T extends Service>(service: T) {
  return {
    ...service,
    basePrice: decimalToNumber(service.basePrice),
  };
}

export function serializeBooking<T extends BookingLike>(
  booking: T,
): Omit<T, "totalAmount" | "service"> & {
  totalAmount: number;
  service?: (ServiceLike & { basePrice: number }) | null;
  assignedStaff?: {
    id: string;
    email: string;
    fullName: string | null;
    role: string;
    isActive: boolean;
  } | null;
} {
  const { service, totalAmount, assignedStaff, ...rest } = booking;

  return {
    ...rest,
    totalAmount: decimalToNumber(totalAmount),
    ...(service !== undefined
      ? {
          service: service
            ? {
                ...service,
                basePrice: decimalToNumber(service.basePrice),
              }
            : service,
        }
      : {}),
    ...(assignedStaff !== undefined
      ? {
          assignedStaff,
        }
      : {}),
  } as Omit<T, "totalAmount" | "service"> & {
    totalAmount: number;
    service?: (ServiceLike & { basePrice: number }) | null;
    assignedStaff?: {
      id: string;
      email: string;
      fullName: string | null;
      role: string;
      isActive: boolean;
    } | null;
  };
}

export function serializeBookingSummary(summary: BookingSummary) {
  return {
    id: summary.id,
    summary: summary.summary,
    model: summary.model,
    tokens: summary.tokens,
    createdAt: summary.createdAt,
  };
}
