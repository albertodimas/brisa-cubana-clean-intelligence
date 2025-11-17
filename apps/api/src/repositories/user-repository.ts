import type { Prisma, PrismaClient, UserRole } from "@prisma/client";
import type {
  AuthUserResponse,
  CreateUserDto,
  IUserRepository,
  PaginatedResponse,
  PaginationParams,
  TenantMembershipResponse,
  UpdateUserDto,
  UserResponse,
  UserSearchParams,
} from "../interfaces/user.interface.js";

const DEFAULT_TENANT_ID =
  process.env.DEFAULT_TENANT_ID ?? "tenant_brisa_cubana";

const tenantMembershipSelect = {
  tenantId: true,
  role: true,
  tenant: {
    select: {
      slug: true,
      name: true,
      status: true,
    },
  },
} as const;

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

const defaultSelectWithTenants = {
  ...defaultSelect,
  tenants: {
    select: tenantMembershipSelect,
  },
} as const;

const authSelect = {
  ...defaultSelectWithTenants,
  passwordHash: true,
} as const;

type PrismaUserWithTenants = Prisma.UserGetPayload<{
  select: typeof defaultSelectWithTenants;
}>;

function normalizeMemberships(
  memberships: Prisma.UserTenantGetPayload<{
    select: typeof tenantMembershipSelect;
  }>[],
): TenantMembershipResponse[] {
  return memberships.map((membership) => ({
    tenantId: membership.tenantId,
    tenantSlug: membership.tenant?.slug ?? "",
    tenantName: membership.tenant?.name ?? "",
    status: membership.tenant?.status ?? "ACTIVE",
    role: membership.role,
  }));
}

function resolveRoleForTenant(
  memberships: TenantMembershipResponse[],
  fallbackRole: UserRole,
  tenantId?: string,
): UserRole {
  if (!memberships.length) {
    return fallbackRole;
  }

  if (tenantId) {
    const match = memberships.find(
      (membership) => membership.tenantId === tenantId,
    );
    if (match) {
      return match.role;
    }
  }

  return memberships[0]?.role ?? fallbackRole;
}

function appendTenantCondition(
  where: Prisma.UserWhereInput = {},
  tenantId?: string,
): Prisma.UserWhereInput {
  if (!tenantId) {
    return where;
  }

  const existingConditions = Array.isArray(where.AND)
    ? where.AND
    : where.AND
      ? [where.AND]
      : [];

  return {
    ...where,
    AND: [
      ...existingConditions,
      {
        tenants: {
          some: { tenantId },
        },
      },
    ],
  } satisfies Prisma.UserWhereInput;
}

export class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toUserResponse(
    user: PrismaUserWithTenants,
    tenantId?: string,
  ): UserResponse {
    const memberships = normalizeMemberships(user.tenants ?? []);
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      role: resolveRoleForTenant(memberships, user.role, tenantId),
      tenants: memberships,
    } satisfies UserResponse;
  }

  async findMany(
    { limit = 50, cursor }: PaginationParams = {},
    tenantId?: string,
  ) {
    const scopedTenantId = tenantId ?? DEFAULT_TENANT_ID;
    const take = limit + 1;

    const users = await this.prisma.user.findMany({
      where: appendTenantCondition({}, scopedTenantId),
      take,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: defaultSelectWithTenants,
    });

    const hasMore = users.length > limit;
    const data = hasMore ? users.slice(0, limit) : users;
    const nextCursor = hasMore ? (data[data.length - 1]?.id ?? null) : null;

    return {
      data: data.map((user) => this.toUserResponse(user, scopedTenantId)),
      pagination: {
        limit,
        cursor: cursor ?? null,
        nextCursor,
        hasMore,
      },
    } satisfies PaginatedResponse<UserResponse>;
  }

  async findById(id: string, tenantId?: string) {
    const scopedTenantId = tenantId ?? DEFAULT_TENANT_ID;
    const where = tenantId
      ? appendTenantCondition({ id }, scopedTenantId)
      : { id };
    const user = await this.prisma.user.findFirst({
      where,
      select: defaultSelectWithTenants,
    });
    return user ? this.toUserResponse(user, scopedTenantId) : null;
  }

  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: defaultSelectWithTenants,
    });
    return user ? this.toUserResponse(user) : null;
  }

  async findAuthByEmail(email: string): Promise<AuthUserResponse | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: authSelect,
    });

    if (!user) {
      return null;
    }

    const { passwordHash, ...rest } = user;
    const normalized = normalizeMemberships(rest.tenants ?? []);

    return {
      ...this.toUserResponse(rest, undefined),
      passwordHash,
      tenants: normalized,
    } satisfies AuthUserResponse;
  }

  async create(data: CreateUserDto) {
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        fullName: data.fullName,
        role: data.role,
        isActive: data.isActive ?? true,
        passwordHash: data.passwordHash,
        tenants: {
          create: {
            tenantId: data.tenantId,
            role: data.role,
          },
        },
      },
      select: defaultSelectWithTenants,
    });

    return this.toUserResponse(user, data.tenantId);
  }

  async update(id: string, data: UpdateUserDto, tenantId?: string) {
    const scopedTenantId = tenantId ?? DEFAULT_TENANT_ID;
    const updateData: Prisma.UserUpdateInput = {
      ...("fullName" in data ? { fullName: data.fullName } : {}),
      ...("role" in data ? { role: data.role as UserRole } : {}),
      ...("isActive" in data ? { isActive: data.isActive } : {}),
      ...(data.passwordHash ? { passwordHash: data.passwordHash } : {}),
    };

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: defaultSelectWithTenants,
    });

    if (data.role) {
      await this.prisma.userTenant.updateMany({
        where: {
          userId: id,
          tenantId: scopedTenantId,
        },
        data: { role: data.role as UserRole },
      });
    }

    return this.toUserResponse(user, scopedTenantId);
  }

  async delete(id: string) {
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async restore(id: string, tenantId?: string) {
    const scopedTenantId = tenantId ?? DEFAULT_TENANT_ID;
    const user = await this.prisma.user.update({
      where: { id },
      data: { deletedAt: null },
      select: defaultSelectWithTenants,
    });

    return this.toUserResponse(user, scopedTenantId);
  }

  async findManyWithSearch(
    { search, role, isActive, limit = 50, cursor }: UserSearchParams,
    tenantId?: string,
  ): Promise<PaginatedResponse<UserResponse>> {
    const take = limit + 1;

    const scopedTenantId = tenantId ?? DEFAULT_TENANT_ID;
    const where: Prisma.UserWhereInput = appendTenantCondition(
      {},
      scopedTenantId,
    );

    if (role) {
      where.role = role;
    }

    if (typeof isActive === "boolean") {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { fullName: { contains: search, mode: "insensitive" } },
      ];
    }

    const users = await this.prisma.user.findMany({
      where,
      take,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: defaultSelectWithTenants,
    });

    const hasMore = users.length > limit;
    const data = hasMore ? users.slice(0, limit) : users;
    const nextCursor = hasMore ? (data[data.length - 1]?.id ?? null) : null;

    return {
      data: data.map((user) => this.toUserResponse(user, scopedTenantId)),
      pagination: {
        limit,
        cursor: cursor ?? null,
        nextCursor,
        hasMore,
      },
    } satisfies PaginatedResponse<UserResponse>;
  }

  async findActiveByRoles(
    roles: UserRole[],
    tenantId?: string,
  ): Promise<UserResponse[]> {
    if (roles.length === 0) {
      return [];
    }

    const scopedTenantId = tenantId ?? DEFAULT_TENANT_ID;
    const users = await this.prisma.user.findMany({
      where: appendTenantCondition(
        {
          role: { in: roles },
          isActive: true,
          deletedAt: null,
        },
        scopedTenantId,
      ),
      orderBy: [{ fullName: "asc" }, { email: "asc" }],
      select: defaultSelectWithTenants,
    });

    return users.map((user) => this.toUserResponse(user, scopedTenantId));
  }
}
