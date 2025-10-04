import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { ActiveService } from "./active-service";

const baseBooking = {
  id: "booking-1",
  scheduledAt: new Date().toISOString(),
  status: "PENDING",
  serviceName: "Limpieza Premium",
  propertyName: "Skyline Loft",
  propertyAddress: "890 Biscayne Blvd",
  notes: "Revisar ventanas",
};

function setupOverrides(overrides?: Partial<typeof globalThis.fetch>) {
  vi.mocked(global.fetch).mockImplementation(async (url, init) => {
    if (typeof overrides?.call === "function") {
      return overrides.call(url as string, init);
    }

    if (
      typeof url === "string" &&
      url.endsWith("/api/bookings/booking-1") &&
      init?.method === "PATCH" &&
      init?.body
    ) {
      return { ok: true, json: async () => ({}) } as Response;
    }

    if (
      typeof url === "string" &&
      url.endsWith("/api/reports/cleanscore") &&
      init?.method === "POST"
    ) {
      return {
        ok: true,
        json: async () => ({
          success: true,
          message: "CleanScore report generated",
        }),
      } as Response;
    }

    return { ok: true, json: async () => ({}) } as Response;
  });
}

describe("ActiveService component", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("muestra errores cuando los fetch fallan", async () => {
    const errorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
    } as Response);

    render(
      <ActiveService
        booking={baseBooking}
        accessToken="token"
        onBack={vi.fn()}
        onComplete={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /iniciar/i }));

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalled();
    });
    errorSpy.mockRestore();
  });

  it("ejecuta el flujo completo de completar servicio con generación CleanScore", async () => {
    const onComplete = vi.fn();
    setupOverrides();

    render(
      <ActiveService
        booking={baseBooking}
        accessToken="token"
        onBack={vi.fn()}
        onComplete={onComplete}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /iniciar/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/bookings/booking-1"),
        expect.objectContaining({ method: "PATCH" }),
      );
    });

    fireEvent.click(
      screen.getByRole("button", { name: /completar servicio/i }),
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/reports/cleanscore"),
        expect.objectContaining({ method: "POST" }),
      );
      expect(onComplete).toHaveBeenCalled();
    });
  });
});
