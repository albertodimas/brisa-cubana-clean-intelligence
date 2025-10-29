"use client";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { CheckoutClient } from "./checkout-client";

const stripeMocks = vi.hoisted(() => ({
  loadStripe: vi.fn(),
}));
const stripeReactMocks = vi.hoisted(() => ({
  confirmPayment: vi
    .fn()
    .mockResolvedValue({ error: null, paymentIntent: null }),
}));

vi.mock("@stripe/stripe-js", () => ({
  loadStripe: stripeMocks.loadStripe,
}));

vi.mock("@stripe/react-stripe-js", () => ({
  Elements: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="elements-mock">{children}</div>
  ),
  PaymentElement: () => <div data-testid="payment-element" />,
  useStripe: () => ({
    confirmPayment: stripeReactMocks.confirmPayment,
  }),
  useElements: () => ({}),
}));

const servicesFixture = [
  {
    id: "svc_turnover",
    name: "Turnover Premium Airbnb",
    basePrice: 249,
    durationMin: 180,
    description: "Servicio de turnovers premium.",
  },
];

describe("CheckoutClient", () => {
  const originalFetch = globalThis.fetch;
  const originalCrypto = globalThis.crypto;

  beforeEach(() => {
    stripeMocks.loadStripe.mockReset().mockResolvedValue({} as unknown);
    stripeReactMocks.confirmPayment
      .mockReset()
      .mockResolvedValue({ error: null, paymentIntent: null });
    globalThis.fetch = vi.fn();
    if (!originalCrypto || typeof originalCrypto.randomUUID !== "function") {
      vi.stubGlobal("crypto", {
        ...originalCrypto,
        randomUUID: () => "checkout-test-ref",
        getRandomValues: (arr: ArrayBufferView) => {
          if (typeof originalCrypto?.getRandomValues === "function") {
            return originalCrypto.getRandomValues(arr);
          }
          return arr;
        },
      });
    } else {
      vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(
        "checkout-test-ref",
      );
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = originalFetch;
    if (originalCrypto && typeof originalCrypto.randomUUID === "function") {
      vi.spyOn(globalThis.crypto, "randomUUID").mockRestore();
    } else {
      vi.unstubAllGlobals();
    }
  });

  it("muestra guía cuando no se configuró la clave pública", () => {
    render(
      <CheckoutClient
        services={servicesFixture}
        publishableKey=""
        isTestMode
      />,
    );

    expect(
      screen.getByText(/Configura Stripe para habilitar el checkout público/i),
    ).toBeInTheDocument();
    expect(stripeMocks.loadStripe).not.toHaveBeenCalled();
  });

  it("gestiona fallos al crear la intención de pago y muestra referencia", async () => {
    const user = userEvent.setup();
    (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      {
        ok: false,
        json: vi
          .fn()
          .mockResolvedValue({ error: "Stripe temporalmente fuera de línea" }),
      } as unknown as Response,
    );

    render(
      <CheckoutClient
        services={servicesFixture}
        publishableKey="pk_test_demo"
        isTestMode
      />,
    );

    await user.type(
      screen.getByPlaceholderText(/Ej. Laura Pérez/i),
      "Laura Checkout",
    );
    await user.type(
      screen.getByPlaceholderText(/tu-correo@ejemplo.com/i),
      "checkout@example.com",
    );

    const datetimeInput = screen.getByLabelText(/Fecha y hora deseada/i);
    await user.clear(datetimeInput);
    await user.type(datetimeInput, "2025-12-31T10:00");

    await user.click(
      screen.getByRole("button", { name: /Continuar con pago/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Checkout temporalmente inactivo/i),
      ).toBeInTheDocument();
    });
    expect(screen.getByText(/checkout-test-ref/)).toBeInTheDocument();

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/checkout/intent",
      expect.objectContaining({
        method: "POST",
      }),
    );
  });
});
