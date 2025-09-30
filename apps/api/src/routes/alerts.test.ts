import { beforeEach, describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
import { generateAccessToken } from "../lib/token";

const paymentAlertMock = {
  findMany: vi.fn(),
  findFirst: vi.fn(),
  create: vi.fn(),
};

vi.mock("../lib/db", () => ({
  db: {
    paymentAlert: paymentAlertMock,
  },
}));

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

process.env.JWT_SECRET = "test-secret";
process.env.ALERTS_SLACK_WEBHOOK = "";

const { default: alerts } = await import("./alerts");

const buildApp = () => {
  const app = new Hono();
  app.route("/api/alerts", alerts);
  return app;
};

const authHeader = (sub: string, role: "ADMIN" | "STAFF") => ({
  Authorization: `Bearer ${generateAccessToken({
    sub,
    email: `${sub}@example.com`,
    role,
  })}`,
});

describe("alerts routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock.mockReset();
  });

  it("rejects unauthenticated access", async () => {
    const app = buildApp();
    const response = await app.request("/api/alerts/payment");
    expect(response.status).toBe(401);
  });

  it("skips when below threshold", async () => {
    const app = buildApp();
    const response = await app.request("/api/alerts/payment", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...authHeader("staff-1", "STAFF"),
      },
      body: JSON.stringify({ failedPayments: 0, pendingPayments: 2 }),
    });

    expect(response.status).toBe(200);
    const json = (await response.json()) as { queued: boolean; reason: string };
    expect(json.queued).toBe(false);
    expect(json.reason).toBe("threshold");
  });

  it("skips duplicates", async () => {
    const app = buildApp();
    paymentAlertMock.findFirst.mockResolvedValueOnce({ id: "alert-1" });

    const response = await app.request("/api/alerts/payment", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...authHeader("staff-1", "STAFF"),
      },
      body: JSON.stringify({ failedPayments: 1, pendingPayments: 4 }),
    });

    expect(response.status).toBe(200);
    const json = (await response.json()) as { queued: boolean; reason: string };
    expect(json.queued).toBe(false);
    expect(json.reason).toBe("duplicate");
    expect(paymentAlertMock.create).not.toHaveBeenCalled();
  });

  it("creates alert and sends slack", async () => {
    process.env.ALERTS_SLACK_WEBHOOK = "https://hooks.slack.test";
    fetchMock.mockResolvedValueOnce({ ok: true } as Response);
    const app = buildApp();
    paymentAlertMock.findFirst.mockResolvedValueOnce(null);
    paymentAlertMock.create.mockResolvedValueOnce({ id: "alert-1" });

    const response = await app.request("/api/alerts/payment", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...authHeader("admin-1", "ADMIN"),
      },
      body: JSON.stringify({ failedPayments: 2, pendingPayments: 6 }),
    });

    expect(response.status).toBe(200);
    const json = (await response.json()) as { queued: boolean };
    expect(json.queued).toBe(true);
    expect(paymentAlertMock.create).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalled();
    process.env.ALERTS_SLACK_WEBHOOK = "";
  });
});
