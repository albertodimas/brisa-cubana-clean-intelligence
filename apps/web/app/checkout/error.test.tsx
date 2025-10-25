import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CheckoutErrorBoundary from "./error";

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
}));

vi.mock("@/lib/marketing-telemetry", () => ({
  recordCheckoutEvent: vi.fn(),
}));

describe("CheckoutErrorBoundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseError = Object.assign(new Error("Stripe exploded"), {
    digest: "digest_1234567890",
  });

  it("muestra fallback y permite reintentar", async () => {
    const reset = vi.fn();

    render(<CheckoutErrorBoundary error={baseError} reset={reset} />);

    expect(
      screen.getByText(/Tuvimos un problema cargando el formulario de pago/i),
    ).toBeInTheDocument();

    const retryButton = screen.getByRole("button", {
      name: /Reintentar carga/i,
    });
    fireEvent.click(retryButton);
    expect(reset).toHaveBeenCalledTimes(1);

    expect(retryButton).toBeEnabled();
  });

  it("deshabilita el botón después de tres intentos", () => {
    const reset = vi.fn();

    render(<CheckoutErrorBoundary error={baseError} reset={reset} />);

    const retryButton = screen.getByRole("button", {
      name: /Reintentar carga/i,
    });

    fireEvent.click(retryButton);
    fireEvent.click(retryButton);
    fireEvent.click(retryButton);
    fireEvent.click(retryButton);

    expect(reset).toHaveBeenCalledTimes(3);
    expect(retryButton).toBeDisabled();
    expect(retryButton).toHaveTextContent(/Límite de reintentos alcanzado/i);
  });

  it("logea errores en Sentry y PostHog", async () => {
    const reset = vi.fn();
    const sentry = await import("@sentry/nextjs");
    const posthog = await import("@/lib/marketing-telemetry");

    render(<CheckoutErrorBoundary error={baseError} reset={reset} />);

    await waitFor(() => {
      expect(sentry.captureException).toHaveBeenCalledWith(
        baseError,
        expect.any(Object),
      );
      expect(posthog.recordCheckoutEvent).toHaveBeenCalledWith(
        "checkout_error_boundary_triggered",
        expect.objectContaining({ errorDigest: baseError.digest }),
      );
    });
  });
});
