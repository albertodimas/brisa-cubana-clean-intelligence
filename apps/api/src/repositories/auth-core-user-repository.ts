import type { Prisma, PrismaClient, User } from "@prisma/client";
import type {
  AuthUserCreateInput,
  AuthUserRecord,
  AuthUserRepository,
  AuthUserUpdateInput,
} from "@brisa/core";

function toRecord(user: User): AuthUserRecord {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    passwordHash: user.passwordHash,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  } satisfies AuthUserRecord;
}

export class AuthCoreUserRepository implements AuthUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByEmail(email: string): Promise<AuthUserRecord | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    return user ? toRecord(user) : null;
  }

  async createUser(input: AuthUserCreateInput): Promise<AuthUserRecord> {
    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        fullName: input.fullName ?? input.email,
        passwordHash: input.passwordHash,
        role: input.role,
        isActive: input.isActive ?? true,
      },
    });
    return toRecord(user);
  }

  async updateUser(
    userId: string,
    updates: AuthUserUpdateInput,
  ): Promise<AuthUserRecord> {
    const data: Prisma.UserUpdateInput = {};

    if (updates.fullName !== undefined) {
      data.fullName = updates.fullName ?? undefined;
    }
    if (updates.passwordHash !== undefined) {
      data.passwordHash = updates.passwordHash;
    }
    if (updates.role !== undefined) {
      data.role = updates.role;
    }
    if (updates.isActive !== undefined) {
      data.isActive = updates.isActive;
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    return toRecord(user);
  }
}
