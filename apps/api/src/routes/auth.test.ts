import {
  describe,
  expect,
  it,
  beforeAll,
  afterAll,
  beforeEach,
  vi,
} from "vitest";
import { Hono } from "hono";

const verifyPasswordMock = vi.hoisted(() => vi.fn());

vi.mock("../lib/db", () => ({
  db: {
    user: {
      findUnique: vi.fn(({ where }: { where: { email: string } }) =>
        where.email === "demo@brisacubanaclean.com"
          ? {
              id: "user-demo",
              email: where.email,
              name: "Demo User",
              role: "CLIENT",
              passwordHash: "hashed-password",
            }
          : null,
      ),
    },
    refreshToken: {
      create: vi.fn(
        ({
          data,
        }: {
          data: { token: string; userId: string; expiresAt: Date };
        }) => ({
          id: "refresh-token-id",
          token: data.token,
          userId: data.userId,
          expiresAt: data.expiresAt,
          createdAt: new Date(),
        }),
      ),
    },
  },
}));

vi.mock("../lib/password", () => ({
  verifyPassword: verifyPasswordMock,
}));

import auth from "./auth";

const originalEnv = process.env.AUTH_DEMO_USERS;
const originalJwtSecret = process.env.JWT_SECRET;

describe("auth login route", () => {
  beforeAll(() => {
    process.env.AUTH_DEMO_USERS = "demo@brisacubanaclean.com:demo123";
    process.env.JWT_SECRET = "test-secret";
  });

  afterAll(() => {
    process.env.AUTH_DEMO_USERS = originalEnv;
    process.env.JWT_SECRET = originalJwtSecret;
  });

  const app = new Hono();
  app.route("/api/auth", auth);
  const handler = app.fetch;

  beforeEach(() => {
    verifyPasswordMock.mockReset();
  });

  it("rejects invalid payload", async () => {
    const response = await handler(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: "invalid" }),
      }),
    );
    expect(response.status).toBe(400);
  });

  it("rejects wrong credentials", async () => {
    verifyPasswordMock.mockResolvedValueOnce(false);
    const response = await handler(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: "demo@brisacubanaclean.com",
          password: "wrong",
        }),
      }),
    );
    expect(response.status).toBe(401);
  });

  it("returns user when credentials match", async () => {
    verifyPasswordMock.mockResolvedValueOnce(true);
    const response = await handler(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: "demo@brisacubanaclean.com",
          password: "demo123",
        }),
      }),
    );
    expect(response.status).toBe(200);
    const json = (await response.json()) as { email: string; token: string };
    expect(json.email).toBe("demo@brisacubanaclean.com");
    expect(json.token).toBeTruthy();
  });
});
