import { describe, expect, it, vi } from "vitest";
import HomePage from "./page";
import { fetchServices, fetchUpcomingBookings } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  fetchServices: vi.fn().mockResolvedValue([
    {
      id: "srv_1",
      name: "Servicio Demo",
      description: "Limpieza profunda",
      basePrice: 120,
      durationMin: 90,
      active: true,
      updatedAt: new Date().toISOString(),
    },
  ]),
  fetchUpcomingBookings: vi.fn().mockResolvedValue([
    {
      id: "booking_1",
      code: "BRISA-001",
      scheduledAt: new Date().toISOString(),
      totalAmount: 120,
      status: "CONFIRMED",
      service: { id: "srv_1", name: "Servicio Demo", basePrice: 120 },
      property: { id: "prop_1", label: "Brickell Loft", city: "Miami" },
    },
  ]),
}));

describe("HomePage", () => {
  it("renders with data from the API", async () => {
    const component = await HomePage();
    expect(component).toBeTruthy();

    const mockedServices = vi.mocked(fetchServices);
    const mockedBookings = vi.mocked(fetchUpcomingBookings);

    expect(mockedServices).toHaveBeenCalled();
    expect(mockedBookings).toHaveBeenCalled();
  });
});
