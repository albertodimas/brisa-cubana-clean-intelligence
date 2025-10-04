import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CleanScoreDashboard from "./clean-score-dashboard";

global.fetch = vi.fn();

const baseReport = {
  id: "csr_123",
  bookingId: "booking-1",
  status: "DRAFT",
  score: 92.5,
  metrics: {
    generalCleanliness: 4.6,
    kitchen: 4.8,
    bathrooms: 4.7,
    premiumDetails: 4.5,
    ambiance: 4.4,
    timeCompliance: 4.9,
  },
  photos: [
    {
      url: "https://example.com/foto.jpg",
      caption: "Después",
      category: "after" as const,
    },
  ],
  videos: ["https://example.com/video.mp4"],
  checklist: [
    {
      area: "Cocina",
      status: "PASS" as const,
    },
  ],
  observations: "Checklist completado al 95%.",
  recommendations: ["Programar visita preventiva en 2 semanas"],
  teamMembers: ["Ana", "Carlos"],
  generatedBy: "staff-1",
  sentToEmail: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  booking: {
    id: "booking-1",
    status: "COMPLETED",
    scheduledAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    property: {
      name: "Skyline Loft",
      address: "890 Biscayne Blvd",
    },
    service: {
      name: "Limpieza Premium",
    },
    user: {
      id: "client-1",
      name: "Cliente Demo",
      email: "client@example.com",
    },
  },
};

describe("CleanScoreDashboard", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("filtra reportes por status y búsqueda", () => {
    render(
      <CleanScoreDashboard
        initialReports={[
          baseReport,
          { ...baseReport, id: "csr_456", status: "PUBLISHED" as const },
        ]}
        accessToken="token"
        apiBase="http://localhost:3001"
      />,
    );

    expect(
      screen.getByText("Skyline Loft · Limpieza Premium"),
    ).toBeInTheDocument();

    const publishedTab = screen.getByRole("tab", { name: /publicados/i });
    fireEvent.click(publishedTab);

    expect(
      screen.queryByText("Skyline Loft · Limpieza Premium"),
    ).not.toBeInTheDocument();

    const search = screen.getByPlaceholderText(/Buscar por propiedad/i);
    fireEvent.change(search, { target: { value: "Skyline" } });

    expect(
      screen.queryByText("Skyline Loft · Limpieza Premium"),
    ).not.toBeInTheDocument();
  });

  it("muestra el detalle del reporte al solicitarlo", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...baseReport,
        status: "PUBLISHED",
        sentToEmail: "client@example.com",
      }),
    });

    render(
      <CleanScoreDashboard
        initialReports={[baseReport]}
        accessToken="token"
        apiBase="http://localhost:3001"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /ver reporte/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:3001/api/reports/cleanscore/booking-1",
        expect.objectContaining({
          headers: { Authorization: "Bearer token" },
        }),
      );
    });
  });

  it("publica un reporte y refresca listado", async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          status: "PUBLISHED",
          emailSent: true,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          reports: [{ ...baseReport, status: "PUBLISHED" }],
        }),
      });

    render(
      <CleanScoreDashboard
        initialReports={[baseReport]}
        accessToken="token"
        apiBase="http://localhost:3001"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /publicar/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:3001/api/reports/cleanscore/booking-1",
        expect.objectContaining({
          method: "PATCH",
          headers: {
            Authorization: "Bearer token",
            "Content-Type": "application/json",
          },
        }),
      );
    });
  });
});
