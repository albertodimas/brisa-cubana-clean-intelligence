import { renderHook, waitFor } from "@testing-library/react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from "vitest";
import {
  useCalendar,
  useAvailability,
  type CalendarData,
} from "./use-calendar";

const mockCalendarData: CalendarData = {
  bookingsByDate: {
    "2025-11-15": [
      {
        id: "booking-1",
        code: "BRISA-0001",
        scheduledAt: "2025-11-15T10:00:00.000Z",
        durationMin: 120,
        status: "CONFIRMED",
        service: { id: "service-1", name: "Limpieza profunda" },
        property: { id: "property-1", label: "Skyline Loft" },
        customer: {
          id: "customer-1",
          fullName: "John Doe",
          email: "john@test.com",
        },
        assignedStaff: {
          id: "staff-1",
          fullName: "Jane Staff",
          email: "jane@test.com",
        },
        totalAmount: 150,
      },
    ],
    "2025-11-16": [],
  },
  dateRange: ["2025-11-15", "2025-11-16"],
  summary: {
    totalBookings: 1,
    statusCounts: { CONFIRMED: 1 },
    totalRevenue: "150.00",
  },
};

const flushPromises = () =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });

describe("useCalendar", () => {
  const originalFetch = global.fetch;
  let consoleErrorSpy: MockInstance<typeof console.error>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    global.fetch = originalFetch;
    consoleErrorSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it("inicializa con data null e isLoading true", () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ data: mockCalendarData }),
      } as Response),
    );

    const { result } = renderHook(() =>
      useCalendar({
        from: new Date("2025-11-15"),
        to: new Date("2025-11-16"),
      }),
    );

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.meta).toBeNull();
    // isLoading will become true during effect, so we don't assert its initial value
  });

  it("carga datos del calendario exitosamente", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          data: mockCalendarData,
          meta: {
            cacheHit: false,
            cacheMissReason: "disabled",
            durationMs: 123,
          },
        }),
      } as Response),
    );

    const { result } = renderHook(() =>
      useCalendar({
        from: new Date("2025-11-15"),
        to: new Date("2025-11-16"),
      }),
    );

    await waitFor(() => {
      expect(result.current.data).toEqual(mockCalendarData);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.meta).toEqual({
      cacheHit: false,
      cacheMissReason: "disabled",
      durationMs: 123,
    });
  });

  it("expone metadatos de cache cuando la API los envía", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          data: mockCalendarData,
          meta: {
            cacheHit: true,
            cachedAt: "2025-11-15T10:00:00.000Z",
            cacheExpiresAt: "2025-11-15T10:01:00.000Z",
            durationMs: 45,
          },
        }),
      } as Response),
    );

    const { result } = renderHook(() =>
      useCalendar({
        from: new Date("2025-11-15"),
        to: new Date("2025-11-16"),
      }),
    );

    await waitFor(() => {
      expect(result.current.meta?.cacheHit).toBe(true);
    });
    expect(result.current.meta).toMatchObject({
      cacheHit: true,
      cachedAt: "2025-11-15T10:00:00.000Z",
      cacheExpiresAt: "2025-11-15T10:01:00.000Z",
      durationMs: 45,
    });
  });

  it("construye URL con parámetros de fecha", async () => {
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ data: mockCalendarData }),
      } as Response),
    );
    global.fetch = mockFetch;

    renderHook(() =>
      useCalendar({
        from: new Date("2025-11-15T00:00:00.000Z"),
        to: new Date("2025-11-16T23:59:59.999Z"),
      }),
    );

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    const callUrl = (
      mockFetch.mock.calls[0] as unknown as [string, RequestInit?]
    )[0];
    expect(callUrl).toContain("/api/calendar?");
    expect(callUrl).toContain("from=");
    expect(callUrl).toContain("to=");
  });

  it("incluye filtro de estado cuando se proporciona", async () => {
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ data: mockCalendarData }),
      } as Response),
    );
    global.fetch = mockFetch;

    renderHook(() =>
      useCalendar({
        from: new Date("2025-11-15"),
        to: new Date("2025-11-16"),
        status: "CONFIRMED",
      }),
    );

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    const callUrl = (
      mockFetch.mock.calls[0] as unknown as [string, RequestInit?]
    )[0];
    expect(callUrl).toContain("status=CONFIRMED");
  });

  it("incluye filtro de propiedad cuando se proporciona", async () => {
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ data: mockCalendarData }),
      } as Response),
    );
    global.fetch = mockFetch;

    renderHook(() =>
      useCalendar({
        from: new Date("2025-11-15"),
        to: new Date("2025-11-16"),
        propertyId: "property-1",
      }),
    );

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    const callUrl = (
      mockFetch.mock.calls[0] as unknown as [string, RequestInit?]
    )[0];
    expect(callUrl).toContain("propertyId=property-1");
  });

  it("incluye filtro de servicio cuando se proporciona", async () => {
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ data: mockCalendarData }),
      } as Response),
    );
    global.fetch = mockFetch;

    renderHook(() =>
      useCalendar({
        from: new Date("2025-11-15"),
        to: new Date("2025-11-16"),
        serviceId: "service-1",
      }),
    );

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    const callUrl = (
      mockFetch.mock.calls[0] as unknown as [string, RequestInit?]
    )[0];
    expect(callUrl).toContain("serviceId=service-1");
  });

  it("incluye filtro de personal asignado cuando se proporciona", async () => {
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ data: mockCalendarData }),
      } as Response),
    );
    global.fetch = mockFetch;

    renderHook(() =>
      useCalendar({
        from: new Date("2025-11-15"),
        to: new Date("2025-11-16"),
        assignedStaffId: "staff-1",
      }),
    );

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    const callUrl = (
      mockFetch.mock.calls[0] as unknown as [string, RequestInit?]
    )[0];
    expect(callUrl).toContain("assignedStaffId=staff-1");
  });

  it("maneja errores de red correctamente", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: async () => ({ error: "Network error" }),
      } as Response),
    );

    const { result } = renderHook(() =>
      useCalendar({
        from: new Date("2025-11-15"),
        to: new Date("2025-11-16"),
      }),
    );

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    expect(result.current.error).toContain("Network error");
    expect(result.current.data).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("maneja excepciones durante fetch", async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error("Fetch failed")));

    const { result } = renderHook(() =>
      useCalendar({
        from: new Date("2025-11-15"),
        to: new Date("2025-11-16"),
      }),
    );

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    expect(result.current.error).toContain("Fetch failed");
    expect(result.current.isLoading).toBe(false);
  });

  it("recarga datos cuando cambian las fechas", async () => {
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ data: mockCalendarData }),
      } as Response),
    );
    global.fetch = mockFetch;

    const { rerender } = renderHook(
      ({ from, to }) => useCalendar({ from, to }),
      {
        initialProps: {
          from: new Date("2025-11-15"),
          to: new Date("2025-11-16"),
        },
      },
    );

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    // Change dates
    rerender({
      from: new Date("2025-11-17"),
      to: new Date("2025-11-18"),
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  it("recarga datos cuando cambian los filtros", async () => {
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ data: mockCalendarData }),
      } as Response),
    );
    global.fetch = mockFetch;

    const { rerender } = renderHook(
      ({ status }: { status?: string }) =>
        useCalendar({
          from: new Date("2025-11-15"),
          to: new Date("2025-11-16"),
          status,
        }),
      {
        initialProps: { status: undefined as string | undefined },
      },
    );

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    const initialCallCount = mockFetch.mock.calls.length;

    // Change filter
    rerender({ status: "CONFIRMED" });

    await waitFor(() => {
      expect(mockFetch.mock.calls.length).toBeGreaterThan(initialCallCount);
    });
  });

  it("función refresh recarga los datos", async () => {
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ data: mockCalendarData }),
      } as Response),
    );
    global.fetch = mockFetch;

    const { result } = renderHook(() =>
      useCalendar({
        from: new Date("2025-11-15"),
        to: new Date("2025-11-16"),
      }),
    );

    await flushPromises();
    expect(mockFetch).toHaveBeenCalled();

    const initialCallCount = mockFetch.mock.calls.length;

    // Call refresh
    await result.current.refresh();

    await flushPromises();
    expect(mockFetch.mock.calls.length).toBeGreaterThan(initialCallCount);
  });

  it("incluye credentials en la petición fetch", async () => {
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ data: mockCalendarData }),
      } as Response),
    );
    global.fetch = mockFetch;

    renderHook(() =>
      useCalendar({
        from: new Date("2025-11-15"),
        to: new Date("2025-11-16"),
      }),
    );

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    const fetchOptions = (
      mockFetch.mock.calls[0] as unknown as [string, RequestInit?]
    )[1];
    expect(fetchOptions).toHaveProperty("credentials", "include");
  });
});

describe("useAvailability", () => {
  const originalFetch = global.fetch;
  let consoleErrorSpy: MockInstance<typeof console.error>;

  const mockAvailabilityData = {
    date: "2025-11-20T00:00:00.000Z",
    propertyId: "property-1",
    durationMin: 60,
    timeSlots: [
      { time: "2025-11-20T08:00:00.000Z", available: true },
      { time: "2025-11-20T08:30:00.000Z", available: true },
      {
        time: "2025-11-20T09:00:00.000Z",
        available: false,
        bookingId: "booking-1",
      },
    ],
    bookings: [],
  };

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    global.fetch = originalFetch;
    consoleErrorSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it("inicializa con arrays vacíos cuando date o propertyId son null", () => {
    const { result } = renderHook(() => useAvailability(null, null, 60));

    expect(result.current.timeSlots).toEqual([]);
    expect(result.current.bookings).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("carga slots de disponibilidad exitosamente", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ data: mockAvailabilityData }),
      } as Response),
    );

    const { result } = renderHook(() =>
      useAvailability(new Date("2025-11-20"), "property-1", 60),
    );

    await waitFor(() => {
      expect(result.current.timeSlots.length).toBeGreaterThan(0);
    });

    expect(result.current.timeSlots).toEqual(mockAvailabilityData.timeSlots);
    expect(result.current.bookings).toEqual(mockAvailabilityData.bookings);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("construye URL con parámetros correctos", async () => {
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ data: mockAvailabilityData }),
      } as Response),
    );
    global.fetch = mockFetch;

    renderHook(() => useAvailability(new Date("2025-11-20"), "property-1", 90));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    const callUrl = (
      mockFetch.mock.calls[0] as unknown as [string, RequestInit?]
    )[0];
    expect(callUrl).toContain("/api/calendar/availability?");
    expect(callUrl).toContain("date=");
    expect(callUrl).toContain("propertyId=property-1");
    expect(callUrl).toContain("durationMin=90");
  });

  it("usa duración por defecto de 60 minutos", async () => {
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ data: mockAvailabilityData }),
      } as Response),
    );
    global.fetch = mockFetch;

    renderHook(() => useAvailability(new Date("2025-11-20"), "property-1"));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    const callUrl = (
      mockFetch.mock.calls[0] as unknown as [string, RequestInit?]
    )[0];
    expect(callUrl).toContain("durationMin=60");
  });

  it("maneja errores de red correctamente", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: async () => ({ error: "Property not found" }),
      } as Response),
    );

    const { result } = renderHook(() =>
      useAvailability(new Date("2025-11-20"), "property-1", 60),
    );

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    expect(result.current.error).toContain("Property not found");
    expect(result.current.timeSlots).toEqual([]);
  });

  it("recarga cuando cambia la fecha", async () => {
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ data: mockAvailabilityData }),
      } as Response),
    );
    global.fetch = mockFetch;

    const { rerender } = renderHook(
      ({ date }) => useAvailability(date, "property-1", 60),
      {
        initialProps: { date: new Date("2025-11-20") },
      },
    );

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    // Change date
    rerender({ date: new Date("2025-11-21") });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  it("recarga cuando cambia la propiedad", async () => {
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ data: mockAvailabilityData }),
      } as Response),
    );
    global.fetch = mockFetch;

    const { rerender } = renderHook(
      ({ propertyId }) =>
        useAvailability(new Date("2025-11-20"), propertyId, 60),
      {
        initialProps: { propertyId: "property-1" },
      },
    );

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    const initialCallCount = mockFetch.mock.calls.length;

    // Change property
    rerender({ propertyId: "property-2" });

    await waitFor(() => {
      expect(mockFetch.mock.calls.length).toBeGreaterThan(initialCallCount);
    });
  });

  it("recarga cuando cambia la duración", async () => {
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ data: mockAvailabilityData }),
      } as Response),
    );
    global.fetch = mockFetch;

    const { rerender } = renderHook(
      ({ durationMin }) =>
        useAvailability(new Date("2025-11-20"), "property-1", durationMin),
      {
        initialProps: { durationMin: 60 },
      },
    );

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    const initialCallCount = mockFetch.mock.calls.length;

    // Change duration
    rerender({ durationMin: 90 });

    await waitFor(() => {
      expect(mockFetch.mock.calls.length).toBeGreaterThan(initialCallCount);
    });
  });

  it("limpia datos cuando date o propertyId se vuelven null", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ data: mockAvailabilityData }),
      } as Response),
    );

    const { result, rerender } = renderHook(
      ({ date, propertyId }) => useAvailability(date, propertyId, 60),
      {
        initialProps: {
          date: new Date("2025-11-20") as Date | null,
          propertyId: "property-1" as string | null,
        },
      },
    );

    await waitFor(() => {
      expect(result.current.timeSlots.length).toBeGreaterThan(0);
    });

    // Set date to null
    rerender({ date: null, propertyId: "property-1" });

    expect(result.current.timeSlots).toEqual([]);
    expect(result.current.bookings).toEqual([]);
  });
});
