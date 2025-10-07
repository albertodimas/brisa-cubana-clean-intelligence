import { describe, expect, it, beforeEach, vi } from "vitest";
import { Hono } from "hono";
import concierge from "./concierge";
import { clearRateLimitStore } from "../middleware/rate-limit";
import { resetConciergeMetrics } from "../services/concierge-metrics";
import { env } from "../config/env";

const mockMessages: Array<Record<string, unknown>> = [];
const mockConversation = {
  id: "conv-1",
  userId: "user-123",
  channel: "WEB",
  status: "ACTIVE",
  title: "Nueva conversación",
  bookingId: null,
  propertyId: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function createDbMock() {
  return {
    conversation: {
      create: vi.fn(async ({ data }) => ({ ...mockConversation, ...data })),
      findMany: vi.fn(async () => [mockConversation]),
      findUnique: vi.fn(async ({ where }) =>
        where?.id === mockConversation.id
          ? {
              ...mockConversation,
              messages: [...mockMessages],
            }
          : null,
      ),
      update: vi.fn(async ({ data }) => ({ ...mockConversation, ...data })),
    },
    message: {
      create: vi.fn(async ({ data }) => {
        const message = {
          id: `msg-${mockMessages.length + 1}`,
          createdAt: new Date().toISOString(),
          ...data,
        };
        mockMessages.push(message);
        return message;
      }),
    },
    user: {
      findUnique: vi.fn(async () => ({
        id: "user-123",
        name: "Client User",
        email: "client@example.com",
        phone: "+13050000000",
      })),
    },
    booking: {
      findMany: vi.fn(async () => []),
      findUnique: vi.fn(async ({ where }) =>
        where?.id
          ? {
              id: where.id,
              scheduledAt: new Date().toISOString(),
              completedAt: null,
              property: { id: "prop-1", name: "Downtown Loft" },
              service: { id: "svc-1", name: "Deep Clean" },
              cleanScoreReport: null,
            }
          : null,
      ),
    },
    property: {
      findUnique: vi.fn(async () => ({ id: "prop-1", name: "Downtown Loft" })),
    },
    service: {
      findMany: vi.fn(async () => [
        {
          id: "svc-1",
          name: "Deep Clean",
          basePrice: 150,
          duration: 120,
          active: true,
        },
      ]),
    },
  };
}

vi.mock("../lib/db", () => ({
  db: createDbMock(),
}));

const mockUsers = {
  CLIENT: {
    sub: "user-123",
    email: "client@example.com",
    role: "CLIENT",
  },
  STAFF: {
    sub: "staff-1",
    email: "staff@example.com",
    role: "STAFF",
  },
  ADMIN: {
    sub: "admin-1",
    email: "admin@example.com",
    role: "ADMIN",
  },
};

vi.mock("../middleware/auth", () => ({
  requireAuth:
    (roles?: string[]) =>
    async (
      c: { set: (key: string, value: unknown) => void },
      next: () => Promise<void>,
    ) => {
      const role = roles?.includes("ADMIN")
        ? "ADMIN"
        : roles?.includes("STAFF")
          ? "STAFF"
          : "CLIENT";
      c.set("authUser", mockUsers[role as keyof typeof mockUsers]);
      await next();
    },
  getAuthUser: (c: { get: (key: string) => unknown }) =>
    (c.get("authUser") as { sub: string; email: string; role: string }) ?? null,
}));

vi.mock("../services/ai", () => ({
  generateAIResponse: vi.fn(async () => ({
    content: "¡Hola! Aquí tienes la información solicitada.",
    model: "test-model",
    tokens: 42,
  })),
}));

describe("Concierge routes", () => {
  beforeEach(() => {
    mockMessages.splice(0, mockMessages.length);
    vi.clearAllMocks();
    clearRateLimitStore();
    resetConciergeMetrics();
  });

  it("creates a conversation with an initial message", async () => {
    const app = new Hono();
    app.route("/api/concierge", concierge);

    const response = await app.request(
      new Request("http://localhost/api/concierge/conversations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          channel: "WEB",
          initialMessage: "Hola, necesito agendar",
        }),
      }),
    );

    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      conversation: Record<string, unknown>;
      messages: Array<Record<string, unknown>>;
    };

    expect(payload.conversation).toMatchObject({
      channel: "WEB",
      userId: "user-123",
    });
    expect(payload.messages).toHaveLength(2);
    const { db } = await import("../lib/db");
    const dbMock = db as ReturnType<typeof createDbMock>;
    expect(dbMock.message.create).toHaveBeenCalledTimes(2);
  });

  it("retrieves a conversation for staff members", async () => {
    const app = new Hono();
    app.route("/api/concierge", concierge);

    // Seed conversation by creating it first
    await app.request(
      new Request("http://localhost/api/concierge/conversations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ channel: "WEB", initialMessage: "Hola" }),
      }),
    );

    const response = await app.request(
      new Request("http://localhost/api/concierge/conversations/conv-1", {
        method: "GET",
      }),
    );

    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      messages: Array<Record<string, unknown>>;
    };
    expect(payload.messages.length).toBeGreaterThan(0);
  });

  it("exposes status flags and aggregates metrics", async () => {
    process.env.CONCIERGE_MODE = "llm";
    process.env.AI_PROVIDER = "anthropic";
    process.env.ENABLE_AI_CONCIERGE = "true";
    env.ai.conciergeMode = process.env.CONCIERGE_MODE;
    env.ai.provider = process.env.AI_PROVIDER;
    env.ai.enableConcierge = true;

    const app = new Hono();
    app.route("/api/concierge", concierge);

    const statusResponse = await app.request(
      new Request("http://localhost/api/concierge/status"),
    );
    expect(statusResponse.status).toBe(200);
    const statusPayload = (await statusResponse.json()) as {
      mode: string;
      provider: string;
    };
    expect(statusPayload.mode).toBe("llm");
    expect(statusPayload.provider).toBe("anthropic");

    await app.request(
      new Request("http://localhost/api/concierge/conversations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          initialMessage: "¿Cuál es mi próximo servicio?",
        }),
      }),
    );

    const metricsResponse = await app.request(
      new Request("http://localhost/api/concierge/metrics"),
    );
    expect(metricsResponse.status).toBe(200);
    const metricsPayload = (await metricsResponse.json()) as {
      conversations: number;
      messages: { total: number };
    };

    expect(metricsPayload.conversations).toBeGreaterThanOrEqual(1);
    expect(metricsPayload.messages.total).toBeGreaterThanOrEqual(2);
  });
});
