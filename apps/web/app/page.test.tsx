import { describe, expect, it, vi } from "vitest";

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
  fetchBookings: vi.fn().mockResolvedValue([
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
  fetchProperties: vi.fn().mockResolvedValue([
    {
      id: "prop_1",
      label: "Brickell Loft",
      addressLine: "120 SW 8th St",
      city: "Miami",
      state: "FL",
      zipCode: "33130",
      type: "VACATION_RENTAL",
      ownerId: "cust_1",
    },
  ]),
  fetchCustomers: vi.fn().mockResolvedValue([
    {
      id: "cust_1",
      email: "client@test.com",
      fullName: "Cliente Piloto",
    },
  ]),
  fetchUsers: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue(null),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

describe("HomePage", () => {
  it("renders with data from the API", async () => {
    const api = await import("@/lib/api");
    const {
      fetchServices,
      fetchBookings,
      fetchProperties,
      fetchCustomers,
      fetchUsers,
    } = api;
    const { default: HomePage } = await import("./page");
    const component = await HomePage();
    expect(component).toBeTruthy();

    const mockedServices = vi.mocked(fetchServices);
    const mockedBookings = vi.mocked(fetchBookings);
    const mockedProperties = vi.mocked(fetchProperties);
    const mockedCustomers = vi.mocked(fetchCustomers);
    const mockedUsers = vi.mocked(fetchUsers);

    expect(mockedServices).toHaveBeenCalled();
    expect(mockedBookings).toHaveBeenCalled();
    expect(mockedProperties).toHaveBeenCalled();
    expect(mockedCustomers).toHaveBeenCalled();
    expect(mockedUsers).not.toHaveBeenCalled();
  });
});
