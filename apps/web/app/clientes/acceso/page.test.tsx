import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

vi.mock("@/lib/portal-telemetry", () => ({
  recordPortalEvent: vi.fn(),
}));

import { recordPortalEvent } from "@/lib/portal-telemetry";
import { PortalAccessRequestScreen } from "./access-request-screen";

const recordPortalEventMock = vi.mocked(recordPortalEvent);

describe("PortalAccessRequestPage", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    recordPortalEventMock.mockReset();
  });

  it("muestra mensaje de éxito y reporta telemetría", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: "Enlace enviado" }),
    } as Response);
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<PortalAccessRequestScreen />);

    const emailField = screen.getByPlaceholderText(
      "cliente@brisacubanacleanintelligence.com",
    );
    await userEvent.type(emailField, "client@portal.test");
    await userEvent.click(screen.getByRole("button", { name: /enviar/i }));

    const message = await screen.findByText(/enlace enviado/i);
    expect(message).toHaveAttribute("role", "status");
    expect(message).toHaveAttribute("aria-live", "polite");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/portal/request",
      expect.objectContaining({ method: "POST" }),
    );
    expect(recordPortalEventMock).toHaveBeenCalledWith(
      "portal.link.requested",
      expect.objectContaining({ status: "success" }),
    );
  });

  it("muestra mensaje de error cuando la API falla", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Token inválido" }),
    } as Response);
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<PortalAccessRequestScreen />);

    const emailField = screen.getByPlaceholderText(
      "cliente@brisacubanacleanintelligence.com",
    );
    await userEvent.type(emailField, "client@portal.test");
    await userEvent.click(screen.getByRole("button", { name: /enviar/i }));

    const message = await screen.findByText(/token inválido/i);
    expect(message).toHaveAttribute("role", "status");
    expect(message).toHaveAttribute("aria-live", "polite");

    expect(recordPortalEventMock).toHaveBeenCalledWith(
      "portal.link.requested",
      expect.objectContaining({ status: "error" }),
    );
  });
});
