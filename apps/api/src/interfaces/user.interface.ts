import type { UserRole } from "@prisma/client";

export interface CreateUserDto {
  email: string;
  fullName: string;
  passwordHash: string;
  role: UserRole;
  isActive?: boolean;
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
}

export interface AuthUserResponse extends UserResponse {
  passwordHash: string;
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
  findMany(params: PaginationParams): Promise<PaginatedResponse<UserResponse>>;
  findManyWithSearch(
    params: UserSearchParams,
  ): Promise<PaginatedResponse<UserResponse>>;
  findById(id: string): Promise<UserResponse | null>;
  findByEmail(email: string): Promise<UserResponse | null>;
  findAuthByEmail(email: string): Promise<AuthUserResponse | null>;
  create(data: CreateUserDto): Promise<UserResponse>;
  update(id: string, data: UpdateUserDto): Promise<UserResponse>;
  delete(id: string): Promise<void>;
  restore(id: string): Promise<UserResponse>;
  findActiveByRoles(roles: UserRole[]): Promise<UserResponse[]>;
}
