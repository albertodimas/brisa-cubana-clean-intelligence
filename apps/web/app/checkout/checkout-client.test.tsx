import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const stripeModuleMock = vi.hoisted(() => {
  const loadStripe = vi.fn().mockResolvedValue({
    confirmPayment: vi.fn(),
  });
  return {
    loadStripe,
    default: loadStripe,
  };
});

vi.mock("@stripe/stripe-js", () => stripeModuleMock);

import { CheckoutClient } from "./checkout-client";

const services = [
  {
    id: "srv_demo",
    name: "Limpieza profunda",
    description: "Servicio de referencia para pruebas.",
    basePrice: 150,
    durationMin: 120,
  },
];

describe("CheckoutClient", () => {
  beforeEach(() => {
    stripeModuleMock.loadStripe.mockResolvedValue({
      confirmPayment: vi.fn(),
    });
    vi.spyOn(global, "fetch").mockImplementation(async () => {
      return new Response(
        JSON.stringify({
          data: {
            clientSecret: "pi_test_secret",
            paymentIntentId: "pi_test",
            amount: 15000,
            currency: "usd",
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("muestra mensaje de configuración cuando falta publishable key", () => {
    render(<CheckoutClient services={services} publishableKey="" />);

    expect(
      screen.getByText(/Configura Stripe para habilitar el checkout público/i),
    ).toBeInTheDocument();
  });

  it("valida datos antes de crear la intención de pago", async () => {
    render(
      <CheckoutClient services={services} publishableKey="pk_test_demo" />,
    );

    const submit = await screen.findByRole("button", {
      name: /Continuar con pago/i,
    });

    const nameInput = screen.getByLabelText(/Nombre completo/i);
    await fireEvent.change(nameInput, { target: { value: "Laura" } });

    const dateInput = screen.getByLabelText(/Fecha y hora deseada/i);
    await fireEvent.change(dateInput, {
      target: { value: "2025-10-22T10:00" },
    });

    // Falta correo -> muestra error gestionado por el componente
    await fireEvent.click(submit);

    await waitFor(() => {
      expect(
        screen.getByText(/Necesitamos un correo para enviar la confirmación/i),
      ).toBeInTheDocument();
    });
  });
});
