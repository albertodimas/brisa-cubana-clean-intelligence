import type { Prisma, PrismaClient } from "@prisma/client";
import type {
  CustomerPagination,
  CustomerPaginationParams,
  CustomerSearchParams,
  CustomerResponse,
  ICustomerRepository,
} from "../interfaces/customer.interface.js";

export class CustomerRepository implements ICustomerRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findMany({ limit = 50, cursor }: CustomerPaginationParams = {}) {
    const take = limit + 1;

    const customers = await this.prisma.user.findMany({
      where: { role: "CLIENT" },
      take,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: {
        id: true,
        email: true,
        fullName: true,
      },
    });

    const hasMore = customers.length > limit;
    const data = hasMore ? customers.slice(0, limit) : customers;
    const nextCursor = hasMore ? (data[data.length - 1]?.id ?? null) : null;

    return {
      data,
      pagination: {
        limit,
        cursor: cursor ?? null,
        nextCursor,
        hasMore,
      },
    } satisfies { data: CustomerResponse[]; pagination: CustomerPagination };
  }

  async findManyWithSearch({
    search,
    limit = 50,
    cursor,
  }: CustomerSearchParams = {}): Promise<{
    data: CustomerResponse[];
    pagination: CustomerPagination;
  }> {
    const take = limit + 1;

    const where: Prisma.UserWhereInput = { role: "CLIENT" };

    if (search) {
      where.AND = [
        {
          OR: [
            { fullName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        },
      ];
    }

    const customers = await this.prisma.user.findMany({
      where,
      take,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: {
        id: true,
        email: true,
        fullName: true,
      },
    });

    const hasMore = customers.length > limit;
    const data = hasMore ? customers.slice(0, limit) : customers;
    const nextCursor = hasMore ? (data[data.length - 1]?.id ?? null) : null;

    return {
      data,
      pagination: {
        limit,
        cursor: cursor ?? null,
        nextCursor,
        hasMore,
      },
    } satisfies { data: CustomerResponse[]; pagination: CustomerPagination };
  }

  async findById(id: string): Promise<CustomerResponse | null> {
    const customer = await this.prisma.user.findUnique({
      where: { id, role: "CLIENT" },
      select: {
        id: true,
        email: true,
        fullName: true,
      },
    });

    return customer;
  }
}
