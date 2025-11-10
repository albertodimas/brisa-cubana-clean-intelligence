import { test, expect } from "@playwright/test";
import { adminEmail, adminPassword } from "./support/auth";
import {
  getAdminAccessToken,
  resetRateLimitCounters,
} from "./support/services";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type AuthResponse = {
  token?: string;
  refreshToken?: string;
  expiresAt?: string;
  refreshExpiresAt?: string;
  data?: { id: string; email: string; role: string };
};

const defaultLoginHeaders = {
  "Content-Type": "application/json",
  "x-forwarded-for": "198.51.100.77",
  "x-internal-remote-address": "127.0.0.1",
};

test.describe("Autenticación del panel", () => {
  test.beforeEach(async ({ request }) => {
    await resetRateLimitCounters(request).catch(() => {
      // Si el endpoint no está disponible (p. ej., en prod), continuamos sin bloquear la suite.
    });
  });

  test("@critical rota tokens persistentes al usar /refresh", async ({
    request,
  }) => {
    const loginResponse = await request.post(
      `${apiBaseUrl}/api/authentication/login`,
      {
        headers: defaultLoginHeaders,
        data: {
          email: adminEmail,
          password: adminPassword,
        },
      },
    );

    expect(loginResponse.ok()).toBeTruthy();
    const loginJson = (await loginResponse.json()) as AuthResponse;
    expect(loginJson.token).toBeTruthy();
    expect(loginJson.refreshToken).toBeTruthy();
    expect(loginJson.expiresAt).toBeTruthy();

    const refreshResponse = await request.post(
      `${apiBaseUrl}/api/authentication/refresh`,
      {
        headers: { "Content-Type": "application/json" },
        data: { refreshToken: loginJson.refreshToken },
      },
    );

    expect(refreshResponse.ok()).toBeTruthy();
    const refreshJson = (await refreshResponse.json()) as AuthResponse;
    expect(refreshJson.token).toBeTruthy();
    expect(refreshJson.refreshToken).toBeTruthy();
    expect(refreshJson.token).not.toBe(loginJson.token);
    expect(refreshJson.refreshToken).not.toBe(loginJson.refreshToken);
    expect(new Date(refreshJson.expiresAt ?? 0).getTime()).toBeGreaterThan(
      new Date(loginJson.expiresAt ?? 0).getTime(),
    );
  });

  test("@critical invalida el refresh token tras logout", async ({
    request,
  }) => {
    const loginResponse = await request.post(
      `${apiBaseUrl}/api/authentication/login`,
      {
        headers: defaultLoginHeaders,
        data: {
          email: adminEmail,
          password: adminPassword,
        },
      },
    );

    expect(loginResponse.ok()).toBeTruthy();
    const loginJson = (await loginResponse.json()) as AuthResponse;
    expect(loginJson.token).toBeTruthy();
    expect(loginJson.refreshToken).toBeTruthy();

    const logoutResponse = await request.post(
      `${apiBaseUrl}/api/authentication/logout`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${loginJson.token}`,
        },
        data: { refreshToken: loginJson.refreshToken },
      },
    );

    expect(logoutResponse.ok()).toBeTruthy();

    const refreshResponse = await request.post(
      `${apiBaseUrl}/api/authentication/refresh`,
      {
        headers: { "Content-Type": "application/json" },
        data: { refreshToken: loginJson.refreshToken },
      },
    );

    expect(refreshResponse.status()).toBe(401);
  });

  test("@critical expone endpoint de reset de rate limiting sólo para admins", async ({
    request,
  }) => {
    const adminToken = await getAdminAccessToken(request);
    const allowed = await request.post(
      `${apiBaseUrl}/api/test-utils/rate-limiter/reset`,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      },
    );
    expect(allowed.ok()).toBeTruthy();

    const forbidden = await request.post(
      `${apiBaseUrl}/api/test-utils/rate-limiter/reset`,
      {
        headers: {
          Authorization: "Bearer invalid-token",
        },
      },
    );
    expect(forbidden.status()).toBe(401);
  });
});
