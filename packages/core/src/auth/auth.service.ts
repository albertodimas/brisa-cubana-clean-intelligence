import type {
  AuthService,
  AuthTokenIssuer,
  AuthUserRecord,
  AuthUserRepository,
  PasswordComparer,
  PasswordHasher,
  PublicAuthUser,
  RegisterResult,
  RequestPasswordResetResult,
  ResendVerificationResult,
  ResetPasswordResult,
  UserRole,
  VerificationService,
  VerificationSummary,
  VerifyRegistrationResult,
  VerificationCodeRecord,
} from "./types.js";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function sanitizeUser(user: AuthUserRecord): PublicAuthUser {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName ?? null,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function toVerificationSummary(
  record: VerificationCodeRecord,
): VerificationSummary {
  return {
    code: record.code,
    expiresAt: record.expiresAt,
  };
}

export interface AuthServiceOptions {
  users: AuthUserRepository;
  verification: VerificationService;
  passwordHasher: PasswordHasher;
  passwordComparer: PasswordComparer;
  tokenIssuer: AuthTokenIssuer;
  defaultRole?: UserRole;
}

export function createAuthService(options: AuthServiceOptions): AuthService {
  const {
    users,
    verification,
    passwordHasher,
    passwordComparer,
    tokenIssuer,
    defaultRole = "CLIENT",
  } = options;

  return {
    async login({ email, password }) {
      const normalizedEmail = normalizeEmail(email);
      const user = await users.findByEmail(normalizedEmail);
      if (!user) {
        return { status: "invalid-credentials" } as const;
      }

      if (!user.isActive) {
        return { status: "inactive" } as const;
      }

      const valid = await passwordComparer(password, user.passwordHash);
      if (!valid) {
        return { status: "invalid-credentials" } as const;
      }

      const token = await Promise.resolve(tokenIssuer(user));
      return {
        status: "success" as const,
        token,
        user: sanitizeUser(user),
      };
    },

    async register({
      email,
      fullName,
      password,
      role,
    }): Promise<RegisterResult> {
      const normalizedEmail = normalizeEmail(email);
      const existing = await users.findByEmail(normalizedEmail);

      if (existing && existing.isActive) {
        return {
          status: "already-active",
          user: sanitizeUser(existing),
        };
      }

      const passwordHash = await passwordHasher(password);
      let targetRole: UserRole = role ?? defaultRole;
      if (!role && existing) {
        targetRole = existing.role;
      }

      let user: AuthUserRecord;
      if (existing) {
        user = await users.updateUser(existing.id, {
          fullName: fullName ?? existing.fullName ?? null,
          passwordHash,
          role: targetRole,
          isActive: false,
        });
      } else {
        user = await users.createUser({
          email: normalizedEmail,
          fullName: fullName ?? null,
          passwordHash,
          role: targetRole,
          isActive: false,
        });
      }

      const issue = await verification.generate({
        email: normalizedEmail,
        kind: "register",
      });

      return {
        status: "pending-verification",
        user: sanitizeUser(user),
        verification: toVerificationSummary(issue.record),
      };
    },

    async verifyRegistration({
      email,
      code,
    }): Promise<VerifyRegistrationResult> {
      const normalizedEmail = normalizeEmail(email);
      const user = await users.findByEmail(normalizedEmail);
      if (!user) {
        return { status: "not-found" };
      }

      if (user.isActive) {
        return {
          status: "already-active",
          user: sanitizeUser(user),
        };
      }

      const consumed = await verification.consume({
        email: normalizedEmail,
        code,
        kind: "register",
      });

      if (consumed.status === "not_found") {
        return { status: "invalid-code" };
      }

      if (consumed.status === "expired") {
        return { status: "expired-code" };
      }

      const activated = await users.updateUser(user.id, { isActive: true });
      return {
        status: "verified",
        user: sanitizeUser(activated),
      };
    },

    async resendVerification({ email }): Promise<ResendVerificationResult> {
      const normalizedEmail = normalizeEmail(email);
      const user = await users.findByEmail(normalizedEmail);
      if (!user) {
        return { status: "not-found" };
      }

      if (user.isActive) {
        return {
          status: "already-active",
          user: sanitizeUser(user),
        };
      }

      const issue = await verification.generate({
        email: normalizedEmail,
        kind: "register",
      });

      return {
        status: "sent",
        user: sanitizeUser(user),
        verification: toVerificationSummary(issue.record),
      };
    },

    async requestPasswordReset({ email }): Promise<RequestPasswordResetResult> {
      const normalizedEmail = normalizeEmail(email);
      const user = await users.findByEmail(normalizedEmail);

      if (!user) {
        // Avoid leaking existence of user accounts
        return { status: "sent" };
      }

      const issue = await verification.generate({
        email: normalizedEmail,
        kind: "reset-password",
      });

      return {
        status: "sent",
        user: sanitizeUser(user),
        verification: toVerificationSummary(issue.record),
      };
    },

    async resetPassword({
      email,
      code,
      newPassword,
    }): Promise<ResetPasswordResult> {
      const normalizedEmail = normalizeEmail(email);
      const user = await users.findByEmail(normalizedEmail);
      if (!user) {
        return { status: "not-found" };
      }

      const consumed = await verification.consume({
        email: normalizedEmail,
        code,
        kind: "reset-password",
      });

      if (consumed.status === "not_found") {
        return { status: "invalid-code" };
      }

      if (consumed.status === "expired") {
        return { status: "expired-code" };
      }

      const passwordHash = await passwordHasher(newPassword);
      const updated = await users.updateUser(user.id, { passwordHash });

      return {
        status: "reset",
        user: sanitizeUser(updated),
      };
    },
  } satisfies AuthService;
}
