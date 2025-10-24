import { describe, it, expect, beforeEach } from "vitest";
import { createAuthService } from "../auth.service.js";
import { createVerificationService } from "../verification.service.js";
import type {
  AuthUserRecord,
  AuthUserRepository,
  VerificationCodeKind,
  VerificationCodeRecord,
  VerificationCodeRepository,
} from "../types.js";

class InMemoryUserRepository implements AuthUserRepository {
  private store: AuthUserRecord[] = [];
  private counter = 1;

  async findByEmail(email: string): Promise<AuthUserRecord | null> {
    const normalized = email.trim().toLowerCase();
    return this.store.find((user) => user.email === normalized) ?? null;
  }

  async createUser(input: {
    email: string;
    fullName?: string | null;
    passwordHash: string;
    role: string;
    isActive?: boolean;
  }): Promise<AuthUserRecord> {
    const now = new Date();
    const record: AuthUserRecord = {
      id: `user_${this.counter++}`,
      email: input.email.trim().toLowerCase(),
      fullName: input.fullName ?? null,
      passwordHash: input.passwordHash,
      role: input.role as AuthUserRecord["role"],
      isActive: input.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    };
    this.store.push(record);
    return record;
  }

  async updateUser(
    id: string,
    updates: {
      fullName?: string | null;
      passwordHash?: string;
      role?: string;
      isActive?: boolean;
    },
  ): Promise<AuthUserRecord> {
    const target = this.store.find((user) => user.id === id);
    if (!target) {
      throw new Error(`User ${id} not found`);
    }
    if (updates.fullName !== undefined) {
      target.fullName = updates.fullName;
    }
    if (updates.passwordHash !== undefined) {
      target.passwordHash = updates.passwordHash;
    }
    if (updates.role !== undefined) {
      target.role = updates.role as AuthUserRecord["role"];
    }
    if (updates.isActive !== undefined) {
      target.isActive = updates.isActive;
    }
    target.updatedAt = new Date();
    return target;
  }
}

class InMemoryVerificationRepository implements VerificationCodeRepository {
  private store: VerificationCodeRecord[] = [];
  private counter = 1;

  async deleteByEmailKind(
    email: string,
    kind: VerificationCodeKind,
  ): Promise<void> {
    this.store = this.store.filter(
      (record) =>
        !(record.email === email && record.kind === kind && !record.consumedAt),
    );
  }

  async create(input: {
    email: string;
    code: string;
    kind: VerificationCodeKind;
    expiresAt: Date;
    metadata?: Record<string, unknown> | null;
  }): Promise<VerificationCodeRecord> {
    const record: VerificationCodeRecord = {
      id: `ver_${this.counter++}`,
      email: input.email,
      code: input.code,
      kind: input.kind,
      expiresAt: input.expiresAt,
      metadata: input.metadata,
      consumedAt: null,
      createdAt: new Date(),
    };
    this.store.push(record);
    return record;
  }

  async findActive(params: {
    email: string;
    code: string;
    kind: VerificationCodeKind;
  }): Promise<VerificationCodeRecord | null> {
    return (
      this.store.find(
        (record) =>
          record.email === params.email &&
          record.kind === params.kind &&
          record.code === params.code &&
          record.consumedAt === null,
      ) ?? null
    );
  }

  async findLatest(params: {
    email: string;
    kind: VerificationCodeKind;
  }): Promise<VerificationCodeRecord | null> {
    return (
      [...this.store]
        .filter(
          (record) =>
            record.email === params.email && record.kind === params.kind,
        )
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0] ??
      null
    );
  }

  async markConsumed(id: string): Promise<void> {
    const target = this.store.find((record) => record.id === id);
    if (target) {
      target.consumedAt = new Date();
    }
  }
}

function sequentialCodes(...codes: string[]) {
  let index = 0;
  return () => {
    const value = codes[index % codes.length];
    index += 1;
    return value;
  };
}

describe("createAuthService", () => {
  let users: InMemoryUserRepository;
  let verificationRepo: InMemoryVerificationRepository;
  let authService: ReturnType<typeof createAuthService>;

  const passwordHasher = async (password: string) => `hash::${password}`;
  const passwordComparer = async (password: string, hash: string) =>
    hash === `hash::${password}`;

  beforeEach(() => {
    users = new InMemoryUserRepository();
    verificationRepo = new InMemoryVerificationRepository();
    const verification = createVerificationService({
      repository: verificationRepo,
      codeGenerator: sequentialCodes("111111", "222222", "333333"),
      clock: () => new Date(2025, 0, 1, 10, 0, 0),
      defaultTtlMinutes: 30,
    });

    authService = createAuthService({
      users,
      verification,
      passwordHasher,
      passwordComparer,
      tokenIssuer: (user) => `token-${user.id}`,
      defaultRole: "CLIENT",
    });
  });

  it("logs in active users with valid credentials", async () => {
    await users.createUser({
      email: "admin@example.com",
      passwordHash: await passwordHasher("Secret123"),
      role: "ADMIN",
      isActive: true,
    });

    const result = await authService.login({
      email: "ADMIN@example.com",
      password: "Secret123",
    });

    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.user.email).toBe("admin@example.com");
      expect(result.token).toMatch(/^token-user_/);
    }
  });

  it("rejects invalid credentials", async () => {
    await users.createUser({
      email: "staff@example.com",
      passwordHash: await passwordHasher("Valid123"),
      role: "STAFF",
      isActive: true,
    });

    const result = await authService.login({
      email: "staff@example.com",
      password: "WrongPass",
    });

    expect(result.status).toBe("invalid-credentials");
  });

  it("prevents inactive users from logging in", async () => {
    await users.createUser({
      email: "pending@example.com",
      passwordHash: await passwordHasher("Valid123"),
      role: "CLIENT",
      isActive: false,
    });

    const result = await authService.login({
      email: "pending@example.com",
      password: "Valid123",
    });

    expect(result.status).toBe("inactive");
  });

  it("registers new users and issues verification codes", async () => {
    const result = await authService.register({
      email: "new@example.com",
      password: "Signup123",
      fullName: "New User",
    });

    expect(result.status).toBe("pending-verification");
    if (result.status === "pending-verification") {
      expect(result.user.email).toBe("new@example.com");
      expect(result.user.isActive).toBe(false);
      expect(result.verification.code).toBe("111111");
    }
  });

  it("returns already-active when email exists and user is active", async () => {
    const existing = await users.createUser({
      email: "existing@example.com",
      passwordHash: await passwordHasher("Secret123"),
      role: "CLIENT",
      isActive: true,
    });

    const result = await authService.register({
      email: existing.email,
      password: "Secret123",
    });

    expect(result.status).toBe("already-active");
  });

  it("updates pending users and reissues verification", async () => {
    const pending = await users.createUser({
      email: "pending@example.com",
      passwordHash: await passwordHasher("OldPass123"),
      role: "CLIENT",
      isActive: false,
    });

    const result = await authService.register({
      email: pending.email,
      password: "NewPass123",
      fullName: "Updated Name",
    });

    expect(result.status).toBe("pending-verification");
    if (result.status === "pending-verification") {
      expect(result.verification.code).toBe("111111");
      const updated = await users.findByEmail(pending.email);
      expect(updated?.passwordHash).toBe("hash::NewPass123");
      expect(updated?.fullName).toBe("Updated Name");
    }
  });

  it("verifies registration codes and activates the account", async () => {
    await authService.register({
      email: "verify@example.com",
      password: "Verify123",
    });

    const verifyResult = await authService.verifyRegistration({
      email: "verify@example.com",
      code: "111111",
    });

    expect(verifyResult.status).toBe("verified");
    if (verifyResult.status === "verified") {
      expect(verifyResult.user.isActive).toBe(true);
    }
  });

  it("rejects invalid verification codes", async () => {
    await authService.register({
      email: "invalid@example.com",
      password: "Verify123",
    });

    const verifyResult = await authService.verifyRegistration({
      email: "invalid@example.com",
      code: "999999",
    });

    expect(verifyResult.status).toBe("invalid-code");
  });

  it("resends verification codes for pending accounts", async () => {
    await authService.register({
      email: "resend@example.com",
      password: "Verify123",
    });
    // first code consumed from generator "111111"

    const resend = await authService.resendVerification({
      email: "resend@example.com",
    });

    expect(resend.status).toBe("sent");
    if (resend.status === "sent") {
      expect(resend.verification).toBeDefined();
      const verification = resend.verification!;
      expect(verification.code).toBe("222222");
    }
  });

  it("returns already-active when resending for active accounts", async () => {
    await users.createUser({
      email: "active@example.com",
      passwordHash: await passwordHasher("Secret123"),
      role: "CLIENT",
      isActive: true,
    });

    const resend = await authService.resendVerification({
      email: "active@example.com",
    });

    expect(resend.status).toBe("already-active");
  });

  it("issues password reset codes without leaking existence", async () => {
    const miss = await authService.requestPasswordReset({
      email: "unknown@example.com",
    });
    expect(miss.status).toBe("sent");
    expect(miss.verification).toBeUndefined();

    await users.createUser({
      email: "reset@example.com",
      passwordHash: await passwordHasher("Secret123"),
      role: "CLIENT",
      isActive: true,
    });

    const hit = await authService.requestPasswordReset({
      email: "reset@example.com",
    });
    expect(hit.status).toBe("sent");
    expect(hit.verification?.code).toBe("111111");
  });

  it("resets passwords when code is valid", async () => {
    await users.createUser({
      email: "recover@example.com",
      passwordHash: await passwordHasher("OldPass123"),
      role: "CLIENT",
      isActive: true,
    });

    const requested = await authService.requestPasswordReset({
      email: "recover@example.com",
    });
    const code = requested.verification?.code ?? "111111";

    const result = await authService.resetPassword({
      email: "recover@example.com",
      code,
      newPassword: "NewPass123",
    });

    expect(result.status).toBe("reset");
    const updated = await users.findByEmail("recover@example.com");
    expect(updated?.passwordHash).toBe("hash::NewPass123");
  });

  it("rejects invalid reset codes", async () => {
    await users.createUser({
      email: "recover2@example.com",
      passwordHash: await passwordHasher("OldPass123"),
      role: "CLIENT",
      isActive: true,
    });

    await authService.requestPasswordReset({ email: "recover2@example.com" });

    const result = await authService.resetPassword({
      email: "recover2@example.com",
      code: "000000",
      newPassword: "NewPass123",
    });

    expect(result.status).toBe("invalid-code");
  });
});
