import { beforeEach, describe, expect, it, vi } from "vitest";

const twilioMock = vi.hoisted(() => ({
  sendWhatsApp: vi.fn(),
  sendSMS: vi.fn(),
  twilioEnabled: vi.fn(),
}));

vi.mock("../lib/twilio", () => twilioMock);

const resendMock = vi.hoisted(() => ({
  sendEmail: vi.fn(),
  resendEnabled: vi.fn(),
}));

vi.mock("../lib/resend", () => resendMock);

const { sendWhatsApp, sendSMS, twilioEnabled } = twilioMock;
const { sendEmail, resendEnabled } = resendMock;

import {
  sendBookingConfirmation,
  sendCompletionNotification,
  sendStatusUpdate,
  sendReminder,
  sendConciergeEmail,
} from "./notifications";

const bookingData = {
  clientName: "Ana",
  clientPhone: "+13055550100",
  serviceName: "Limpieza Premium",
  propertyName: "Skyline Loft",
  propertyAddress: "890 Biscayne Blvd",
  scheduledDate: "2025-10-04",
  scheduledTime: "10:00",
  totalPrice: "180.00",
  bookingId: "booking-123",
};

describe("notifications service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("skips booking confirmation when Twilio is disabled", async () => {
    twilioEnabled.mockReturnValue(false);

    const result = await sendBookingConfirmation(bookingData);

    expect(result.success).toBe(false);
    expect(sendWhatsApp).not.toHaveBeenCalled();
    expect(sendSMS).not.toHaveBeenCalled();
  });

  it("sends booking confirmation via WhatsApp when available", async () => {
    twilioEnabled.mockReturnValue(true);
    sendWhatsApp.mockResolvedValueOnce({ success: true });

    const result = await sendBookingConfirmation(bookingData);

    expect(result.success).toBe(true);
    expect(sendWhatsApp).toHaveBeenCalledWith({
      to: bookingData.clientPhone,
      body: expect.stringContaining("Reserva Confirmada"),
    });
    expect(sendSMS).not.toHaveBeenCalled();
  });

  it("falls back to SMS when WhatsApp fails", async () => {
    twilioEnabled.mockReturnValue(true);
    sendWhatsApp.mockResolvedValueOnce({ success: false });
    sendSMS.mockResolvedValueOnce({ success: true });

    const result = await sendBookingConfirmation(bookingData);

    expect(result.success).toBe(true);
    expect(sendWhatsApp).toHaveBeenCalled();
    expect(sendSMS).toHaveBeenCalledWith({
      to: bookingData.clientPhone,
      body: expect.stringContaining("Reserva Confirmada"),
    });
  });

  it("rejects status update when status is unknown", async () => {
    twilioEnabled.mockReturnValue(true);

    const result = await sendStatusUpdate({
      clientName: bookingData.clientName,
      clientPhone: bookingData.clientPhone,
      serviceName: bookingData.serviceName,
      propertyName: bookingData.propertyName,
      status: "UNKNOWN",
      bookingId: bookingData.bookingId,
    });

    expect(result.success).toBe(false);
    expect(sendWhatsApp).not.toHaveBeenCalled();
  });

  it("sends completion notification with SMS fallback", async () => {
    twilioEnabled.mockReturnValue(true);
    sendWhatsApp.mockResolvedValueOnce({ success: false });
    sendSMS.mockResolvedValueOnce({ success: true });

    const result = await sendCompletionNotification({
      clientName: bookingData.clientName,
      clientPhone: bookingData.clientPhone,
      serviceName: bookingData.serviceName,
      propertyName: bookingData.propertyName,
      cleanScoreUrl: "https://example.com/report.pdf",
      bookingId: bookingData.bookingId,
    });

    expect(result.success).toBe(true);
    expect(sendSMS).toHaveBeenCalledWith({
      to: bookingData.clientPhone,
      body: expect.stringContaining("Servicio Completado"),
    });
  });

  it("sends reminder with correct template", async () => {
    twilioEnabled.mockReturnValue(true);
    sendWhatsApp.mockResolvedValueOnce({ success: true });

    const result = await sendReminder(bookingData, "2h");

    expect(result.success).toBe(true);
    expect(sendWhatsApp).toHaveBeenCalledWith({
      to: bookingData.clientPhone,
      body: expect.stringContaining("Tu cuadrilla está en camino"),
    });
  });

  it("skips concierge email when Resend disabled", async () => {
    resendEnabled.mockReturnValue(false);

    const result = await sendConciergeEmail({
      to: "client@example.com",
      conversationId: "conv-1",
      assistantMessage: "Hola",
      userMessage: "Necesito ayuda",
    });

    expect(result.success).toBe(false);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("sends concierge email via Resend when enabled", async () => {
    resendEnabled.mockReturnValue(true);
    sendEmail.mockResolvedValueOnce({ success: true });

    const result = await sendConciergeEmail({
      to: "client@example.com",
      conversationId: "conv-1",
      assistantMessage: "Hola",
      userMessage: "Necesito ayuda",
    });

    expect(result.success).toBe(true);
    expect(sendEmail).toHaveBeenCalledWith({
      to: "client@example.com",
      subject: "Concierge AI Response",
      html: expect.stringContaining("Respuesta Concierge AI"),
    });
  });
});
