import { describe, beforeAll, afterAll, it, expect, vi } from "vitest";
import Stripe from "stripe";
import type { Hono } from "hono";

const TEST_SECRET_KEY = "sk_test_12345";
const TEST_WEBHOOK_SECRET = "whsec_testsecret";

let app: Hono;

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
    app = (await import("../app.js")).default;
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
});
