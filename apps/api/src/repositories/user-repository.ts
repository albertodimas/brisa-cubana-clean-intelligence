import type { Prisma, PrismaClient, UserRole } from "@prisma/client";
import type {
  AuthUserResponse,
  CreateUserDto,
  IUserRepository,
  PaginatedResponse,
  PaginationParams,
  UpdateUserDto,
  UserResponse,
} from "../interfaces/user.interface.js";

type UserSelect = {
  id: true;
  email: true;
  fullName: true;
  role: true;
  isActive: true;
  createdAt: true;
  updatedAt: true;
};

const defaultSelect: UserSelect = {
  id: true,
  email: true,
  fullName: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

const authSelect: UserSelect & { passwordHash: true } = {
  ...defaultSelect,
  passwordHash: true,
};

export class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findMany({ limit = 50, cursor }: PaginationParams = {}) {
    const take = limit + 1;

    const users = await this.prisma.user.findMany({
      take,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: defaultSelect,
    });

    const hasMore = users.length > limit;
    const data = hasMore ? users.slice(0, limit) : users;
    const nextCursor = hasMore ? (data[data.length - 1]?.id ?? null) : null;

    return {
      data,
      pagination: {
        limit,
        cursor: cursor ?? null,
        nextCursor,
        hasMore,
      },
    } satisfies PaginatedResponse<UserResponse>;
  }

  async findById(id: string) {
    return await this.prisma.user.findUnique({
      where: { id },
      select: defaultSelect,
    });
  }

  async findByEmail(email: string) {
    return await this.prisma.user.findUnique({
      where: { email },
      select: defaultSelect,
    });
  }

  async findAuthByEmail(email: string): Promise<AuthUserResponse | null> {
    return await this.prisma.user.findUnique({
      where: { email },
      select: authSelect,
    });
  }

  async create(data: CreateUserDto) {
    return await this.prisma.user.create({
      data: {
        email: data.email,
        fullName: data.fullName,
        role: data.role,
        isActive: data.isActive ?? true,
        passwordHash: data.passwordHash,
      },
      select: defaultSelect,
    });
  }

  async update(id: string, data: UpdateUserDto) {
    const updateData: Prisma.UserUpdateInput = {
      ...("fullName" in data ? { fullName: data.fullName } : {}),
      ...("role" in data ? { role: data.role as UserRole } : {}),
      ...("isActive" in data ? { isActive: data.isActive } : {}),
      ...("passwordHash" in data ? { passwordHash: data.passwordHash } : {}),
    };

    return await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: defaultSelect,
    });
  }

  async delete(id: string) {
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async restore(id: string) {
    return await this.prisma.user.update({
      where: { id },
      data: { deletedAt: null },
      select: defaultSelect,
    });
  }
}
