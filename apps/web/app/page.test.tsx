import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api", () => ({
  fetchServicesPage: vi.fn().mockResolvedValue({
    items: [
      {
        id: "srv_1",
        name: "Servicio Demo",
        description: "Limpieza profunda",
        basePrice: 120,
        durationMin: 90,
        active: true,
        updatedAt: new Date().toISOString(),
      },
    ],
    pageInfo: {
      limit: 50,
      cursor: null,
      nextCursor: null,
      hasMore: false,
    },
  }),
  fetchBookingsPage: vi.fn().mockResolvedValue({
    items: [
      {
        id: "booking_1",
        code: "BRISA-001",
        scheduledAt: new Date().toISOString(),
        totalAmount: 120,
        durationMin: 90,
        notes: null,
        status: "CONFIRMED",
        service: { id: "srv_1", name: "Servicio Demo", basePrice: 120 },
        property: { id: "prop_1", label: "Brickell Loft", city: "Miami" },
        customer: {
          id: "cust_1",
          fullName: "Cliente Piloto",
          email: "client@test.com",
        },
      },
    ],
    pageInfo: {
      limit: 10,
      cursor: null,
      nextCursor: null,
      hasMore: false,
    },
  }),
  fetchPropertiesPage: vi.fn().mockResolvedValue({
    items: [
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
    ],
    pageInfo: {
      limit: 50,
      cursor: null,
      nextCursor: null,
      hasMore: false,
    },
  }),
  fetchCustomersPage: vi.fn().mockResolvedValue({
    items: [
      {
        id: "cust_1",
        email: "client@test.com",
        fullName: "Cliente Piloto",
      },
    ],
    pageInfo: {
      limit: 50,
      cursor: null,
      nextCursor: null,
      hasMore: false,
    },
  }),
  fetchUsersPage: vi.fn().mockResolvedValue({
    items: [],
    pageInfo: {
      limit: 50,
      cursor: null,
      nextCursor: null,
      hasMore: false,
    },
  }),
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
      fetchServicesPage,
      fetchBookingsPage,
      fetchPropertiesPage,
      fetchCustomersPage,
      fetchUsersPage,
    } = api;
    const { default: HomePage } = await import("./page");
    const component = await HomePage();
    expect(component).toBeTruthy();

    const mockedServices = vi.mocked(fetchServicesPage);
    const mockedBookings = vi.mocked(fetchBookingsPage);
    const mockedProperties = vi.mocked(fetchPropertiesPage);
    const mockedCustomers = vi.mocked(fetchCustomersPage);
    const mockedUsers = vi.mocked(fetchUsersPage);

    expect(mockedServices).toHaveBeenCalled();
    expect(mockedBookings).toHaveBeenCalled();
    expect(mockedProperties).toHaveBeenCalled();
    expect(mockedCustomers).toHaveBeenCalled();
    expect(mockedUsers).not.toHaveBeenCalled();
  });
});
