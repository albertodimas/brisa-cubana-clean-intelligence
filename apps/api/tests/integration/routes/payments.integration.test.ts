import { describe, beforeAll, afterAll, it, expect, vi } from "vitest";
import Stripe from "stripe";
import type { Hono } from "hono";
import type { ServiceRepository } from "../../../src/repositories/service-repository.js";

const TEST_SECRET_KEY = "sk_test_12345";
const TEST_WEBHOOK_SECRET = "whsec_testsecret";

let app: Hono;
let stripeClientInstance: Stripe | null = null;
let getStripeWebhookEventRepositorySpy: ReturnType<typeof vi.spyOn>;

const stripe = new Stripe(TEST_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

const webhookEventRepositoryMock = {
  wasProcessed: vi.fn(),
  recordEvent: vi.fn(),
  markAsProcessed: vi.fn(),
  markAsError: vi.fn(),
  findByStripeEventId: vi.fn(),
};

describe("Stripe webhook", () => {
  beforeAll(async () => {
    process.env.STRIPE_SECRET_KEY = TEST_SECRET_KEY;
    process.env.STRIPE_WEBHOOK_SECRET = TEST_WEBHOOK_SECRET;
    process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
    process.env.DATABASE_URL_UNPOOLED =
      "postgresql://test:test@localhost:5432/test";
    process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-secret";
    process.env.CHECKOUT_PAYMENT_RATE_LIMIT = "3";
    process.env.CHECKOUT_PAYMENT_WINDOW_MS = "1000";
    vi.resetModules();

    // Mock del repositorio de webhook events
    const containerModule = await import("../../../src/container.js");
    getStripeWebhookEventRepositorySpy = vi
      .spyOn(containerModule, "getStripeWebhookEventRepository")
      .mockReturnValue(webhookEventRepositoryMock as any);

    // Configurar mocks por defecto
    webhookEventRepositoryMock.wasProcessed.mockResolvedValue(false);
    webhookEventRepositoryMock.recordEvent.mockResolvedValue({
      id: "wh-1",
      stripeEventId: "evt_test_123",
      eventType: "checkout.session.completed",
      processed: false,
      processedAt: null,
      metadata: null,
      errorMessage: null,
      createdAt: new Date(),
    });
    webhookEventRepositoryMock.markAsProcessed.mockResolvedValue({
      id: "wh-1",
      stripeEventId: "evt_test_123",
      eventType: "checkout.session.completed",
      processed: true,
      processedAt: new Date(),
      metadata: null,
      errorMessage: null,
      createdAt: new Date(),
    });

    app = (await import("../../../src/app.js")).default;
    const paymentsModule = await import("../../../src/routes/payments.js");
    stripeClientInstance = paymentsModule.__testing.stripeClient;
  });

  afterAll(() => {
    getStripeWebhookEventRepositorySpy.mockRestore();
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.DATABASE_URL;
    delete process.env.DATABASE_URL_UNPOOLED;
    delete process.env.JWT_SECRET;
    delete process.env.CHECKOUT_PAYMENT_RATE_LIMIT;
    delete process.env.CHECKOUT_PAYMENT_WINDOW_MS;
  });

  it("acepta eventos con firma válida", async () => {
    const payload = JSON.stringify({
      id: "evt_test_123",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_123",
        },
      },
    });

    const signature = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: TEST_WEBHOOK_SECRET,
    });

    const response = await app.request("/api/payments/stripe/webhook", {
      method: "POST",
      body: payload,
      headers: {
        "stripe-signature": signature,
        "content-type": "application/json",
      },
    });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toEqual({ received: true, status: "processed" });
    expect(webhookEventRepositoryMock.wasProcessed).toHaveBeenCalledWith(
      "evt_test_123",
    );
    expect(webhookEventRepositoryMock.recordEvent).toHaveBeenCalledWith(
      "evt_test_123",
      "checkout.session.completed",
    );
    expect(webhookEventRepositoryMock.markAsProcessed).toHaveBeenCalledWith(
      "evt_test_123",
    );
  });

  it("rechaza eventos con firma inválida", async () => {
    const payload = JSON.stringify({
      id: "evt_test_invalid",
      type: "payment_intent.created",
    });

    const response = await app.request("/api/payments/stripe/webhook", {
      method: "POST",
      body: payload,
      headers: {
        "stripe-signature": "t=12345,v1=invalid",
        "content-type": "application/json",
      },
    });

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json).toEqual({ error: "Firma inválida" });
  });

  it("crea una intención de pago con servicio válido", async () => {
    if (!stripeClientInstance) {
      throw new Error("Stripe client no inicializado en modo test");
    }

    const paymentIntentCreateMock = vi.fn().mockResolvedValue({
      id: "pi_test_123",
      client_secret: "pi_test_secret_123",
    });
    const paymentIntentSpy = vi
      .spyOn(stripeClientInstance.paymentIntents, "create")
      .mockImplementation(paymentIntentCreateMock as any);

    const containerModule = await import("../../../src/container.js");
    const repositoryMock: Partial<ServiceRepository> = {
      findById: vi.fn().mockResolvedValue({
        id: "srv_test",
        name: "Limpieza profunda demo",
        basePrice: 150,
        durationMin: 120,
        active: true,
      }),
    };
    const repositorySpy = vi
      .spyOn(containerModule, "getServiceRepository")
      .mockReturnValue(repositoryMock as ServiceRepository);

    const response = await app.request("/api/payments/stripe/intent", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        serviceId: "srv_test",
        customerEmail: "cliente@example.com",
        customerFullName: "Cliente Demo",
        scheduledFor: "2025-10-20T14:00:00.000Z",
        notes: "Nota de prueba",
      }),
    });

    expect(response.status).toBe(200);
    const json = (await response.json()) as {
      data: { clientSecret: string; paymentIntentId: string; amount: number };
    };
    expect(json.data.clientSecret).toBe("pi_test_secret_123");
    expect(json.data.paymentIntentId).toBe("pi_test_123");
    expect(json.data.amount).toBe(15000);

    expect(paymentIntentCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 15000,
        currency: "usd",
        receipt_email: "cliente@example.com",
      }),
    );

    paymentIntentSpy.mockRestore();
    repositorySpy.mockRestore();
  });

  it("aplica rate limiting tras solicitudes consecutivas de intents", async () => {
    if (!stripeClientInstance) {
      throw new Error("Stripe client no inicializado en modo test");
    }

    const limit = Number(process.env.CHECKOUT_PAYMENT_RATE_LIMIT ?? "10");
    const windowMs = Number(process.env.CHECKOUT_PAYMENT_WINDOW_MS ?? "60000");

    await new Promise((resolve) => setTimeout(resolve, windowMs + 50));

    const paymentIntentCreateMock = vi.fn().mockResolvedValue({
      id: "pi_rate_limit",
      client_secret: "pi_rate_limit_secret",
    });
    const paymentIntentSpy = vi
      .spyOn(stripeClientInstance.paymentIntents, "create")
      .mockImplementation(paymentIntentCreateMock as any);

    const containerModule = await import("../../../src/container.js");
    const repositoryMock: Partial<ServiceRepository> = {
      findById: vi.fn().mockResolvedValue({
        id: "srv_rate",
        name: "Servicio Rate Limit",
        basePrice: 120,
        durationMin: 60,
        active: true,
      }),
    };
    const repositorySpy = vi
      .spyOn(containerModule, "getServiceRepository")
      .mockReturnValue(repositoryMock as ServiceRepository);

    for (let attempt = 0; attempt < limit; attempt += 1) {
      const response = await app.request("/api/payments/stripe/intent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          serviceId: "srv_rate",
          customerEmail: "cliente@example.com",
        }),
      });
      expect(response.status).toBe(200);
    }

    const blocked = await app.request("/api/payments/stripe/intent", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        serviceId: "srv_rate",
        customerEmail: "cliente@example.com",
      }),
    });

    expect(blocked.status).toBe(429);
    const body = (await blocked.json()) as { error: string };
    expect(body.error).toMatch(/Demasiadas solicitudes de pago/);

    paymentIntentSpy.mockRestore();
    repositorySpy.mockRestore();

    await new Promise((resolve) => setTimeout(resolve, windowMs + 50));
  });
});
