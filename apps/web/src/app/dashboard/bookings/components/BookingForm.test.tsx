import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import BookingForm from "./BookingForm";
import type { Service, Property } from "@/types/api";

const pushMock = vi.fn();

global.fetch = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

describe("BookingForm", () => {
  const baseServices: Service[] = [
    {
      id: "srv-active",
      name: "Limpieza General",
      description: "Servicio activo",
      basePrice: "120.00",
      duration: 90,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "srv-inactive",
      name: "Limpieza Inactiva",
      description: "No debería aparecer",
      basePrice: "80.00",
      duration: 60,
      active: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const baseProperties: Property[] = [
    {
      id: "prop-1",
      name: "Brickell Loft",
      address: "123 Brickell Ave",
      city: "Miami",
      state: "FL",
      zipCode: "33131",
      type: "RESIDENTIAL",
      size: null,
      bedrooms: null,
      bathrooms: null,
      notes: null,
      userId: "user-1",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    vi.resetAllMocks();
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:3001";
  });

  it("solo muestra servicios activos y refleja la selección", () => {
    render(
      <BookingForm
        accessToken="token"
        userId="user-1"
        services={baseServices}
        properties={baseProperties}
      />,
    );

    const select = screen.getByLabelText(/servicio/i) as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "srv-active" } });

    expect(select.options.length).toBe(2); // placeholder + activo
    expect(screen.getByText("Servicio activo")).toBeInTheDocument();
    expect(screen.queryByText("No debería aparecer")).not.toBeInTheDocument();
  });

  it("envía el formulario exitosamente y navega a listado", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    render(
      <BookingForm
        accessToken="token"
        userId="user-1"
        services={baseServices}
        properties={baseProperties}
      />,
    );

    fireEvent.change(screen.getByLabelText(/servicio/i), {
      target: { value: "srv-active" },
    });
    fireEvent.change(screen.getByLabelText(/propiedad/i), {
      target: { value: "prop-1" },
    });

    const scheduledAt = new Date(Date.now() + 3 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 16);

    fireEvent.change(screen.getByLabelText(/fecha y hora/i), {
      target: { value: scheduledAt },
    });
    fireEvent.change(screen.getByLabelText(/notas adicionales/i), {
      target: { value: "Por favor llamar al llegar" },
    });

    fireEvent.click(screen.getByRole("button", { name: /confirmar/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:3001/api/bookings",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer token",
          }),
        }),
      );
    });

    expect(pushMock).toHaveBeenCalledWith("/dashboard/bookings?created=1");
  });

  it("muestra mensaje de error cuando la API responde con fallo", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: { message: "Capacidad llena" } }),
    });

    render(
      <BookingForm
        accessToken="token"
        userId="user-1"
        services={baseServices}
        properties={baseProperties}
      />,
    );

    fireEvent.change(screen.getByLabelText(/servicio/i), {
      target: { value: "srv-active" },
    });
    fireEvent.change(screen.getByLabelText(/propiedad/i), {
      target: { value: "prop-1" },
    });
    const scheduledAt = new Date(Date.now() + 3 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 16);
    fireEvent.change(screen.getByLabelText(/fecha y hora/i), {
      target: { value: scheduledAt },
    });

    fireEvent.click(screen.getByRole("button", { name: /confirmar/i }));

    await waitFor(() => {
      expect(screen.getByText("Capacidad llena")).toBeInTheDocument();
    });
  });
});
