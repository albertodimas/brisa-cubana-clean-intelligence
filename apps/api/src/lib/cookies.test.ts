import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import {
  setAccessTokenCookie,
  setRefreshTokenCookie,
  getAccessTokenCookie,
  getRefreshTokenCookie,
  clearAuthCookies,
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  accessTokenOptions,
  refreshTokenOptions,
} from "./cookies";

describe("Cookie utilities", () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
  });

  describe("Cookie configuration", () => {
    it("should export correct cookie names", () => {
      expect(ACCESS_TOKEN_COOKIE).toBe("brisa_access");
      expect(REFRESH_TOKEN_COOKIE).toBe("brisa_refresh");
    });

    it("should configure access token with correct security settings", () => {
      expect(accessTokenOptions.httpOnly).toBe(true);
      expect(accessTokenOptions.sameSite).toBe("Strict");
      expect(accessTokenOptions.path).toBe("/");
      expect(accessTokenOptions.maxAge).toBe(15 * 60); // 15 minutes
    });

    it("should configure refresh token with correct security settings", () => {
      expect(refreshTokenOptions.httpOnly).toBe(true);
      expect(refreshTokenOptions.sameSite).toBe("Strict");
      expect(refreshTokenOptions.path).toBe("/");
      expect(refreshTokenOptions.maxAge).toBe(7 * 24 * 60 * 60); // 7 days
    });

    it("should use secure flag based on NODE_ENV", () => {
      const isProduction = process.env.NODE_ENV === "production";
      expect(accessTokenOptions.secure).toBe(isProduction);
      expect(refreshTokenOptions.secure).toBe(isProduction);
    });
  });

  describe("setAccessTokenCookie", () => {
    it("should set access token cookie with correct name and value", async () => {
      app.get("/test", (c) => {
        setAccessTokenCookie(c, "test-access-token");
        return c.text("ok");
      });

      const res = await app.request("/test");
      const setCookieHeader = res.headers.get("Set-Cookie");

      expect(setCookieHeader).toBeTruthy();
      expect(setCookieHeader).toContain("brisa_access=test-access-token");
      expect(setCookieHeader).toContain("HttpOnly");
      expect(setCookieHeader).toContain("SameSite=Strict");
      expect(setCookieHeader).toContain("Path=/");
      expect(setCookieHeader).toContain("Max-Age=900"); // 15 minutes
    });
  });

  describe("setRefreshTokenCookie", () => {
    it("should set refresh token cookie with correct name and value", async () => {
      app.get("/test", (c) => {
        setRefreshTokenCookie(c, "test-refresh-token");
        return c.text("ok");
      });

      const res = await app.request("/test");
      const setCookieHeader = res.headers.get("Set-Cookie");

      expect(setCookieHeader).toBeTruthy();
      expect(setCookieHeader).toContain("brisa_refresh=test-refresh-token");
      expect(setCookieHeader).toContain("HttpOnly");
      expect(setCookieHeader).toContain("SameSite=Strict");
      expect(setCookieHeader).toContain("Path=/");
      expect(setCookieHeader).toContain("Max-Age=604800"); // 7 days
    });
  });

  describe("getAccessTokenCookie", () => {
    it("should retrieve access token from cookie", async () => {
      app.get("/test", (c) => {
        const token = getAccessTokenCookie(c);
        return c.json({ token });
      });

      const res = await app.request("/test", {
        headers: {
          Cookie: "brisa_access=test-access-token",
        },
      });

      const json = await res.json();
      expect(json.token).toBe("test-access-token");
    });

    it("should return undefined if access token cookie is not present", async () => {
      app.get("/test", (c) => {
        const token = getAccessTokenCookie(c);
        return c.json({ token: token ?? null });
      });

      const res = await app.request("/test");
      const json = await res.json();
      expect(json.token).toBeNull();
    });
  });

  describe("getRefreshTokenCookie", () => {
    it("should retrieve refresh token from cookie", async () => {
      app.get("/test", (c) => {
        const token = getRefreshTokenCookie(c);
        return c.json({ token });
      });

      const res = await app.request("/test", {
        headers: {
          Cookie: "brisa_refresh=test-refresh-token",
        },
      });

      const json = await res.json();
      expect(json.token).toBe("test-refresh-token");
    });

    it("should return undefined if refresh token cookie is not present", async () => {
      app.get("/test", (c) => {
        const token = getRefreshTokenCookie(c);
        return c.json({ token: token ?? null });
      });

      const res = await app.request("/test");
      const json = await res.json();
      expect(json.token).toBeNull();
    });
  });

  describe("clearAuthCookies", () => {
    it("should clear both access and refresh token cookies", async () => {
      app.get("/test", (c) => {
        clearAuthCookies(c);
        return c.text("ok");
      });

      const res = await app.request("/test");
      const setCookieHeaders = res.headers.getSetCookie();

      expect(setCookieHeaders).toHaveLength(2);

      const accessClearHeader = setCookieHeaders.find((h) =>
        h.includes("brisa_access"),
      );
      const refreshClearHeader = setCookieHeaders.find((h) =>
        h.includes("brisa_refresh"),
      );

      expect(accessClearHeader).toBeTruthy();
      expect(accessClearHeader).toContain("Max-Age=0");
      expect(accessClearHeader).toContain("Path=/");

      expect(refreshClearHeader).toBeTruthy();
      expect(refreshClearHeader).toContain("Max-Age=0");
      expect(refreshClearHeader).toContain("Path=/");
    });
  });

  describe("Cookie security", () => {
    it("should set both cookies with HttpOnly flag", async () => {
      app.get("/test", (c) => {
        setAccessTokenCookie(c, "access");
        setRefreshTokenCookie(c, "refresh");
        return c.text("ok");
      });

      const res = await app.request("/test");
      const setCookieHeaders = res.headers.getSetCookie();

      expect(setCookieHeaders).toHaveLength(2);
      expect(setCookieHeaders[0]).toContain("HttpOnly");
      expect(setCookieHeaders[1]).toContain("HttpOnly");
    });

    it("should set both cookies with SameSite=Strict", async () => {
      app.get("/test", (c) => {
        setAccessTokenCookie(c, "access");
        setRefreshTokenCookie(c, "refresh");
        return c.text("ok");
      });

      const res = await app.request("/test");
      const setCookieHeaders = res.headers.getSetCookie();

      expect(setCookieHeaders).toHaveLength(2);
      expect(setCookieHeaders[0]).toContain("SameSite=Strict");
      expect(setCookieHeaders[1]).toContain("SameSite=Strict");
    });

    it("should set both cookies with correct Path", async () => {
      app.get("/test", (c) => {
        setAccessTokenCookie(c, "access");
        setRefreshTokenCookie(c, "refresh");
        return c.text("ok");
      });

      const res = await app.request("/test");
      const setCookieHeaders = res.headers.getSetCookie();

      expect(setCookieHeaders).toHaveLength(2);
      expect(setCookieHeaders[0]).toContain("Path=/");
      expect(setCookieHeaders[1]).toContain("Path=/");
    });
  });

  describe("Token expiration times", () => {
    it("should set access token with 15-minute expiration", async () => {
      app.get("/test", (c) => {
        setAccessTokenCookie(c, "access");
        return c.text("ok");
      });

      const res = await app.request("/test");
      const setCookieHeader = res.headers.get("Set-Cookie");

      expect(setCookieHeader).toContain("Max-Age=900"); // 15 * 60 = 900
    });

    it("should set refresh token with 7-day expiration", async () => {
      app.get("/test", (c) => {
        setRefreshTokenCookie(c, "refresh");
        return c.text("ok");
      });

      const res = await app.request("/test");
      const setCookieHeader = res.headers.get("Set-Cookie");

      expect(setCookieHeader).toContain("Max-Age=604800"); // 7 * 24 * 60 * 60 = 604800
    });
  });
});
