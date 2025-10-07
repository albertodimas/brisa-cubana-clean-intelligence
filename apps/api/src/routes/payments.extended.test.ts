import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Hono } from "hono";
import { generateAccessToken } from "../lib/token";

// Set environment FIRST
process.env.JWT_SECRET = "test-secret-payments";

// Store mock functions
const stripeEnabledMock = vi.fn();
const getStripeMock = vi.fn();

// Mock with inline functions
vi.mock("../lib/db", () => ({
  db: {
    booking: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("../lib/stripe", () => ({
  stripeEnabled: stripeEnabledMock,
  getStripe: getStripeMock,
}));

// Import after mocking
const payments = (await import("./payments")).default;
const { env } = await import("../config/env");

// Get mock references for assertions
const { db } = await import("../lib/db");
const bookingMock = db.booking;

function buildApp() {
  const app = new Hono();
  app.route("/api/payments", payments);
  return app;
}

function authHeader(role: "ADMIN" | "STAFF" | "CLIENT", sub: string) {
  return {
    Authorization: `Bearer ${generateAccessToken({
      sub,
      email: `${sub}@example.com`,
      role,
    })}`,
  };
}

describe("Payments Extended - POST /checkout-session", () => {
  let app: Hono;
  let mockStripe: any;

  beforeEach(() => {
    app = buildApp();
    vi.clearAllMocks();

    mockStripe = {
      checkout: {
        sessions: {
          create: vi.fn(),
        },
      },
      webhooks: {
        constructEvent: vi.fn(),
      },
    };

    getStripeMock.mockReturnValue(mockStripe);
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    env.stripe.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    process.env.WEB_APP_URL = "https://example.com";
  });

  describe("Validation", () => {
    it("should return 401 when not authenticated", async () => {
      const response = await app.request("/api/payments/checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: "booking-1" }),
      });

      expect(response.status).toBe(401);
    });

    it("should return 400 when bookingId is missing", async () => {
      stripeEnabledMock.mockReturnValue(true);

      const response = await app.request("/api/payments/checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader("CLIENT", "client-1"),
        },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("bookingId is required");
    });

    it("should return 400 when JSON is malformed", async () => {
      stripeEnabledMock.mockReturnValue(true);

      const response = await app.request("/api/payments/checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader("CLIENT", "client-1"),
        },
        body: "{ invalid json",
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("bookingId is required");
    });

    it("should return 400 when Stripe is disabled", async () => {
      stripeEnabledMock.mockReturnValue(false);

      const response = await app.request("/api/payments/checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader("CLIENT", "client-1"),
        },
        body: JSON.stringify({ bookingId: "booking-1" }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Stripe integration disabled");
    });
  });

  describe("Authorization", () => {
    it("should return 404 when booking not found", async () => {
      stripeEnabledMock.mockReturnValue(true);
      bookingMock.findUnique.mockResolvedValueOnce(null);

      const response = await app.request("/api/payments/checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader("CLIENT", "client-1"),
        },
        body: JSON.stringify({ bookingId: "nonexistent" }),
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe("Booking not found");
    });

    it("should return 403 when CLIENT tries to access another user's booking", async () => {
      stripeEnabledMock.mockReturnValue(true);
      bookingMock.findUnique.mockResolvedValueOnce({
        id: "booking-1",
        userId: "other-user",
        service: { name: "Service" },
        user: { email: "other@example.com" },
        property: {},
        totalPrice: 100,
      });

      const response = await app.request("/api/payments/checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader("CLIENT", "client-1"),
        },
        body: JSON.stringify({ bookingId: "booking-1" }),
      });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe("Forbidden");
    });

    it("should allow ADMIN to create checkout for any booking", async () => {
      stripeEnabledMock.mockReturnValue(true);
      bookingMock.findUnique.mockResolvedValueOnce({
        id: "booking-1",
        userId: "other-user",
        totalPrice: 150,
        service: { name: "Service", description: "Desc" },
        user: { email: "other@example.com" },
        property: {},
      });

      bookingMock.update.mockResolvedValueOnce({
        id: "booking-1",
        paymentStatus: "PENDING_PAYMENT",
        service: {},
        user: {},
        property: {},
      });

      mockStripe.checkout.sessions.create.mockResolvedValueOnce({
        id: "cs_123",
        url: "https://checkout.stripe.com/test",
      });

      const response = await app.request("/api/payments/checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader("ADMIN", "admin-1"),
        },
        body: JSON.stringify({ bookingId: "booking-1" }),
      });

      expect(response.status).toBe(200);
    });

    it("should allow STAFF to create checkout for any booking", async () => {
      stripeEnabledMock.mockReturnValue(true);
      bookingMock.findUnique.mockResolvedValueOnce({
        id: "booking-1",
        userId: "client-123",
        totalPrice: 200,
        service: { name: "Service" },
        user: { email: "client@example.com" },
        property: {},
      });

      bookingMock.update.mockResolvedValueOnce({
        id: "booking-1",
        service: {},
        user: {},
        property: {},
      });

      mockStripe.checkout.sessions.create.mockResolvedValueOnce({
        id: "cs_456",
        url: "https://checkout.stripe.com/staff",
      });

      const response = await app.request("/api/payments/checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader("STAFF", "staff-1"),
        },
        body: JSON.stringify({ bookingId: "booking-1" }),
      });

      expect(response.status).toBe(200);
    });
  });

  describe("Stripe Integration", () => {
    it("should create checkout session with correct parameters", async () => {
      stripeEnabledMock.mockReturnValue(true);
      bookingMock.findUnique.mockResolvedValueOnce({
        id: "booking-1",
        userId: "client-1",
        totalPrice: 199.99,
        service: {
          id: "svc-1",
          name: "Deep Clean",
          description: "Professional cleaning service",
        },
        user: { email: "client@example.com" },
        property: {},
      });

      bookingMock.update.mockResolvedValueOnce({
        id: "booking-1",
        service: {},
        user: {},
        property: {},
      });

      mockStripe.checkout.sessions.create.mockResolvedValueOnce({
        id: "cs_test",
        url: "https://checkout.stripe.com/session",
      });

      await app.request("/api/payments/checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader("CLIENT", "client-1"),
        },
        body: JSON.stringify({ bookingId: "booking-1" }),
      });

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith({
        mode: "payment",
        success_url: expect.stringContaining("payment=success"),
        cancel_url: expect.stringContaining("payment=cancelled"),
        customer_email: "client@example.com",
        metadata: {
          bookingId: "booking-1",
        },
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Deep Clean",
                description: "Professional cleaning service",
              },
              unit_amount: 19999, // $199.99 in cents
            },
            quantity: 1,
          },
        ],
      });
    });

    it("should handle service without description", async () => {
      stripeEnabledMock.mockReturnValue(true);
      bookingMock.findUnique.mockResolvedValueOnce({
        id: "booking-1",
        userId: "client-1",
        totalPrice: 100,
        service: {
          name: "Basic Service",
          description: null,
        },
        user: { email: "client@example.com" },
        property: {},
      });

      bookingMock.update.mockResolvedValueOnce({
        id: "booking-1",
        service: {},
        user: {},
        property: {},
      });

      mockStripe.checkout.sessions.create.mockResolvedValueOnce({
        id: "cs_test",
        url: "https://checkout.stripe.com/session",
      });

      await app.request("/api/payments/checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader("CLIENT", "client-1"),
        },
        body: JSON.stringify({ bookingId: "booking-1" }),
      });

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: [
            expect.objectContaining({
              price_data: expect.objectContaining({
                product_data: {
                  name: "Basic Service",
                  description: undefined,
                },
              }),
            }),
          ],
        }),
      );
    });

    it("should convert price to cents correctly", async () => {
      stripeEnabledMock.mockReturnValue(true);
      bookingMock.findUnique.mockResolvedValueOnce({
        id: "booking-1",
        userId: "client-1",
        totalPrice: 49.99,
        service: { name: "Service" },
        user: { email: "client@example.com" },
        property: {},
      });

      bookingMock.update.mockResolvedValueOnce({
        id: "booking-1",
        service: {},
        user: {},
        property: {},
      });

      mockStripe.checkout.sessions.create.mockResolvedValueOnce({
        id: "cs_test",
        url: "https://checkout.stripe.com/session",
      });

      await app.request("/api/payments/checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader("CLIENT", "client-1"),
        },
        body: JSON.stringify({ bookingId: "booking-1" }),
      });

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: [
            expect.objectContaining({
              price_data: expect.objectContaining({
                unit_amount: 4999, // $49.99 in cents
              }),
            }),
          ],
        }),
      );
    });

    it("should update booking with checkout session details", async () => {
      stripeEnabledMock.mockReturnValue(true);
      bookingMock.findUnique.mockResolvedValueOnce({
        id: "booking-123",
        userId: "client-1",
        totalPrice: 100,
        service: { name: "Service" },
        user: { email: "client@example.com" },
        property: {},
      });

      bookingMock.update.mockResolvedValueOnce({
        id: "booking-123",
        checkoutSessionId: "cs_xyz",
        paymentStatus: "PENDING_PAYMENT",
        service: {},
        user: {},
        property: {},
      });

      mockStripe.checkout.sessions.create.mockResolvedValueOnce({
        id: "cs_xyz",
        url: "https://checkout.stripe.com/xyz",
        payment_intent: "pi_123",
      });

      await app.request("/api/payments/checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader("CLIENT", "client-1"),
        },
        body: JSON.stringify({ bookingId: "booking-123" }),
      });

      expect(bookingMock.update).toHaveBeenCalledWith({
        where: { id: "booking-123" },
        data: {
          checkoutSessionId: "cs_xyz",
          paymentStatus: "PENDING_PAYMENT",
          paymentIntentId: "pi_123",
        },
        include: {
          service: true,
          user: true,
          property: true,
        },
      });
    });

    it("should handle payment_intent as object", async () => {
      stripeEnabledMock.mockReturnValue(true);
      bookingMock.findUnique.mockResolvedValueOnce({
        id: "booking-1",
        userId: "client-1",
        totalPrice: 100,
        service: { name: "Service" },
        user: { email: "client@example.com" },
        property: {},
      });

      bookingMock.update.mockResolvedValueOnce({
        id: "booking-1",
        service: {},
        user: {},
        property: {},
      });

      mockStripe.checkout.sessions.create.mockResolvedValueOnce({
        id: "cs_test",
        url: "https://checkout.stripe.com/test",
        payment_intent: { id: "pi_obj_123", status: "pending" },
      });

      await app.request("/api/payments/checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader("CLIENT", "client-1"),
        },
        body: JSON.stringify({ bookingId: "booking-1" }),
      });

      expect(bookingMock.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            paymentIntentId: "pi_obj_123",
          }),
        }),
      );
    });

    it("should return checkout URL in response", async () => {
      stripeEnabledMock.mockReturnValue(true);
      bookingMock.findUnique.mockResolvedValueOnce({
        id: "booking-1",
        userId: "client-1",
        totalPrice: 100,
        service: { name: "Service" },
        user: { email: "client@example.com" },
        property: {},
      });

      bookingMock.update.mockResolvedValueOnce({
        id: "booking-1",
        service: {},
        user: {},
        property: {},
      });

      mockStripe.checkout.sessions.create.mockResolvedValueOnce({
        id: "cs_test",
        url: "https://checkout.stripe.com/unique-session",
      });

      const response = await app.request("/api/payments/checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader("CLIENT", "client-1"),
        },
        body: JSON.stringify({ bookingId: "booking-1" }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.checkoutUrl).toBe(
        "https://checkout.stripe.com/unique-session",
      );
      expect(data.booking).toBeDefined();
    });

    it("should return 500 when Stripe API fails", async () => {
      stripeEnabledMock.mockReturnValue(true);
      bookingMock.findUnique.mockResolvedValueOnce({
        id: "booking-1",
        userId: "client-1",
        totalPrice: 100,
        service: { name: "Service" },
        user: { email: "client@example.com" },
        property: {},
      });

      mockStripe.checkout.sessions.create.mockRejectedValueOnce(
        new Error("Stripe API error"),
      );

      const response = await app.request("/api/payments/checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader("CLIENT", "client-1"),
        },
        body: JSON.stringify({ bookingId: "booking-1" }),
      });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe("Unable to create checkout session");
    });
  });

  describe("Environment Configuration", () => {
    it("should use custom success URL from env", async () => {
      process.env.STRIPE_SUCCESS_URL = "https://custom.com/success";
      env.stripe.successUrl = process.env.STRIPE_SUCCESS_URL;
      stripeEnabledMock.mockReturnValue(true);

      bookingMock.findUnique.mockResolvedValueOnce({
        id: "booking-1",
        userId: "client-1",
        totalPrice: 100,
        service: { name: "Service" },
        user: { email: "client@example.com" },
        property: {},
      });

      bookingMock.update.mockResolvedValueOnce({
        id: "booking-1",
        service: {},
        user: {},
        property: {},
      });

      mockStripe.checkout.sessions.create.mockResolvedValueOnce({
        id: "cs_test",
        url: "https://checkout.stripe.com/test",
      });

      await app.request("/api/payments/checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader("CLIENT", "client-1"),
        },
        body: JSON.stringify({ bookingId: "booking-1" }),
      });

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          success_url: "https://custom.com/success",
        }),
      );

      delete process.env.STRIPE_SUCCESS_URL;
      env.stripe.successUrl = undefined;
    });

    it("should use custom cancel URL from env", async () => {
      process.env.STRIPE_CANCEL_URL = "https://custom.com/cancelled";
      env.stripe.cancelUrl = process.env.STRIPE_CANCEL_URL;
      stripeEnabledMock.mockReturnValue(true);

      bookingMock.findUnique.mockResolvedValueOnce({
        id: "booking-1",
        userId: "client-1",
        totalPrice: 100,
        service: { name: "Service" },
        user: { email: "client@example.com" },
        property: {},
      });

      bookingMock.update.mockResolvedValueOnce({
        id: "booking-1",
        service: {},
        user: {},
        property: {},
      });

      mockStripe.checkout.sessions.create.mockResolvedValueOnce({
        id: "cs_test",
        url: "https://checkout.stripe.com/test",
      });

      await app.request("/api/payments/checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader("CLIENT", "client-1"),
        },
        body: JSON.stringify({ bookingId: "booking-1" }),
      });

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          cancel_url: "https://custom.com/cancelled",
        }),
      );

      delete process.env.STRIPE_CANCEL_URL;
      env.stripe.cancelUrl = env.webAppUrl
        ? `${env.webAppUrl}/dashboard?payment=cancelled`
        : undefined;
    });
  });
});

describe("Payments Extended - POST /webhook", () => {
  let app: Hono;
  let mockStripe: any;

  beforeEach(() => {
    app = buildApp();
    vi.clearAllMocks();

    mockStripe = {
      checkout: {
        sessions: {
          create: vi.fn(),
        },
      },
      webhooks: {
        constructEvent: vi.fn(),
      },
    };

    getStripeMock.mockReturnValue(mockStripe);
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_secret";
    env.stripe.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  });

  describe("Webhook Validation", () => {
    it("should return 200 when Stripe is disabled", async () => {
      stripeEnabledMock.mockReturnValue(false);

      const response = await app.request("/api/payments/webhook", {
        method: "POST",
        headers: { "stripe-signature": "sig" },
        body: "{}",
      });

      expect(response.status).toBe(200);
      const text = await response.text();
      expect(text).toBe("Stripe disabled");
    });

    it("should return 400 when signature is missing", async () => {
      stripeEnabledMock.mockReturnValue(true);

      const response = await app.request("/api/payments/webhook", {
        method: "POST",
        body: "{}",
      });

      expect(response.status).toBe(400);
      const text = await response.text();
      expect(text).toBe("Missing signature");
    });

    it("should return 400 when webhook secret is not configured", async () => {
      stripeEnabledMock.mockReturnValue(true);
      delete process.env.STRIPE_WEBHOOK_SECRET;
      env.stripe.webhookSecret = undefined;

      const response = await app.request("/api/payments/webhook", {
        method: "POST",
        headers: { "stripe-signature": "sig" },
        body: "{}",
      });

      expect(response.status).toBe(400);
      const text = await response.text();
      expect(text).toBe("Missing signature");

      process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_secret";
      env.stripe.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    });

    it("should return 400 when signature verification fails", async () => {
      stripeEnabledMock.mockReturnValue(true);
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error("Invalid signature");
      });

      const response = await app.request("/api/payments/webhook", {
        method: "POST",
        headers: { "stripe-signature": "invalid_sig" },
        body: "{}",
      });

      expect(response.status).toBe(400);
      const text = await response.text();
      expect(text).toBe("Signature verification failed");
    });

    it("should verify webhook with correct parameters", async () => {
      stripeEnabledMock.mockReturnValue(true);
      mockStripe.webhooks.constructEvent.mockReturnValue({
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_test",
            metadata: { bookingId: "booking-1" },
          },
        },
      });

      bookingMock.update.mockResolvedValueOnce({});

      await app.request("/api/payments/webhook", {
        method: "POST",
        headers: { "stripe-signature": "valid_sig" },
        body: '{"test": "payload"}',
      });

      expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
        '{"test": "payload"}',
        "valid_sig",
        "whsec_test_secret",
      );
    });
  });

  describe("Webhook Event Handling - checkout.session.completed", () => {
    it("should update booking to PAID and CONFIRMED", async () => {
      stripeEnabledMock.mockReturnValue(true);
      mockStripe.webhooks.constructEvent.mockReturnValue({
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_success",
            payment_intent: "pi_success",
            metadata: {
              bookingId: "booking-success",
            },
          },
        },
      });

      bookingMock.update.mockResolvedValueOnce({});

      const response = await app.request("/api/payments/webhook", {
        method: "POST",
        headers: { "stripe-signature": "sig" },
        body: "{}",
      });

      expect(response.status).toBe(200);
      expect(bookingMock.update).toHaveBeenCalledWith({
        where: { id: "booking-success" },
        data: {
          paymentStatus: "PAID",
          status: "CONFIRMED",
          paymentIntentId: "pi_success",
          checkoutSessionId: "cs_success",
        },
      });
    });

    it("should handle payment_intent as object in completed event", async () => {
      stripeEnabledMock.mockReturnValue(true);
      mockStripe.webhooks.constructEvent.mockReturnValue({
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_test",
            payment_intent: { id: "pi_obj", status: "succeeded" },
            metadata: { bookingId: "booking-1" },
          },
        },
      });

      bookingMock.update.mockResolvedValueOnce({});

      await app.request("/api/payments/webhook", {
        method: "POST",
        headers: { "stripe-signature": "sig" },
        body: "{}",
      });

      expect(bookingMock.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            paymentIntentId: "pi_obj",
          }),
        }),
      );
    });

    it("should skip update if no bookingId in metadata", async () => {
      stripeEnabledMock.mockReturnValue(true);
      mockStripe.webhooks.constructEvent.mockReturnValue({
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_test",
            metadata: {},
          },
        },
      });

      const response = await app.request("/api/payments/webhook", {
        method: "POST",
        headers: { "stripe-signature": "sig" },
        body: "{}",
      });

      expect(response.status).toBe(200);
      expect(bookingMock.update).not.toHaveBeenCalled();
    });
  });

  describe("Webhook Event Handling - checkout.session.expired", () => {
    it("should mark booking as FAILED when session expires", async () => {
      stripeEnabledMock.mockReturnValue(true);
      mockStripe.webhooks.constructEvent.mockReturnValue({
        type: "checkout.session.expired",
        data: {
          object: {
            id: "cs_expired",
            metadata: {
              bookingId: "booking-expired",
            },
          },
        },
      });

      bookingMock.update.mockResolvedValueOnce({});

      const response = await app.request("/api/payments/webhook", {
        method: "POST",
        headers: { "stripe-signature": "sig" },
        body: "{}",
      });

      expect(response.status).toBe(200);
      expect(bookingMock.update).toHaveBeenCalledWith({
        where: { id: "booking-expired" },
        data: {
          paymentStatus: "FAILED",
        },
      });
    });

    it("should skip update if no bookingId for expired session", async () => {
      stripeEnabledMock.mockReturnValue(true);
      mockStripe.webhooks.constructEvent.mockReturnValue({
        type: "checkout.session.expired",
        data: {
          object: {
            id: "cs_expired",
            metadata: {},
          },
        },
      });

      const response = await app.request("/api/payments/webhook", {
        method: "POST",
        headers: { "stripe-signature": "sig" },
        body: "{}",
      });

      expect(response.status).toBe(200);
      expect(bookingMock.update).not.toHaveBeenCalled();
    });
  });

  describe("Webhook Event Handling - payment_intent.payment_failed", () => {
    it("should mark booking as FAILED when payment fails", async () => {
      stripeEnabledMock.mockReturnValue(true);
      mockStripe.webhooks.constructEvent.mockReturnValue({
        type: "payment_intent.payment_failed",
        data: {
          object: {
            id: "pi_failed",
          },
        },
      });

      bookingMock.findFirst.mockResolvedValueOnce({
        id: "booking-failed",
      });

      bookingMock.update.mockResolvedValueOnce({});

      const response = await app.request("/api/payments/webhook", {
        method: "POST",
        headers: { "stripe-signature": "sig" },
        body: "{}",
      });

      expect(response.status).toBe(200);
      expect(bookingMock.findFirst).toHaveBeenCalledWith({
        where: { paymentIntentId: "pi_failed" },
      });
      expect(bookingMock.update).toHaveBeenCalledWith({
        where: { id: "booking-failed" },
        data: { paymentStatus: "FAILED" },
      });
    });

    it("should not update if booking not found for failed payment", async () => {
      stripeEnabledMock.mockReturnValue(true);
      mockStripe.webhooks.constructEvent.mockReturnValue({
        type: "payment_intent.payment_failed",
        data: {
          object: {
            id: "pi_unknown",
          },
        },
      });

      bookingMock.findFirst.mockResolvedValueOnce(null);

      const response = await app.request("/api/payments/webhook", {
        method: "POST",
        headers: { "stripe-signature": "sig" },
        body: "{}",
      });

      expect(response.status).toBe(200);
      expect(bookingMock.update).not.toHaveBeenCalled();
    });
  });

  describe("Webhook Event Handling - Unknown Events", () => {
    it("should return 200 for unknown event types", async () => {
      stripeEnabledMock.mockReturnValue(true);
      mockStripe.webhooks.constructEvent.mockReturnValue({
        type: "unknown.event.type",
        data: {
          object: {},
        },
      });

      const response = await app.request("/api/payments/webhook", {
        method: "POST",
        headers: { "stripe-signature": "sig" },
        body: "{}",
      });

      expect(response.status).toBe(200);
      expect(bookingMock.update).not.toHaveBeenCalled();
    });

    it("should handle customer.subscription.created gracefully", async () => {
      stripeEnabledMock.mockReturnValue(true);
      mockStripe.webhooks.constructEvent.mockReturnValue({
        type: "customer.subscription.created",
        data: {
          object: { id: "sub_123" },
        },
      });

      const response = await app.request("/api/payments/webhook", {
        method: "POST",
        headers: { "stripe-signature": "sig" },
        body: "{}",
      });

      expect(response.status).toBe(200);
    });
  });

  describe("Webhook Error Handling", () => {
    it("should return 500 when webhook processing fails", async () => {
      stripeEnabledMock.mockReturnValue(true);
      mockStripe.webhooks.constructEvent.mockReturnValue({
        type: "checkout.session.completed",
        data: {
          object: {
            metadata: { bookingId: "booking-1" },
          },
        },
      });

      bookingMock.update.mockRejectedValueOnce(new Error("Database error"));

      const response = await app.request("/api/payments/webhook", {
        method: "POST",
        headers: { "stripe-signature": "sig" },
        body: "{}",
      });

      expect(response.status).toBe(500);
      const text = await response.text();
      expect(text).toBe("Webhook handler failed");
    });
  });
});
