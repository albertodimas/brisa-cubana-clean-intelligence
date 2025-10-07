import { beforeEach, describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
import { generateAccessToken } from "../lib/token";

// Set environment FIRST
process.env.JWT_SECRET = "test-secret";

// Store mock functions
const stripeEnabledMock = vi.fn();
const stripeSessionCreateMock = vi.fn();
const getStripeMock = vi.fn();

// Mock with inline functions
vi.mock("../lib/db", () => ({
  db: {
    booking: {
      findUnique: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("../lib/stripe", () => ({
  stripeEnabled: stripeEnabledMock,
  getStripe: getStripeMock,
}));

// Import after mocking
const { default: payments } = await import("./payments");
const { env } = await import("../config/env");

// Get mock references for assertions
const { db } = await import("../lib/db");
const bookingMock = db.booking;

const buildApp = () => {
  const app = new Hono();
  app.route("/api/payments", payments);
  return app;
};

const authHeader = (role: "ADMIN" | "STAFF" | "CLIENT", sub: string) => ({
  Authorization: `Bearer ${generateAccessToken({
    sub,
    email: `${sub}@example.com`,
    role,
  })}`,
});

describe("payments route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getStripeMock.mockReturnValue({
      checkout: {
        sessions: {
          create: stripeSessionCreateMock,
        },
      },
      webhooks: {
        constructEvent: vi.fn(),
      },
    });
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    env.stripe.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  });

  it("rejects checkout when Stripe está deshabilitado", async () => {
    const app = buildApp();
    stripeEnabledMock.mockReturnValue(false);

    const response = await app.request("/api/payments/checkout-session", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...authHeader("CLIENT", "user-1"),
      },
      body: JSON.stringify({ bookingId: "booking-1" }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: "Stripe integration disabled",
    });
    expect(stripeSessionCreateMock).not.toHaveBeenCalled();
  });

  it("retorna 404 cuando la reserva no existe", async () => {
    const app = buildApp();
    stripeEnabledMock.mockReturnValue(true);
    bookingMock.findUnique.mockResolvedValueOnce(null);

    const response = await app.request("/api/payments/checkout-session", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...authHeader("STAFF", "staff-1"),
      },
      body: JSON.stringify({ bookingId: "booking-unknown" }),
    });

    expect(response.status).toBe(404);
    expect(stripeSessionCreateMock).not.toHaveBeenCalled();
  });

  it("crea sesión de checkout para reservas válidas", async () => {
    const app = buildApp();
    stripeEnabledMock.mockReturnValue(true);
    bookingMock.findUnique.mockResolvedValueOnce({
      id: "booking-1",
      userId: "client-1",
      serviceId: "service-1",
      propertyId: "property-1",
      totalPrice: 199.99,
      service: {
        id: "service-1",
        name: "Deep Clean",
        description: "Full cleaning",
        basePrice: 199.99,
      },
      property: { id: "property-1", name: "Apt 1", address: "123 Ocean Dr" },
      user: {
        id: "client-1",
        email: "client@example.com",
        name: "Cliente Demo",
      },
    });
    bookingMock.update.mockResolvedValueOnce({
      id: "booking-1",
      status: "PENDING",
      paymentStatus: "PENDING_PAYMENT",
      service: {
        id: "service-1",
        name: "Deep Clean",
        description: "Full cleaning",
        basePrice: 199.99,
      },
      property: { id: "property-1", name: "Apt 1", address: "123 Ocean Dr" },
      user: {
        id: "client-1",
        email: "client@example.com",
        name: "Cliente Demo",
      },
    });
    stripeSessionCreateMock.mockResolvedValueOnce({
      id: "cs_test_123",
      url: "https://checkout.stripe.com/session/test",
    });

    const response = await app.request("/api/payments/checkout-session", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...authHeader("STAFF", "staff-1"),
      },
      body: JSON.stringify({ bookingId: "booking-1" }),
    });

    expect(response.status).toBe(200);
    expect(stripeSessionCreateMock).toHaveBeenCalled();
    const json = (await response.json()) as { checkoutUrl?: string | null };
    expect(json.checkoutUrl).toBe("https://checkout.stripe.com/session/test");
  });

  it("marca la reserva como pagada cuando el webhook checkout.session.completed llega", async () => {
    const app = buildApp();
    stripeEnabledMock.mockReturnValue(true);
    const constructEvent = vi.fn().mockReturnValue({
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_123",
          payment_intent: "pi_123",
          metadata: {
            bookingId: "booking-1",
          },
        },
      },
    });
    getStripeMock.mockReturnValue({
      checkout: { sessions: { create: stripeSessionCreateMock } },
      webhooks: { constructEvent },
    });

    bookingMock.update.mockResolvedValueOnce(undefined);

    const response = await app.request("/api/payments/webhook", {
      method: "POST",
      headers: {
        "stripe-signature": "sig_test",
        "content-type": "application/json",
      },
      body: "{}",
    });

    expect(response.status).toBe(200);
    expect(constructEvent).toHaveBeenCalled();
    expect(bookingMock.update).toHaveBeenCalledWith({
      where: { id: "booking-1" },
      data: expect.objectContaining({
        paymentStatus: "PAID",
        status: "CONFIRMED",
        paymentIntentId: "pi_123",
        checkoutSessionId: "cs_test_123",
      }),
    });
  });

  it("marca la reserva como fallida cuando checkout.session.expired llega", async () => {
    const app = buildApp();
    stripeEnabledMock.mockReturnValue(true);
    const constructEvent = vi.fn().mockReturnValue({
      type: "checkout.session.expired",
      data: {
        object: {
          id: "cs_expired",
          metadata: {
            bookingId: "booking-2",
          },
        },
      },
    });
    getStripeMock.mockReturnValue({
      checkout: { sessions: { create: stripeSessionCreateMock } },
      webhooks: { constructEvent },
    });

    bookingMock.update.mockResolvedValueOnce(undefined);

    const response = await app.request("/api/payments/webhook", {
      method: "POST",
      headers: {
        "stripe-signature": "sig_test",
        "content-type": "application/json",
      },
      body: "{}",
    });

    expect(response.status).toBe(200);
    expect(bookingMock.update).toHaveBeenCalledWith({
      where: { id: "booking-2" },
      data: { paymentStatus: "FAILED" },
    });
  });

  it("usa paymentIntentId para marcar fallas de pago", async () => {
    const app = buildApp();
    stripeEnabledMock.mockReturnValue(true);
    const constructEvent = vi.fn().mockReturnValue({
      type: "payment_intent.payment_failed",
      data: {
        object: {
          id: "pi_fail",
        },
      },
    });
    getStripeMock.mockReturnValue({
      checkout: { sessions: { create: stripeSessionCreateMock } },
      webhooks: { constructEvent },
    });

    bookingMock.findFirst.mockResolvedValueOnce({ id: "booking-3" });
    bookingMock.update.mockResolvedValueOnce(undefined);

    const response = await app.request("/api/payments/webhook", {
      method: "POST",
      headers: {
        "stripe-signature": "sig_test",
        "content-type": "application/json",
      },
      body: "{}",
    });

    expect(response.status).toBe(200);
    expect(bookingMock.findFirst).toHaveBeenCalledWith({
      where: { paymentIntentId: "pi_fail" },
    });
    expect(bookingMock.update).toHaveBeenCalledWith({
      where: { id: "booking-3" },
      data: { paymentStatus: "FAILED" },
    });
  });
});
