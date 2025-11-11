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
import { sendPortalMagicLinkEmail } from "../../../src/services/magic-link-mailer.js";
import { resetRateLimiterStoresForTests } from "../../../src/lib/rate-limiter.js";

vi.mock("../../../src/services/magic-link-mailer.js", () => {
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

type PortalSessionRecord = {
  id: string;
  email: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  revocationReason?: string | null;
};

function jsonResponse<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

function extractCookies(headers: Headers): string[] {
  const candidate = headers as unknown as {
    getSetCookie?: () => string[];
  };

  if (typeof candidate.getSetCookie === "function") {
    return candidate.getSetCookie() ?? [];
  }

  const cookie = headers.get("set-cookie");
  return cookie ? [cookie] : [];
}

function getCookieValue(cookies: string[], name: string): string | null {
  const prefix = `${name}=`;
  const entry = cookies.find((value) => value.startsWith(prefix));
  if (!entry) {
    return null;
  }
  const [raw] = entry.split(";");
  const [, value] = raw.split("=");
  return value ?? null;
}

describe("Portal auth routes", () => {
  let app: Hono;
  const magicLinkTokens: MagicLinkRecord[] = [];
  const sendPortalMagicLinkEmailMock = vi.mocked(sendPortalMagicLinkEmail);
  const portalSessions: PortalSessionRecord[] = [];

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

  const portalSessionRepositoryMock = {
    create: vi.fn(
      async (data: {
        email: string;
        tokenHash: string;
        expiresAt: Date;
        userAgent?: string | null;
        ipAddress?: string | null;
      }) => {
        const record: PortalSessionRecord = {
          id: `ps_${portalSessions.length + 1}`,
          email: data.email,
          tokenHash: data.tokenHash,
          expiresAt: data.expiresAt,
          revokedAt: null,
        };
        portalSessions.push(record);
        return record;
      },
    ),
    findValidByTokenHash: vi.fn(async (tokenHash: string) => {
      const now = new Date();
      return (
        portalSessions.find(
          (session) =>
            session.tokenHash === tokenHash &&
            session.revokedAt === null &&
            session.expiresAt > now,
        ) ?? null
      );
    }),
    revokeById: vi.fn(async (id: string, reason?: string) => {
      const record = portalSessions.find((session) => session.id === id);
      if (record) {
        record.revokedAt = new Date();
        if (reason) {
          record.revocationReason = reason;
        }
      }
    }),
    revokeByTokenHash: vi.fn(async (tokenHash: string, reason?: string) => {
      portalSessions.forEach((session) => {
        if (session.tokenHash === tokenHash && session.revokedAt === null) {
          session.revokedAt = new Date();
          if (reason) {
            session.revocationReason = reason;
          }
        }
      });
    }),
    revokeAllForEmail: vi.fn(async (email: string, reason?: string) => {
      portalSessions.forEach((session) => {
        if (session.email === email && session.revokedAt === null) {
          session.revokedAt = new Date();
          if (reason) {
            session.revocationReason = reason;
          }
        }
      });
    }),
  };

  let getUserRepositorySpy: ReturnType<typeof vi.spyOn>;
  let getMagicLinkRepositorySpy: ReturnType<typeof vi.spyOn>;
  let getPortalSessionRepositorySpy: ReturnType<typeof vi.spyOn>;

  beforeAll(async () => {
    process.env.JWT_SECRET = "test-secret";
    process.env.MAGIC_LINK_TTL_MINUTES = "30";
    process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
    process.env.DATABASE_URL_UNPOOLED =
      "postgresql://test:test@localhost:5432/test";
    process.env.PORTAL_MAGIC_LINK_RATE_LIMIT = "3";
    process.env.PORTAL_MAGIC_LINK_WINDOW_MS = "1000";
    process.env.PORTAL_MAGIC_LINK_VERIFY_RATE_LIMIT = "5";
    process.env.PORTAL_MAGIC_LINK_VERIFY_WINDOW_MS = "1000";
    process.env.PORTAL_ACCESS_TOKEN_TTL_SECONDS = "1800";
    process.env.PORTAL_REFRESH_TOKEN_TTL_DAYS = "30";

    vi.resetModules();
    const containerModule = await import("../../../src/container.js");
    getUserRepositorySpy = vi
      .spyOn(containerModule, "getUserRepository")
      .mockReturnValue(userRepositoryMock as any);
    getMagicLinkRepositorySpy = vi
      .spyOn(containerModule, "getMagicLinkTokenRepository")
      .mockReturnValue(magicLinkRepositoryMock as any);
    getPortalSessionRepositorySpy = vi
      .spyOn(containerModule, "getPortalSessionRepository")
      .mockReturnValue(portalSessionRepositoryMock as any);

    app = (await import("../../../src/app.js")).default;
  });

  afterAll(() => {
    getUserRepositorySpy.mockRestore();
    getMagicLinkRepositorySpy.mockRestore();
    getPortalSessionRepositorySpy.mockRestore();
    delete process.env.JWT_SECRET;
    delete process.env.MAGIC_LINK_TTL_MINUTES;
    delete process.env.DATABASE_URL;
    delete process.env.DATABASE_URL_UNPOOLED;
    delete process.env.PORTAL_MAGIC_LINK_RATE_LIMIT;
    delete process.env.PORTAL_MAGIC_LINK_WINDOW_MS;
    delete process.env.PORTAL_MAGIC_LINK_VERIFY_RATE_LIMIT;
    delete process.env.PORTAL_MAGIC_LINK_VERIFY_WINDOW_MS;
    delete process.env.PORTAL_ACCESS_TOKEN_TTL_SECONDS;
    delete process.env.PORTAL_REFRESH_TOKEN_TTL_DAYS;
  });

  beforeEach(async () => {
    await resetRateLimiterStoresForTests();
    magicLinkTokens.length = 0;
    portalSessions.length = 0;
    userRepositoryMock.findByEmail.mockReset();
    magicLinkRepositoryMock.create.mockClear();
    magicLinkRepositoryMock.findValidByHash.mockClear();
    magicLinkRepositoryMock.consume.mockClear();
    magicLinkRepositoryMock.invalidateExpiredForEmail.mockClear();
    sendPortalMagicLinkEmailMock.mockReset();
    sendPortalMagicLinkEmailMock.mockImplementation(async () => ({
      delivered: true,
      messageId: "test-message",
    }));
    portalSessionRepositoryMock.create.mockClear();
    portalSessionRepositoryMock.findValidByTokenHash.mockClear();
    portalSessionRepositoryMock.revokeById.mockClear();
    portalSessionRepositoryMock.revokeByTokenHash.mockClear();
    portalSessionRepositoryMock.revokeAllForEmail.mockClear();
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
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": "198.51.100.250",
        "x-internal-remote-address": "10.1.1.1",
      },
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
    const cookies = extractCookies(verifyResponse.headers);
    expect(cookies.some((value) => value.startsWith("portal_token="))).toBe(
      true,
    );
    expect(
      cookies.some((value) => value.startsWith("portal_customer_id=")),
    ).toBe(true);
    expect(
      cookies.some((value) => value.startsWith("portal_refresh_token=")),
    ).toBe(true);
    const verifyBody = await jsonResponse<{
      data?: {
        portalToken: string;
        email: string;
        customerId: string;
        expiresAt: string;
        refreshExpiresAt: string;
      };
    }>(verifyResponse);
    expect(verifyBody.data?.portalToken).toBeDefined();
    expect(verifyBody.data?.email).toBe("client@portal.test");
    expect(verifyBody.data?.customerId).toBe("user-1");
    expect(verifyBody.data?.expiresAt).toMatch(/\d{4}-\d{2}-\d{2}T/);
    expect(verifyBody.data?.refreshExpiresAt).toMatch(/\d{4}-\d{2}-\d{2}T/);

    expect(userRepositoryMock.findByEmail).toHaveBeenCalledWith(
      "client@portal.test",
    );
    expect(portalSessionRepositoryMock.create).toHaveBeenCalledTimes(1);

    // Reutilizar el token debe fallar (token consumido)
    const secondVerify = await app.request("/api/portal/auth/verify", {
      method: "POST",
      body: JSON.stringify({ token: body.debugToken }),
      headers: { "content-type": "application/json" },
    });

    expect(secondVerify.status).toBe(400);
  });

  it("permite refrescar la sesión usando el refresh token", async () => {
    const requestResponse = await app.request("/api/portal/auth/request", {
      method: "POST",
      body: JSON.stringify({ email: "client@portal.test" }),
      headers: { "content-type": "application/json" },
    });
    const requestBody =
      (await jsonResponse<{ debugToken?: string }>(requestResponse)) ?? {};
    if (!requestBody.debugToken) {
      throw new Error("Debug token requerido para la prueba");
    }

    const verifyResponse = await app.request("/api/portal/auth/verify", {
      method: "POST",
      body: JSON.stringify({ token: requestBody.debugToken }),
      headers: { "content-type": "application/json" },
    });
    expect(verifyResponse.status).toBe(200);
    const verifyCookies = extractCookies(verifyResponse.headers);
    const refreshToken = getCookieValue(verifyCookies, "portal_refresh_token");
    expect(refreshToken).toBeTruthy();

    const refreshResponse = await app.request("/api/portal/auth/refresh", {
      method: "POST",
      headers: {
        cookie: `portal_refresh_token=${refreshToken}`,
      },
    });

    expect(refreshResponse.status).toBe(200);
    const refreshBody = await jsonResponse<{
      data?: { expiresAt?: string; refreshExpiresAt?: string };
    }>(refreshResponse);
    expect(refreshBody.data?.expiresAt).toMatch(/\d{4}-\d{2}-\d{2}T/);
    expect(refreshBody.data?.refreshExpiresAt).toMatch(/\d{4}-\d{2}-\d{2}T/);
    expect(portalSessionRepositoryMock.revokeById).toHaveBeenCalled();
    expect(portalSessionRepositoryMock.create).toHaveBeenCalledTimes(2);
  });

  it("retorna 401 cuando el refresh token es inválido", async () => {
    const response = await app.request("/api/portal/auth/refresh", {
      method: "POST",
      headers: {
        cookie: "portal_refresh_token=token-invalido",
      },
    });

    expect(response.status).toBe(401);
    const cookies = extractCookies(response.headers);
    expect(cookies.some((value) => value.startsWith("portal_token="))).toBe(
      true,
    );
  });

  it("retorna 503 cuando el correo no está configurado", async () => {
    await resetRateLimiterStoresForTests();
    const windowMs = Number(
      process.env.PORTAL_MAGIC_LINK_WINDOW_MS ?? "900000",
    );
    await new Promise((resolve) => setTimeout(resolve, windowMs + 50));
    sendPortalMagicLinkEmailMock.mockResolvedValueOnce({
      delivered: false,
      reason: "not-configured",
    });

    const response = await app.request("/api/portal/auth/request", {
      method: "POST",
      body: JSON.stringify({ email: "client@portal.test" }),
      headers: {
        "content-type": "application/json",
        // Forzar un identificador único para evitar que el rate limiter del resto
        // de la suite marque este caso como duplicado cuando corre en paralelo.
        "x-internal-remote-address": "10.55.0.10",
        "x-forwarded-for": "203.0.113.199",
      },
    });

    expect(response.status).toBe(503);
    const body = await jsonResponse<{ error?: string }>(response);
    expect(body.error).toMatch(/correo de enlaces mágicos/i);
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

  it("aplica rate limiting tras múltiples solicitudes de enlace mágico", async () => {
    const limit = Number(process.env.PORTAL_MAGIC_LINK_RATE_LIMIT ?? "3");
    const windowMs = Number(
      process.env.PORTAL_MAGIC_LINK_WINDOW_MS ?? "900000",
    );

    await new Promise((resolve) => setTimeout(resolve, windowMs + 50));

    for (let attempt = 0; attempt < limit; attempt += 1) {
      const response = await app.request("/api/portal/auth/request", {
        method: "POST",
        body: JSON.stringify({ email: "client@portal.test" }),
        headers: { "content-type": "application/json" },
      });
      expect(response.status).toBe(200);
    }

    const blocked = await app.request("/api/portal/auth/request", {
      method: "POST",
      body: JSON.stringify({ email: "client@portal.test" }),
      headers: { "content-type": "application/json" },
    });

    expect(blocked.status).toBe(429);
    const body = await jsonResponse<{ error: string }>(blocked);
    expect(body.error).toMatch(/Demasiadas solicitudes/);

    await new Promise((resolve) => setTimeout(resolve, windowMs + 50));
  });

  it("aplica rate limiting tras repetidos intentos de verificación inválidos", async () => {
    const limit = Number(
      process.env.PORTAL_MAGIC_LINK_VERIFY_RATE_LIMIT ?? "5",
    );
    const windowMs = Number(
      process.env.PORTAL_MAGIC_LINK_VERIFY_WINDOW_MS ?? "900000",
    );

    await new Promise((resolve) => setTimeout(resolve, windowMs + 50));

    magicLinkRepositoryMock.findValidByHash.mockResolvedValue(null);

    for (let attempt = 0; attempt < limit; attempt += 1) {
      const response = await app.request("/api/portal/auth/verify", {
        method: "POST",
        body: JSON.stringify({ token: "token-invalido" }),
        headers: { "content-type": "application/json" },
      });
      expect(response.status).toBe(400);
    }

    const blocked = await app.request("/api/portal/auth/verify", {
      method: "POST",
      body: JSON.stringify({ token: "token-invalido" }),
      headers: { "content-type": "application/json" },
    });

    expect(blocked.status).toBe(429);
    const body = await jsonResponse<{ error: string }>(blocked);
    expect(body.error).toMatch(/Demasiados intentos/);

    await new Promise((resolve) => setTimeout(resolve, windowMs + 50));
  });
});
