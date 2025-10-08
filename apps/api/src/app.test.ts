import { describe, expect, it, vi, beforeEach } from "vitest";

process.env.API_TOKEN = "test-service-token";
process.env.JWT_SECRET = "test-secret";
process.env.LOGIN_RATE_LIMIT = "3";
process.env.LOGIN_RATE_LIMIT_WINDOW_MS = "1000";

let servicesFixture: any[] = [];
let bookingsFixture: any[] = [];
let usersFixture: any[] = [];
let propertiesFixture: any[] = [];

const makeCuid = (index: number) => `c${index.toString(36).padStart(24, "0")}`;

const mockPrisma = {
  $queryRaw: vi.fn().mockResolvedValue([{ ok: 1 }]),
  service: {
    findMany: vi.fn().mockImplementation(async () => servicesFixture),
    create: vi.fn().mockImplementation(async ({ data }: { data: any }) => {
      const record = {
        id: makeCuid(servicesFixture.length + 1),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      };
      servicesFixture.push(record);
      return record;
    }),
    update: vi
      .fn()
      .mockImplementation(
        async ({ where, data }: { where: any; data: any }) => {
          const record = servicesFixture.find((item) => item.id === where.id);
          if (!record) {
            throw new Error("Service not found");
          }
          Object.assign(record, data, { updatedAt: new Date() });
          return record;
        },
      ),
    findUnique: vi
      .fn()
      .mockImplementation(
        async ({ where }: { where: any }) =>
          servicesFixture.find((item) => item.id === where.id) ?? null,
      ),
  },
  booking: {
    findMany: vi
      .fn()
      .mockImplementation(
        async ({ where, include }: { where?: any; include?: any } = {}) => {
          const filtered = bookingsFixture.filter((booking) => {
            if (!where) return true;
            if (where.status && booking.status !== where.status) return false;
            if (where.propertyId && booking.propertyId !== where.propertyId)
              return false;
            if (where.serviceId && booking.serviceId !== where.serviceId)
              return false;
            if (where.customerId && booking.customerId !== where.customerId)
              return false;
            if (where.scheduledAt) {
              const date = new Date(booking.scheduledAt);
              if (
                where.scheduledAt.gte &&
                date < new Date(where.scheduledAt.gte)
              )
                return false;
              if (
                where.scheduledAt.lte &&
                date > new Date(where.scheduledAt.lte)
              )
                return false;
            }
            return true;
          });

          return filtered.map((booking) =>
            include
              ? {
                  ...booking,
                  customer: include.customer
                    ? (usersFixture.find(
                        (user) => user.id === booking.customerId,
                      ) ?? null)
                    : undefined,
                  property: include.property
                    ? (propertiesFixture.find(
                        (property) => property.id === booking.propertyId,
                      ) ?? null)
                    : undefined,
                  service: include.service
                    ? (servicesFixture.find(
                        (service) => service.id === booking.serviceId,
                      ) ?? null)
                    : undefined,
                }
              : booking,
          );
        },
      ),
    create: vi
      .fn()
      .mockImplementation(
        async ({ data, include }: { data: any; include: any }) => {
          const service = servicesFixture.find(
            (item) => item.id === data.serviceId,
          );
          if (!service) {
            throw new Error("Service not found");
          }
          const record = {
            id: `booking_${bookingsFixture.length + 1}`,
            code: data.code,
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          bookingsFixture.push(record);
          return {
            ...record,
            customer: include?.customer
              ? (usersFixture.find((user) => user.id === data.customerId) ?? {
                  id: data.customerId,
                  fullName: "Cliente",
                  email: "client@test.com",
                })
              : undefined,
            property: include?.property
              ? (propertiesFixture.find(
                  (property) => property.id === data.propertyId,
                ) ?? {
                  id: data.propertyId,
                  label: "Prop",
                  city: "Miami",
                })
              : undefined,
            service: include?.service ? service : undefined,
          };
        },
      ),
    update: vi
      .fn()
      .mockImplementation(
        async ({
          where,
          data,
          include,
        }: {
          where: any;
          data: any;
          include?: any;
        }) => {
          const booking = bookingsFixture.find((item) => item.id === where.id);
          if (!booking) {
            throw new Error("Booking not found");
          }
          Object.assign(booking, data, { updatedAt: new Date() });
          return {
            ...booking,
            customer: include?.customer
              ? (usersFixture.find((user) => user.id === booking.customerId) ??
                null)
              : undefined,
            property: include?.property
              ? (propertiesFixture.find(
                  (property) => property.id === booking.propertyId,
                ) ?? null)
              : undefined,
            service: include?.service
              ? (servicesFixture.find(
                  (service) => service.id === booking.serviceId,
                ) ?? null)
              : undefined,
          };
        },
      ),
  },
  user: {
    findUnique: vi
      .fn()
      .mockImplementation(async ({ where }: { where: any }) => {
        if (where.id) {
          return usersFixture.find((item) => item.id === where.id) ?? null;
        }
        if (where.email) {
          return (
            usersFixture.find((item) => item.email === where.email) ?? null
          );
        }
        return null;
      }),
    findMany: vi.fn().mockImplementation(async ({ where }: { where?: any }) => {
      if (where?.role === "CLIENT") {
        return usersFixture.filter((user) => user.role === "CLIENT");
      }
      return usersFixture;
    }),
  },
  property: {
    findMany: vi.fn().mockImplementation(async () => propertiesFixture),
    create: vi.fn().mockImplementation(async ({ data }: { data: any }) => {
      const record = {
        id: makeCuid(propertiesFixture.length + 201),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      };
      propertiesFixture.push(record);
      return record;
    }),
    findUnique: vi
      .fn()
      .mockImplementation(
        async ({ where }: { where: any }) =>
          propertiesFixture.find((item) => item.id === where.id) ?? null,
      ),
    update: vi
      .fn()
      .mockImplementation(
        async ({ where, data }: { where: any; data: any }) => {
          const property = propertiesFixture.find(
            (item) => item.id === where.id,
          );
          if (!property) {
            throw new Error("Property not found");
          }
          Object.assign(property, data, { updatedAt: new Date() });
          return property;
        },
      ),
  },
};

const mockVerify = vi.fn((token: string) =>
  token === "jwt-admin"
    ? { sub: makeCuid(999), email: "admin@brisacubanaclean.com", role: "ADMIN" }
    : token === "jwt-coordinator"
      ? {
          sub: makeCuid(998),
          email: "ops@brisacubanaclean.com",
          role: "COORDINATOR",
        }
      : null,
);

const mockSign = vi.fn(() => "jwt-admin");

const mockCompare = vi.fn().mockResolvedValue(true);

vi.mock("./lib/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("./lib/jwt", () => ({
  signAuthToken: mockSign,
  verifyAuthToken: mockVerify,
}));

vi.mock("bcryptjs", () => ({
  default: { compare: mockCompare },
  compare: mockCompare,
}));

const app = (await import("./app")).default;

const authorizedHeaders = {
  Authorization: "Bearer jwt-admin",
};

describe("app", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    servicesFixture = [
      {
        id: makeCuid(1),
        name: "Deep Clean Residencial",
        description: "Limpieza profunda",
        basePrice: 220,
        durationMin: 180,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    usersFixture = [
      {
        id: makeCuid(101),
        fullName: "Cliente Piloto",
        email: "client@test.com",
        passwordHash: "$2a$10$hashed",
        role: "CLIENT",
      },
      {
        id: makeCuid(102),
        fullName: "Admin Brisa",
        email: "admin@brisacubanaclean.com",
        passwordHash: "$2a$10$hashed",
        role: "ADMIN",
      },
    ];
    propertiesFixture = [
      {
        id: makeCuid(201),
        label: "Brickell Loft",
        city: "Miami",
        ownerId: makeCuid(101),
      },
    ];
    bookingsFixture = [
      {
        id: "booking_fixture_1",
        code: "BRISA-DEMO",
        scheduledAt: new Date("2024-10-01T10:00:00Z"),
        durationMin: 120,
        notes: null,
        status: "CONFIRMED",
        totalAmount: 220,
        customerId: usersFixture[0].id,
        propertyId: propertiesFixture[0].id,
        serviceId: servicesFixture[0].id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    mockPrisma.$queryRaw.mockClear();
    mockCompare.mockResolvedValue(true);
  });

  it("responds on /", async () => {
    const res = await app.request("/");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
  });

  it("exposes health", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("pass");
    expect(mockPrisma.$queryRaw).toHaveBeenCalled();
  });

  it("returns failure when database is down", async () => {
    mockPrisma.$queryRaw.mockRejectedValueOnce(new Error("connection refused"));

    const res = await app.request("/health");
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.status).toBe("fail");
  });

  it("lists services", async () => {
    const res = await app.request("/api/services");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.length).toBeGreaterThan(0);
  });

  it("creates a service when authorized", async () => {
    const payload = {
      name: "Servicio Test",
      description: "Prueba",
      basePrice: 100,
      durationMin: 90,
    };

    const res = await app.request("/api/services", {
      method: "POST",
      headers: authorizedHeaders,
      body: JSON.stringify(payload),
    });

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.name).toBe(payload.name);
  });

  it("rejects service creation when unauthorized", async () => {
    const res = await app.request("/api/services", {
      method: "POST",
      headers: { Authorization: "Bearer bad" },
      body: "{}",
    });
    expect(res.status).toBe(401);
  });

  it("lists bookings", async () => {
    const res = await app.request("/api/bookings");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toBeDefined();
  });

  it("filters bookings by date range", async () => {
    const from = new Date("2024-09-30T00:00:00Z").toISOString();
    const to = new Date("2024-10-02T23:59:59Z").toISOString();
    const res = await app.request(
      `/api/bookings?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.length).toBeGreaterThan(0);
  });

  it("creates a booking", async () => {
    const service = servicesFixture[0];
    const payload = {
      customerId: makeCuid(101),
      propertyId: makeCuid(201),
      serviceId: service.id,
      scheduledAt: new Date().toISOString(),
    };

    const res = await app.request("/api/bookings", {
      method: "POST",
      headers: authorizedHeaders,
      body: JSON.stringify(payload),
    });

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.service.id).toBe(service.id);
  });

  it("updates a booking", async () => {
    const res = await app.request("/api/bookings/booking_fixture_1", {
      method: "PATCH",
      headers: authorizedHeaders,
      body: JSON.stringify({ status: "COMPLETED", notes: "Finalizada" }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.status).toBe("COMPLETED");
    expect(json.data.notes).toBe("Finalizada");
  });

  it("lists properties", async () => {
    const res = await app.request("/api/properties");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.length).toBeGreaterThan(0);
  });

  it("creates a property when authorized", async () => {
    const payload = {
      label: "Sunset Villa",
      addressLine: "123 Sunset Blvd",
      city: "Miami",
      state: "FL",
      zipCode: "33101",
      type: "VACATION_RENTAL",
      ownerId: makeCuid(101),
      bedrooms: 3,
      bathrooms: 2,
      sqft: 1500,
    };

    const res = await app.request("/api/properties", {
      method: "POST",
      headers: authorizedHeaders,
      body: JSON.stringify(payload),
    });

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.label).toBe("Sunset Villa");
  });

  it("updates a property when authorized", async () => {
    const existing = propertiesFixture[0];
    const res = await app.request(`/api/properties/${existing.id}`, {
      method: "PATCH",
      headers: authorizedHeaders,
      body: JSON.stringify({ notes: "Actualizada", bedrooms: 4 }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.bedrooms).toBe(4);
    expect(json.data.notes).toBe("Actualizada");
  });

  it("lists customers with authorization", async () => {
    const res = await app.request("/api/customers", {
      headers: authorizedHeaders,
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data[0].email).toBeDefined();
  });

  it("logs in a user and returns a token", async () => {
    const res = await app.request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "admin@brisacubanaclean.com",
        password: "Brisa123!",
      }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.email).toBe("admin@brisacubanaclean.com");
    expect(json.token).toBe("jwt-admin");
    expect(mockSign).toHaveBeenCalled();
  });

  it("rate limits repeated login attempts", async () => {
    const windowMs = Number(process.env.LOGIN_RATE_LIMIT_WINDOW_MS ?? "1000");
    const limit = Number(process.env.LOGIN_RATE_LIMIT ?? "3");

    await new Promise((resolve) => setTimeout(resolve, windowMs + 100));

    for (let i = 0; i < limit; i += 1) {
      const res = await app.request("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: "unknown@brisacubanaclean.com",
          password: "WrongPass!",
        }),
      });
      expect(res.status).toBe(401);
    }

    const blocked = await app.request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "unknown@brisacubanaclean.com",
        password: "WrongPass!",
      }),
    });

    expect(blocked.status).toBe(429);
    const blockedBody = await blocked.json();
    expect(blockedBody.error).toContain("Too many login attempts");

    await new Promise((resolve) => setTimeout(resolve, windowMs + 100));
  });

  it("rejects login with invalid credentials", async () => {
    mockCompare.mockResolvedValueOnce(false);

    const res = await app.request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "admin@brisacubanaclean.com",
        password: "WrongPwd!",
      }),
    });

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Invalid credentials");
  });
});
