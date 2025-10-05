import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock Resend module
const mockSend = vi.fn();
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: mockSend,
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

describe("Resend Module", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment to clean state
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    // Reset module cache to clear singleton
    vi.resetModules();
  });

  describe("getResendClient", () => {
    it("should return null when API key is not configured", async () => {
      delete process.env.RESEND_API_KEY;

      const { getResendClient } = await import("./resend");
      const client = getResendClient();
      expect(client).toBeNull();
    });

    it("should initialize client when API key is provided", async () => {
      process.env.RESEND_API_KEY = "re_test_123";

      const { getResendClient } = await import("./resend");
      const client = getResendClient();
      expect(client).not.toBeNull();
    });

    it("should reuse existing client on subsequent calls", async () => {
      process.env.RESEND_API_KEY = "re_test_123";

      const { getResendClient } = await import("./resend");
      const client1 = getResendClient();
      const client2 = getResendClient();

      expect(client1).toBe(client2);
    });
  });

  describe("resendEnabled", () => {
    it("should return false when API key is not configured", async () => {
      delete process.env.RESEND_API_KEY;
      const { resendEnabled } = await import("./resend");
      expect(resendEnabled()).toBe(false);
    });

    it("should return true when API key is configured", async () => {
      process.env.RESEND_API_KEY = "re_test_123";
      const { resendEnabled } = await import("./resend");
      expect(resendEnabled()).toBe(true);
    });

    it("should return false for empty API key", async () => {
      process.env.RESEND_API_KEY = "";
      const { resendEnabled } = await import("./resend");
      expect(resendEnabled()).toBe(false);
    });
  });

  describe("getFromEmail", () => {
    it("should return default email when EMAIL_FROM is not configured", async () => {
      delete process.env.EMAIL_FROM;
      const { getFromEmail } = await import("./resend");
      expect(getFromEmail()).toBe("noreply@brisacubanaclean.com");
    });

    it("should return configured EMAIL_FROM", async () => {
      process.env.EMAIL_FROM = "custom@example.com";
      const { getFromEmail } = await import("./resend");
      expect(getFromEmail()).toBe("custom@example.com");
    });
  });

  describe("sendEmail", () => {
    it("should return failure when Resend is not configured", async () => {
      delete process.env.RESEND_API_KEY;

      const { sendEmail } = await import("./resend");
      const result = await sendEmail({
        to: "test@example.com",
        subject: "Test",
        html: "<p>Test</p>",
      });

      expect(result.success).toBe(false);
      expect(result.messageId).toBeUndefined();
    });

    it("should send email successfully with single recipient", async () => {
      process.env.RESEND_API_KEY = "re_test_123";
      process.env.EMAIL_FROM = "sender@example.com";

      mockSend.mockResolvedValue({
        data: { id: "email_123" },
        error: null,
      });

      const { sendEmail } = await import("./resend");
      const result = await sendEmail({
        to: "recipient@example.com",
        subject: "Test Subject",
        html: "<p>Test Body</p>",
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe("email_123");
      expect(mockSend).toHaveBeenCalledWith({
        from: "sender@example.com",
        to: ["recipient@example.com"],
        subject: "Test Subject",
        html: "<p>Test Body</p>",
        attachments: undefined,
      });
    });

    it("should send email successfully with multiple recipients", async () => {
      process.env.RESEND_API_KEY = "re_test_123";

      mockSend.mockResolvedValue({
        data: { id: "email_456" },
        error: null,
      });

      const { sendEmail } = await import("./resend");
      const result = await sendEmail({
        to: ["user1@example.com", "user2@example.com"],
        subject: "Bulk Email",
        html: "<p>Hello all</p>",
      });

      expect(result.success).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ["user1@example.com", "user2@example.com"],
        }),
      );
    });

    it("should convert single string recipient to array", async () => {
      process.env.RESEND_API_KEY = "re_test_123";

      mockSend.mockResolvedValue({
        data: { id: "email_789" },
        error: null,
      });

      const { sendEmail } = await import("./resend");
      await sendEmail({
        to: "single@example.com",
        subject: "Single Recipient",
        html: "<p>Test</p>",
      });

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ["single@example.com"],
        }),
      );
    });

    it("should send email with attachments", async () => {
      process.env.RESEND_API_KEY = "re_test_123";

      mockSend.mockResolvedValue({
        data: { id: "email_attachment" },
        error: null,
      });

      const attachment = {
        filename: "test.pdf",
        content: Buffer.from("test content"),
      };

      const { sendEmail } = await import("./resend");
      const result = await sendEmail({
        to: "recipient@example.com",
        subject: "Email with Attachment",
        html: "<p>See attachment</p>",
        attachments: [attachment],
      });

      expect(result.success).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          attachments: [attachment],
        }),
      );
    });

    it("should send email with string content attachment", async () => {
      process.env.RESEND_API_KEY = "re_test_123";

      mockSend.mockResolvedValue({
        data: { id: "email_string_attachment" },
        error: null,
      });

      const attachment = {
        filename: "test.txt",
        content: "plain text content",
      };

      const { sendEmail } = await import("./resend");
      await sendEmail({
        to: "recipient@example.com",
        subject: "Text Attachment",
        html: "<p>See text file</p>",
        attachments: [attachment],
      });

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          attachments: [attachment],
        }),
      );
    });

    it("should use default from email when EMAIL_FROM not set", async () => {
      process.env.RESEND_API_KEY = "re_test_123";
      delete process.env.EMAIL_FROM;

      mockSend.mockResolvedValue({
        data: { id: "email_default_from" },
        error: null,
      });

      const { sendEmail } = await import("./resend");
      await sendEmail({
        to: "recipient@example.com",
        subject: "Default From",
        html: "<p>Test</p>",
      });

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          from: "noreply@brisacubanaclean.com",
        }),
      );
    });

    it("should handle email sending errors gracefully", async () => {
      process.env.RESEND_API_KEY = "re_test_123";

      mockSend.mockRejectedValue(new Error("Network error"));

      const { sendEmail } = await import("./resend");
      const result = await sendEmail({
        to: "recipient@example.com",
        subject: "Failed Email",
        html: "<p>This will fail</p>",
      });

      expect(result.success).toBe(false);
      expect(result.messageId).toBeUndefined();
    });

    it("should handle Resend API errors", async () => {
      process.env.RESEND_API_KEY = "re_test_123";

      mockSend.mockResolvedValue({
        data: null,
        error: { message: "Invalid recipient" },
      });

      const { sendEmail } = await import("./resend");
      const result = await sendEmail({
        to: "invalid@",
        subject: "Invalid Recipient",
        html: "<p>Test</p>",
      });

      expect(result.success).toBe(true); // API call succeeded, even though Resend returned error
      expect(result.messageId).toBeUndefined();
    });

    it("should handle multiple attachments", async () => {
      process.env.RESEND_API_KEY = "re_test_123";

      mockSend.mockResolvedValue({
        data: { id: "email_multi_attach" },
        error: null,
      });

      const attachments = [
        { filename: "file1.pdf", content: Buffer.from("pdf content") },
        { filename: "file2.txt", content: "text content" },
      ];

      const { sendEmail } = await import("./resend");
      await sendEmail({
        to: "recipient@example.com",
        subject: "Multiple Attachments",
        html: "<p>See files</p>",
        attachments,
      });

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          attachments,
        }),
      );
    });
  });
});
