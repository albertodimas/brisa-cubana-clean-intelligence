import { describe, beforeAll, afterAll, it, expect, vi } from "vitest";
import Stripe from "stripe";
import type { Hono } from "hono";
import type { ServiceRepository } from "../../../src/repositories/service-repository.js";

const TEST_SECRET_KEY = "sk_test_12345";
const TEST_WEBHOOK_SECRET = "whsec_testsecret";

let app: Hono;
let stripeClientInstance: Stripe | null = null;

const stripe = new Stripe(TEST_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

describe("Stripe webhook", () => {
  beforeAll(async () => {
    process.env.STRIPE_SECRET_KEY = TEST_SECRET_KEY;
    process.env.STRIPE_WEBHOOK_SECRET = TEST_WEBHOOK_SECRET;
    process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
    process.env.DATABASE_URL_UNPOOLED =
      "postgresql://test:test@localhost:5432/test";
    vi.resetModules();
    app = (await import("../../../src/app.js")).default;
    const paymentsModule = await import("../../../src/routes/payments.js");
    stripeClientInstance = paymentsModule.__testing.stripeClient;
  });

  afterAll(() => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.DATABASE_URL;
    delete process.env.DATABASE_URL_UNPOOLED;
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
    expect(json).toEqual({ received: true });
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
});
