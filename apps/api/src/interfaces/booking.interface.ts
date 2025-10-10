import type { BookingStatus } from "@prisma/client";

export interface CreateBookingDto {
  propertyId: string;
  serviceId: string;
  scheduledDate: Date;
  notes?: string;
}

export interface UpdateBookingDto {
  scheduledDate?: Date;
  status?: BookingStatus;
  notes?: string;
}

export interface BookingFilters {
  status?: BookingStatus;
  from?: Date;
  to?: Date;
  propertyId?: string;
  customerId?: string;
}

export interface BookingResponse {
  id: string;
  propertyId: string;
  serviceId: string;
  customerId: string;
  scheduledDate: Date;
  status: BookingStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBookingRepository {
  findMany(
    filters: BookingFilters,
    pagination: { limit?: number; cursor?: string },
  ): Promise<{
    data: BookingResponse[];
    pagination: {
      limit: number;
      cursor: string | null;
      nextCursor: string | null;
      hasMore: boolean;
    };
  }>;
  findById(id: string): Promise<BookingResponse | null>;
  create(data: CreateBookingDto, customerId: string): Promise<BookingResponse>;
  update(id: string, data: UpdateBookingDto): Promise<BookingResponse>;
  delete(id: string): Promise<void>;
}
