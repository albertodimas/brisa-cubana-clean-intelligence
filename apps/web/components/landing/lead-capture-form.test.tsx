import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const utmTrackingMock = vi.hoisted(() => ({
  resolveAndStoreUtm: vi.fn(),
  loadStoredUtm: vi.fn(),
}));

const searchParamsGetMock = vi.fn();

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: searchParamsGetMock,
  }),
}));

vi.mock("@/lib/utm-tracking", () => ({
  __esModule: true,
  resolveAndStoreUtm: utmTrackingMock.resolveAndStoreUtm,
  loadStoredUtm: utmTrackingMock.loadStoredUtm,
  hasUtm: (value: unknown) =>
    Boolean(value && Object.keys(value as Record<string, unknown>).length > 0),
}));

const { resolveAndStoreUtm, loadStoredUtm } = utmTrackingMock;

import { LeadCaptureForm } from "./lead-capture-form";

describe("LeadCaptureForm", () => {
  beforeEach(() => {
    resolveAndStoreUtm.mockReset();
    loadStoredUtm.mockReset();
    searchParamsGetMock.mockImplementation(() => null);
    vi.spyOn(window, "fetch").mockResolvedValue({
      ok: true,
      json: vi.fn(),
    } as unknown as Response);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("incluye parámetros UTM detectados en la URL", async () => {
    resolveAndStoreUtm.mockReturnValue({
      source: "linkedin",
      medium: "paid",
      campaign: "launch",
    });
    loadStoredUtm.mockReturnValue(null);

    const user = userEvent.setup();
    render(<LeadCaptureForm />);

    await user.type(screen.getByLabelText(/Nombre completo/i), "Ana Ejecutiva");
    await user.type(screen.getByLabelText(/Email corporativo/i), "ana@demo.io");
    await user.selectOptions(
      screen.getByLabelText(/Inventario aproximado/i),
      "6-15 unidades",
    );

    await user.click(
      screen.getByRole("button", { name: "Recibir propuesta personalizada" }),
    );

    await waitFor(() => {
      expect(window.fetch).toHaveBeenCalledTimes(1);
    });

    const [, init] = (window.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse((init as RequestInit).body as string) as Record<
      string,
      string
    >;

    expect(body).toMatchObject({
      name: "Ana Ejecutiva",
      email: "ana@demo.io",
      utm_source: "linkedin",
      utm_medium: "paid",
      utm_campaign: "launch",
    });
  });

  it("reutiliza parámetros UTM persistidos cuando no vienen en la URL", async () => {
    resolveAndStoreUtm.mockReturnValue(null);
    loadStoredUtm.mockReturnValue({
      source: "email",
      medium: "newsletter",
    });

    const user = userEvent.setup();
    render(<LeadCaptureForm />);

    await user.type(screen.getByLabelText(/Nombre completo/i), "Carlos Test");
    await user.type(screen.getByLabelText(/Email corporativo/i), "c@test.io");
    await user.selectOptions(
      screen.getByLabelText(/Inventario aproximado/i),
      "1-5 unidades",
    );

    await user.click(
      screen.getByRole("button", { name: "Recibir propuesta personalizada" }),
    );

    await waitFor(() => {
      expect(window.fetch).toHaveBeenCalledTimes(1);
    });

    const [, init] = (window.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse((init as RequestInit).body as string) as Record<
      string,
      string
    >;

    expect(body).toMatchObject({
      utm_source: "email",
      utm_medium: "newsletter",
    });
  });

  it("precarga plan, inventario y mensajes cuando llegan por querystring", async () => {
    searchParamsGetMock.mockImplementation((key: string) => {
      if (key === "plan") return "turnover";
      if (key === "inventory") return "6-15 unidades";
      return null;
    });
    resolveAndStoreUtm.mockReturnValue(null);
    loadStoredUtm.mockReturnValue(null);

    render(<LeadCaptureForm />);

    expect(
      screen.getByText("Interés en Turnover Premium Airbnb"),
    ).toBeInTheDocument();

    const inventorySelect = screen.getByLabelText(
      /Inventario aproximado/i,
    ) as HTMLSelectElement;
    expect(inventorySelect.value).toBe("6-15 unidades");

    const hiddenPlanInput = document.querySelector(
      'input[name="planCode"]',
    ) as HTMLInputElement | null;
    expect(hiddenPlanInput?.value).toBe("turnover");
  });

  it("muestra fallback amigable cuando la API responde con error", async () => {
    const user = userEvent.setup();
    searchParamsGetMock.mockImplementation((key: string) => {
      if (key === "plan") return "deep-clean";
      return null;
    });

    resolveAndStoreUtm.mockReturnValue(null);
    loadStoredUtm.mockReturnValue(null);

    vi.spyOn(window, "fetch").mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({ error: "API en mantenimiento" }),
    } as unknown as Response);

    render(<LeadCaptureForm />);

    await user.type(screen.getByLabelText(/Nombre completo/i), "Lucía Error");
    await user.type(
      screen.getByLabelText(/Email corporativo/i),
      "lucia@example.com",
    );
    await user.selectOptions(
      screen.getByLabelText(/Inventario aproximado/i),
      "1-5 unidades",
    );

    await user.click(
      screen.getByRole("button", { name: "Recibir propuesta personalizada" }),
    );

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(
        "API en mantenimiento Escríbenos a operaciones@brisacubanacleanintelligence.com o agenda por WhatsApp.",
      );
    });
  });
});
