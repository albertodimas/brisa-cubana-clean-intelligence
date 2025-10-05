import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock twilio module
const mockCreate = vi.fn();
vi.mock("twilio", () => ({
  default: vi.fn(() => ({
    messages: {
      create: mockCreate,
    },
  })),
}));

// Mock logger
vi.mock("./logger", () => ({
  logger: {
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Twilio Module", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.resetModules();
  });

  describe("getTwilioClient", () => {
    it("should return null when credentials are not configured", async () => {
      delete process.env.TWILIO_ACCOUNT_SID;
      delete process.env.TWILIO_AUTH_TOKEN;

      const { getTwilioClient } = await import("./twilio");
      const client = getTwilioClient();
      expect(client).toBeNull();
    });

    it("should return null when only account SID is provided", async () => {
      process.env.TWILIO_ACCOUNT_SID = "AC123";
      delete process.env.TWILIO_AUTH_TOKEN;

      const { getTwilioClient } = await import("./twilio");
      const client = getTwilioClient();
      expect(client).toBeNull();
    });

    it("should return null when only auth token is provided", async () => {
      delete process.env.TWILIO_ACCOUNT_SID;
      process.env.TWILIO_AUTH_TOKEN = "token123";

      const { getTwilioClient } = await import("./twilio");
      const client = getTwilioClient();
      expect(client).toBeNull();
    });

    it("should initialize client when credentials are provided", async () => {
      process.env.TWILIO_ACCOUNT_SID = "AC123";
      process.env.TWILIO_AUTH_TOKEN = "token123";

      const { getTwilioClient } = await import("./twilio");
      const client = getTwilioClient();
      expect(client).not.toBeNull();
    });

    it("should reuse existing client on subsequent calls", async () => {
      process.env.TWILIO_ACCOUNT_SID = "AC123";
      process.env.TWILIO_AUTH_TOKEN = "token123";

      const { getTwilioClient } = await import("./twilio");
      const client1 = getTwilioClient();
      const client2 = getTwilioClient();

      expect(client1).toBe(client2);
    });
  });

  describe("twilioEnabled", () => {
    it("should return false when no credentials", async () => {
      delete process.env.TWILIO_ACCOUNT_SID;
      delete process.env.TWILIO_AUTH_TOKEN;
      delete process.env.TWILIO_PHONE_NUMBER;
      delete process.env.TWILIO_WHATSAPP_FROM;

      const { twilioEnabled } = await import("./twilio");
      expect(twilioEnabled()).toBe(false);
    });

    it("should return false when credentials but no phone number", async () => {
      process.env.TWILIO_ACCOUNT_SID = "AC123";
      process.env.TWILIO_AUTH_TOKEN = "token123";
      delete process.env.TWILIO_PHONE_NUMBER;
      delete process.env.TWILIO_WHATSAPP_FROM;

      const { twilioEnabled } = await import("./twilio");
      expect(twilioEnabled()).toBe(false);
    });

    it("should return true when SMS phone number is configured", async () => {
      process.env.TWILIO_ACCOUNT_SID = "AC123";
      process.env.TWILIO_AUTH_TOKEN = "token123";
      process.env.TWILIO_PHONE_NUMBER = "+15551234567";
      delete process.env.TWILIO_WHATSAPP_FROM;

      const { twilioEnabled } = await import("./twilio");
      expect(twilioEnabled()).toBe(true);
    });

    it("should return true when WhatsApp number is configured", async () => {
      process.env.TWILIO_ACCOUNT_SID = "AC123";
      process.env.TWILIO_AUTH_TOKEN = "token123";
      delete process.env.TWILIO_PHONE_NUMBER;
      process.env.TWILIO_WHATSAPP_FROM = "whatsapp:+15551234567";

      const { twilioEnabled } = await import("./twilio");
      expect(twilioEnabled()).toBe(true);
    });

    it("should return true when both phone numbers are configured", async () => {
      process.env.TWILIO_ACCOUNT_SID = "AC123";
      process.env.TWILIO_AUTH_TOKEN = "token123";
      process.env.TWILIO_PHONE_NUMBER = "+15551234567";
      process.env.TWILIO_WHATSAPP_FROM = "whatsapp:+15551234567";

      const { twilioEnabled } = await import("./twilio");
      expect(twilioEnabled()).toBe(true);
    });
  });

  describe("getPhoneNumber", () => {
    it("should return undefined when not configured", async () => {
      delete process.env.TWILIO_PHONE_NUMBER;
      const { getPhoneNumber } = await import("./twilio");
      expect(getPhoneNumber()).toBeUndefined();
    });

    it("should return configured phone number", async () => {
      process.env.TWILIO_PHONE_NUMBER = "+15551234567";
      const { getPhoneNumber } = await import("./twilio");
      expect(getPhoneNumber()).toBe("+15551234567");
    });
  });

  describe("getWhatsAppNumber", () => {
    it("should return undefined when not configured", async () => {
      delete process.env.TWILIO_WHATSAPP_FROM;
      const { getWhatsAppNumber } = await import("./twilio");
      expect(getWhatsAppNumber()).toBeUndefined();
    });

    it("should return configured WhatsApp number", async () => {
      process.env.TWILIO_WHATSAPP_FROM = "whatsapp:+15551234567";
      const { getWhatsAppNumber } = await import("./twilio");
      expect(getWhatsAppNumber()).toBe("whatsapp:+15551234567");
    });
  });

  describe("sendSMS", () => {
    it("should return failure when Twilio is not configured", async () => {
      delete process.env.TWILIO_ACCOUNT_SID;
      delete process.env.TWILIO_AUTH_TOKEN;

      const { sendSMS } = await import("./twilio");
      const result = await sendSMS({
        to: "+15559876543",
        body: "Test message",
      });

      expect(result.success).toBe(false);
      expect(result.messageId).toBeUndefined();
    });

    it("should return failure when phone number is not configured", async () => {
      process.env.TWILIO_ACCOUNT_SID = "AC123";
      process.env.TWILIO_AUTH_TOKEN = "token123";
      delete process.env.TWILIO_PHONE_NUMBER;

      const { sendSMS } = await import("./twilio");
      const result = await sendSMS({
        to: "+15559876543",
        body: "Test message",
      });

      expect(result.success).toBe(false);
    });

    it("should send SMS successfully", async () => {
      process.env.TWILIO_ACCOUNT_SID = "AC123";
      process.env.TWILIO_AUTH_TOKEN = "token123";
      process.env.TWILIO_PHONE_NUMBER = "+15551234567";

      mockCreate.mockResolvedValue({
        sid: "SM123456",
        status: "sent",
      });

      const { sendSMS } = await import("./twilio");
      const result = await sendSMS({
        to: "+15559876543",
        body: "Test message",
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe("SM123456");
      expect(mockCreate).toHaveBeenCalledWith({
        from: "+15551234567",
        to: "+15559876543",
        body: "Test message",
      });
    });

    it("should handle SMS sending errors gracefully", async () => {
      process.env.TWILIO_ACCOUNT_SID = "AC123";
      process.env.TWILIO_AUTH_TOKEN = "token123";
      process.env.TWILIO_PHONE_NUMBER = "+15551234567";

      mockCreate.mockRejectedValue(new Error("Network error"));

      const { sendSMS } = await import("./twilio");
      const result = await sendSMS({
        to: "+15559876543",
        body: "Test message",
      });

      expect(result.success).toBe(false);
      expect(result.messageId).toBeUndefined();
    });
  });

  describe("sendWhatsApp", () => {
    it("should return failure when Twilio is not configured", async () => {
      delete process.env.TWILIO_ACCOUNT_SID;
      delete process.env.TWILIO_AUTH_TOKEN;

      const { sendWhatsApp } = await import("./twilio");
      const result = await sendWhatsApp({
        to: "+15559876543",
        body: "Test message",
      });

      expect(result.success).toBe(false);
      expect(result.messageId).toBeUndefined();
    });

    it("should return failure when WhatsApp number is not configured", async () => {
      process.env.TWILIO_ACCOUNT_SID = "AC123";
      process.env.TWILIO_AUTH_TOKEN = "token123";
      delete process.env.TWILIO_WHATSAPP_FROM;

      const { sendWhatsApp } = await import("./twilio");
      const result = await sendWhatsApp({
        to: "+15559876543",
        body: "Test message",
      });

      expect(result.success).toBe(false);
    });

    it("should send WhatsApp message successfully", async () => {
      process.env.TWILIO_ACCOUNT_SID = "AC123";
      process.env.TWILIO_AUTH_TOKEN = "token123";
      process.env.TWILIO_WHATSAPP_FROM = "whatsapp:+15551234567";

      mockCreate.mockResolvedValue({
        sid: "WA123456",
        status: "sent",
      });

      const { sendWhatsApp } = await import("./twilio");
      const result = await sendWhatsApp({
        to: "+15559876543",
        body: "Test message",
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe("WA123456");
      expect(mockCreate).toHaveBeenCalledWith({
        from: "whatsapp:+15551234567",
        to: "whatsapp:+15559876543",
        body: "Test message",
      });
    });

    it("should format 'to' number with whatsapp: prefix", async () => {
      process.env.TWILIO_ACCOUNT_SID = "AC123";
      process.env.TWILIO_AUTH_TOKEN = "token123";
      process.env.TWILIO_WHATSAPP_FROM = "whatsapp:+15551234567";

      mockCreate.mockResolvedValue({
        sid: "WA123456",
        status: "sent",
      });

      const { sendWhatsApp } = await import("./twilio");
      await sendWhatsApp({
        to: "+15559876543",
        body: "Test message",
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "whatsapp:+15559876543",
        }),
      );
    });

    it("should not double-prefix 'to' number if already formatted", async () => {
      process.env.TWILIO_ACCOUNT_SID = "AC123";
      process.env.TWILIO_AUTH_TOKEN = "token123";
      process.env.TWILIO_WHATSAPP_FROM = "whatsapp:+15551234567";

      mockCreate.mockResolvedValue({
        sid: "WA123456",
        status: "sent",
      });

      const { sendWhatsApp } = await import("./twilio");
      await sendWhatsApp({
        to: "whatsapp:+15559876543",
        body: "Test message",
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "whatsapp:+15559876543",
        }),
      );
    });

    it("should handle WhatsApp sending errors gracefully", async () => {
      process.env.TWILIO_ACCOUNT_SID = "AC123";
      process.env.TWILIO_AUTH_TOKEN = "token123";
      process.env.TWILIO_WHATSAPP_FROM = "whatsapp:+15551234567";

      mockCreate.mockRejectedValue(new Error("Invalid recipient"));

      const { sendWhatsApp } = await import("./twilio");
      const result = await sendWhatsApp({
        to: "+15559876543",
        body: "Test message",
      });

      expect(result.success).toBe(false);
      expect(result.messageId).toBeUndefined();
    });
  });
});
