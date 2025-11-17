import {
  describe,
  beforeAll,
  afterAll,
  beforeEach,
  it,
  expect,
  vi,
} from "vitest";
import * as bcrypt from "bcryptjs";
import type { Hono } from "hono";
import { hashToken } from "../../../src/lib/token-hash.js";

type MockUser = {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  passwordHash: string;
  tenants?: Array<{
    tenantId: string;
    tenantSlug: string;
    tenantName?: string;
    status?: string;
    role: string;
  }>;
};

type MockSession = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
};

describe("Auth routes", () => {
  let app: Hono;
  const sessions: MockSession[] = [];
  const TEST_TENANT_ID = "tenant_test";
  const TEST_TENANT_SLUG = "tenant-test";
  const TEST_TENANT_NAME = "Tenant Test";

  const userRepositoryMock = {
    findAuthByEmail: vi.fn<(email: string) => Promise<MockUser | null>>(),
    findById: vi.fn<(id: string) => Promise<MockUser | null>>(),
  };

  const userSessionRepositoryMock = {
    create: vi.fn(
      async (data: { userId: string; tokenHash: string; expiresAt: Date }) => {
        const record: MockSession = {
          id: `session_${sessions.length + 1}`,
          userId: data.userId,
          tokenHash: data.tokenHash,
          expiresAt: data.expiresAt,
          revokedAt: null,
        };
        sessions.push(record);
        return record as any;
      },
    ),
    findValidByTokenHash: vi.fn(async (tokenHash: string) => {
      const now = new Date();
      return (
        sessions.find(
          (session) =>
            session.tokenHash === tokenHash &&
            session.revokedAt === null &&
            session.expiresAt > now,
        ) ?? null
      );
    }),
    revokeById: vi.fn(async (id: string) => {
      const session = sessions.find((entry) => entry.id === id);
      if (session) {
        session.revokedAt = new Date();
      }
      return session ?? null;
    }),
    revokeByTokenHash: vi.fn(async (tokenHash: string) => {
      sessions.forEach((session) => {
        if (session.tokenHash === tokenHash && session.revokedAt === null) {
          session.revokedAt = new Date();
        }
      });
    }),
    revokeAllForUser: vi.fn(async (userId: string) => {
      sessions.forEach((session) => {
        if (session.userId === userId && session.revokedAt === null) {
          session.revokedAt = new Date();
        }
      });
    }),
  };

  let getUserRepositorySpy: ReturnType<typeof vi.spyOn>;
  let getUserSessionRepositorySpy: ReturnType<typeof vi.spyOn>;
  let passwordHash: string;

  beforeAll(async () => {
    process.env.JWT_SECRET = "test-secret";
    process.env.AUTH_ACCESS_TOKEN_TTL_SECONDS = "60";
    process.env.AUTH_REFRESH_TOKEN_TTL_DAYS = "7";
    process.env.DEFAULT_TENANT_ID = TEST_TENANT_ID;
    process.env.DEFAULT_TENANT_SLUG = TEST_TENANT_SLUG;
    passwordHash = await bcrypt.hash("Test1234!", 8);

    vi.resetModules();
    const containerModule = await import("../../../src/container.js");
    getUserRepositorySpy = vi
      .spyOn(containerModule, "getUserRepository")
      .mockReturnValue(userRepositoryMock as any);
    getUserSessionRepositorySpy = vi
      .spyOn(containerModule, "getUserSessionRepository")
      .mockReturnValue(userSessionRepositoryMock as any);

    app = (await import("../../../src/app.js")).default;
  });

  afterAll(() => {
    getUserRepositorySpy.mockRestore();
    getUserSessionRepositorySpy.mockRestore();
    delete process.env.JWT_SECRET;
    delete process.env.AUTH_ACCESS_TOKEN_TTL_SECONDS;
    delete process.env.AUTH_REFRESH_TOKEN_TTL_DAYS;
    delete process.env.DEFAULT_TENANT_ID;
    delete process.env.DEFAULT_TENANT_SLUG;
  });

  beforeEach(() => {
    sessions.length = 0;
    vi.clearAllMocks();
    const tenantMembership = [
      {
        tenantId: TEST_TENANT_ID,
        tenantSlug: TEST_TENANT_SLUG,
        tenantName: TEST_TENANT_NAME,
        status: "ACTIVE",
        role: "ADMIN",
      },
    ];
    userRepositoryMock.findAuthByEmail.mockResolvedValue({
      id: "user-1",
      email: "admin@test.com",
      role: "ADMIN",
      isActive: true,
      passwordHash,
      tenants: tenantMembership,
    });
    userRepositoryMock.findById.mockResolvedValue({
      id: "user-1",
      email: "admin@test.com",
      role: "ADMIN",
      isActive: true,
      passwordHash,
      tenants: tenantMembership,
    });
  });

  it("returns refresh token on login and allows rotating tokens", async () => {
    const loginResponse = await app.request("/api/authentication/login", {
      method: "POST",
      body: JSON.stringify({ email: "admin@test.com", password: "Test1234!" }),
      headers: { "content-type": "application/json" },
    });

    expect(loginResponse.status).toBe(200);
    const loginBody = (await loginResponse.json()) as {
      token: string;
      refreshToken: string;
    };
    expect(loginBody.token).toBeTruthy();
    expect(loginBody.refreshToken).toBeTruthy();
    expect(userSessionRepositoryMock.create).toHaveBeenCalledTimes(1);

    const refreshResponse = await app.request("/api/authentication/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken: loginBody.refreshToken }),
      headers: { "content-type": "application/json" },
    });

    expect(refreshResponse.status).toBe(200);
    const refreshBody = (await refreshResponse.json()) as {
      token: string;
      refreshToken: string;
    };
    expect(refreshBody.token).toBeTruthy();
    expect(refreshBody.refreshToken).not.toBe(loginBody.refreshToken);
    expect(userSessionRepositoryMock.revokeById).toHaveBeenCalled();
  });

  it("rejects invalid refresh tokens", async () => {
    const response = await app.request("/api/authentication/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken: "invalid" }),
      headers: { "content-type": "application/json" },
    });

    expect(response.status).toBe(401);
  });
});
