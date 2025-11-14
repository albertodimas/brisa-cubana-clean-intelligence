import type { TenantStatus, UserRole } from "@prisma/client";

export interface TenantMembershipResponse {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  status: TenantStatus;
  role: UserRole;
}

export interface CreateUserDto {
  email: string;
  fullName: string;
  passwordHash: string;
  role: UserRole;
  isActive?: boolean;
  tenantId: string;
}

export interface UpdateUserDto {
  fullName?: string;
  passwordHash?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface UserResponse {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  tenants?: TenantMembershipResponse[];
}

export interface AuthUserResponse extends UserResponse {
  passwordHash: string;
  tenants: TenantMembershipResponse[];
}

export interface PaginationParams {
  limit?: number;
  cursor?: string;
}

export interface UserSearchParams extends PaginationParams {
  search?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface PaginationMeta {
  limit: number;
  cursor: string | null;
  nextCursor: string | null;
  hasMore: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface IUserRepository {
  findMany(
    params: PaginationParams,
    tenantId?: string,
  ): Promise<PaginatedResponse<UserResponse>>;
  findManyWithSearch(
    params: UserSearchParams,
    tenantId?: string,
  ): Promise<PaginatedResponse<UserResponse>>;
  findById(id: string, tenantId?: string): Promise<UserResponse | null>;
  findByEmail(email: string): Promise<UserResponse | null>;
  findAuthByEmail(email: string): Promise<AuthUserResponse | null>;
  create(data: CreateUserDto): Promise<UserResponse>;
  update(
    id: string,
    data: UpdateUserDto,
    tenantId?: string,
  ): Promise<UserResponse>;
  delete(id: string): Promise<void>;
  restore(id: string, tenantId?: string): Promise<UserResponse>;
  findActiveByRoles(
    roles: UserRole[],
    tenantId?: string,
  ): Promise<UserResponse[]>;
}
