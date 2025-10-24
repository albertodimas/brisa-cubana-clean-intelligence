export type VerificationCodeKind = "register" | "reset-password";

export interface VerificationCodeRecord {
  id: string;
  email: string;
  code: string;
  kind: VerificationCodeKind;
  expiresAt: Date;
  consumedAt: Date | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
}

export interface VerificationCodeCreateInput {
  email: string;
  code: string;
  kind: VerificationCodeKind;
  expiresAt: Date;
  metadata?: Record<string, unknown> | null;
}

export interface VerificationCodeRepository {
  deleteByEmailKind(email: string, kind: VerificationCodeKind): Promise<void>;
  create(input: VerificationCodeCreateInput): Promise<VerificationCodeRecord>;
  findActive(params: {
    email: string;
    code: string;
    kind: VerificationCodeKind;
  }): Promise<VerificationCodeRecord | null>;
  findLatest(params: {
    email: string;
    kind: VerificationCodeKind;
  }): Promise<VerificationCodeRecord | null>;
  markConsumed(id: string): Promise<void>;
}

export type UserRole = "ADMIN" | "COORDINATOR" | "STAFF" | "CLIENT";

export interface AuthUserRecord {
  id: string;
  email: string;
  fullName: string | null;
  role: UserRole;
  passwordHash: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthUserCreateInput {
  email: string;
  fullName?: string | null;
  passwordHash: string;
  role: UserRole;
  isActive?: boolean;
}

export interface AuthUserUpdateInput {
  fullName?: string | null;
  passwordHash?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface AuthUserRepository {
  findByEmail(email: string): Promise<AuthUserRecord | null>;
  createUser(input: AuthUserCreateInput): Promise<AuthUserRecord>;
  updateUser(
    userId: string,
    updates: AuthUserUpdateInput,
  ): Promise<AuthUserRecord>;
}

export type PasswordHasher = (password: string) => Promise<string>;
export type PasswordComparer = (
  password: string,
  passwordHash: string,
) => Promise<boolean>;
export type AuthTokenIssuer = (
  user: AuthUserRecord,
) => Promise<string> | string;
export type VerificationCodeGenerator = () => string;
export type Clock = () => Date;

export interface PublicAuthUser {
  id: string;
  email: string;
  fullName: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface VerificationIssueResult {
  status: "issued";
  record: VerificationCodeRecord;
}

export interface VerificationSummary {
  code?: string;
  expiresAt: Date;
}

export type VerificationVerifyResult =
  | { status: "verified"; record: VerificationCodeRecord }
  | { status: "expired"; record: VerificationCodeRecord }
  | { status: "not_found" };

export type VerificationConsumeResult =
  | { status: "consumed"; record: VerificationCodeRecord }
  | { status: "expired"; record: VerificationCodeRecord }
  | { status: "not_found" };

export interface VerificationService {
  generate(input: {
    email: string;
    kind: VerificationCodeKind;
    ttlMinutes?: number;
    metadata?: Record<string, unknown> | null;
  }): Promise<VerificationIssueResult>;
  verify(input: {
    email: string;
    code: string;
    kind: VerificationCodeKind;
    consume?: boolean;
  }): Promise<VerificationVerifyResult>;
  consume(input: {
    email: string;
    code: string;
    kind: VerificationCodeKind;
  }): Promise<VerificationConsumeResult>;
  getLatest(input: {
    email: string;
    kind: VerificationCodeKind;
  }): Promise<VerificationCodeRecord | null>;
}

export type LoginResult =
  | {
      status: "success";
      token: string;
      user: PublicAuthUser;
    }
  | { status: "invalid-credentials" }
  | { status: "inactive" };

export type RegisterResult =
  | {
      status: "pending-verification";
      user: PublicAuthUser;
      verification: VerificationSummary;
    }
  | { status: "email-taken"; user?: PublicAuthUser }
  | { status: "already-active"; user: PublicAuthUser };

export type VerifyRegistrationResult =
  | { status: "verified"; user: PublicAuthUser }
  | { status: "already-active"; user: PublicAuthUser }
  | { status: "invalid-code" }
  | { status: "expired-code" }
  | { status: "not-found" };

export type ResendVerificationResult =
  | {
      status: "sent";
      user?: PublicAuthUser;
      verification?: VerificationSummary;
    }
  | { status: "already-active"; user: PublicAuthUser }
  | { status: "not-found" };

export type RequestPasswordResetResult = {
  status: "sent";
  user?: PublicAuthUser;
  verification?: VerificationSummary;
};

export type ResetPasswordResult =
  | { status: "reset"; user: PublicAuthUser }
  | { status: "invalid-code" }
  | { status: "expired-code" }
  | { status: "not-found" };

export interface AuthService {
  login(params: { email: string; password: string }): Promise<LoginResult>;
  register(params: {
    email: string;
    fullName?: string | null;
    password: string;
    role?: UserRole;
  }): Promise<RegisterResult>;
  verifyRegistration(params: {
    email: string;
    code: string;
  }): Promise<VerifyRegistrationResult>;
  resendVerification(params: {
    email: string;
  }): Promise<ResendVerificationResult>;
  requestPasswordReset(params: {
    email: string;
  }): Promise<RequestPasswordResetResult>;
  resetPassword(params: {
    email: string;
    code: string;
    newPassword: string;
  }): Promise<ResetPasswordResult>;
}
