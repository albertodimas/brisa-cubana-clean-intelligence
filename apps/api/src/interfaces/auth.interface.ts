import type { UserRole } from "@prisma/client";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
}

export interface IAuthService {
  login(credentials: LoginCredentials): Promise<AuthTokens>;
  logout(userId: string): Promise<void>;
  getCurrentUser(userId: string): Promise<AuthenticatedUser | null>;
  verifyPassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean>;
}
