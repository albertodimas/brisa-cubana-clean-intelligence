import {
  describe,
  beforeAll,
  afterAll,
  beforeEach,
  it,
  expect,
  vi,
} from "vitest";
import type { Hono } from "hono";
import { createHash } from "node:crypto";
import { sendPortalMagicLinkEmail } from "../services/magic-link-mailer.js";

vi.mock("../services/magic-link-mailer.js", () => {
  const sendPortalMagicLinkEmail = vi.fn(async () => ({
    delivered: true,
    messageId: "test-message",
  }));

  return {
    sendPortalMagicLinkEmail,
    shouldExposeDebugToken: () => true,
  };
});

type MagicLinkRecord = {
  id: string;
  email: string;
  tokenHash: string;
  expiresAt: Date;
  consumedAt: Date | null;
  createdAt: Date;
};

function jsonResponse<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

describe("Portal auth routes", () => {
  let app: Hono;
  const magicLinkTokens: MagicLinkRecord[] = [];
  const sendPortalMagicLinkEmailMock = vi.mocked(sendPortalMagicLinkEmail);

  type MockUser = {
    id: string;
    email: string;
    isActive: boolean;
    role: string;
  };

  const userRepositoryMock = {
    findByEmail: vi.fn<(email: string) => Promise<MockUser | null>>(),
  };

  const magicLinkRepositoryMock = {
    create: vi.fn(
      async (data: { email: string; tokenHash: string; expiresAt: Date }) => {
        const record: MagicLinkRecord = {
          id: `ml_${magicLinkTokens.length + 1}`,
          email: data.email,
          tokenHash: data.tokenHash,
          expiresAt: data.expiresAt,
          consumedAt: null,
          createdAt: new Date(),
        };
        magicLinkTokens.push(record);
        return record;
      },
    ),
    findValidByHash: vi.fn(async (tokenHash: string) => {
      const now = new Date();
      return (
        magicLinkTokens.find(
          (token) =>
            token.tokenHash === tokenHash &&
            token.consumedAt === null &&
            token.expiresAt > now,
        ) ?? null
      );
    }),
    consume: vi.fn(async (id: string) => {
      const record = magicLinkTokens.find((token) => token.id === id);
      if (record) {
        record.consumedAt = new Date();
      }
      return record ?? null;
    }),
    invalidateExpiredForEmail: vi.fn(async (email: string) => {
      const now = new Date();
      magicLinkTokens.forEach((token) => {
        if (
          token.email === email &&
          token.consumedAt === null &&
          token.expiresAt < now
        ) {
          token.consumedAt = now;
        }
      });
    }),
  };

  let getUserRepositorySpy: ReturnType<typeof vi.spyOn>;
  let getMagicLinkRepositorySpy: ReturnType<typeof vi.spyOn>;

  beforeAll(async () => {
    process.env.JWT_SECRET = "test-secret";
    process.env.MAGIC_LINK_TTL_MINUTES = "30";
    process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
    process.env.DATABASE_URL_UNPOOLED =
      "postgresql://test:test@localhost:5432/test";

    vi.resetModules();
    const containerModule = await import("../container.js");
    getUserRepositorySpy = vi
      .spyOn(containerModule, "getUserRepository")
      .mockReturnValue(userRepositoryMock as any);
    getMagicLinkRepositorySpy = vi
      .spyOn(containerModule, "getMagicLinkTokenRepository")
      .mockReturnValue(magicLinkRepositoryMock as any);

    app = (await import("../app.js")).default;
  });

  afterAll(() => {
    getUserRepositorySpy.mockRestore();
    getMagicLinkRepositorySpy.mockRestore();
    delete process.env.JWT_SECRET;
    delete process.env.MAGIC_LINK_TTL_MINUTES;
    delete process.env.DATABASE_URL;
    delete process.env.DATABASE_URL_UNPOOLED;
  });

  beforeEach(() => {
    magicLinkTokens.length = 0;
    userRepositoryMock.findByEmail.mockReset();
    magicLinkRepositoryMock.create.mockClear();
    magicLinkRepositoryMock.findValidByHash.mockClear();
    magicLinkRepositoryMock.consume.mockClear();
    magicLinkRepositoryMock.invalidateExpiredForEmail.mockClear();
    sendPortalMagicLinkEmailMock.mockClear();
    userRepositoryMock.findByEmail.mockResolvedValue({
      id: "user-1",
      email: "client@portal.test",
      isActive: true,
      role: "CLIENT",
    });
  });

  it("retorna mensaje genérico para correos desconocidos", async () => {
    userRepositoryMock.findByEmail.mockResolvedValueOnce(null);

    const response = await app.request("/api/portal/auth/request", {
      method: "POST",
      body: JSON.stringify({ email: "unknown@test.com" }),
      headers: { "content-type": "application/json" },
    });

    expect(response.status).toBe(200);
    const body = await jsonResponse<{ message: string }>(response);
    expect(body.message).toMatch(/recibirás un enlace/i);
    expect(magicLinkRepositoryMock.create).not.toHaveBeenCalled();
    expect(sendPortalMagicLinkEmailMock).not.toHaveBeenCalled();
  });

  it("genera token debug y permite verificarlo una vez", async () => {
    const response = await app.request("/api/portal/auth/request", {
      method: "POST",
      body: JSON.stringify({ email: "client@portal.test" }),
      headers: { "content-type": "application/json" },
    });

    expect(response.status).toBe(200);
    const body = await jsonResponse<{ debugToken?: string }>(response);
    expect(body.debugToken).toBeDefined();
    expect(magicLinkRepositoryMock.create).toHaveBeenCalledTimes(1);
    expect(sendPortalMagicLinkEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "client@portal.test",
      }),
    );

    if (!body.debugToken) {
      throw new Error("Expected debug token in response");
    }

    const verifyResponse = await app.request("/api/portal/auth/verify", {
      method: "POST",
      body: JSON.stringify({ token: body.debugToken }),
      headers: { "content-type": "application/json" },
    });

    expect(verifyResponse.status).toBe(200);
    const verifyBody = await jsonResponse<{
      data?: {
        portalToken: string;
        email: string;
        customerId: string;
        expiresAt: string;
      };
    }>(verifyResponse);
    expect(verifyBody.data?.portalToken).toBeDefined();
    expect(verifyBody.data?.email).toBe("client@portal.test");
    expect(verifyBody.data?.customerId).toBe("user-1");
    expect(verifyBody.data?.expiresAt).toMatch(/\d{4}-\d{2}-\d{2}T/);

    expect(userRepositoryMock.findByEmail).toHaveBeenCalledWith(
      "client@portal.test",
    );

    // Reutilizar el token debe fallar (token consumido)
    const secondVerify = await app.request("/api/portal/auth/verify", {
      method: "POST",
      body: JSON.stringify({ token: body.debugToken }),
      headers: { "content-type": "application/json" },
    });

    expect(secondVerify.status).toBe(400);
  });

  it("rechaza token expirado", async () => {
    const expiredHash = createHash("sha256")
      .update("expired-token")
      .digest("hex");
    magicLinkTokens.push({
      id: "ml_expired",
      email: "client@portal.test",
      tokenHash: expiredHash,
      expiresAt: new Date(Date.now() - 60_000),
      consumedAt: null,
      createdAt: new Date(Date.now() - 120_000),
    });

    const response = await app.request("/api/portal/auth/verify", {
      method: "POST",
      body: JSON.stringify({ token: "expired-token" }),
      headers: { "content-type": "application/json" },
    });

    expect(response.status).toBe(400);
  });
});
