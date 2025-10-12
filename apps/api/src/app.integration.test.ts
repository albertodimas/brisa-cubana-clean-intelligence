import { describe, expect, it, vi, beforeEach } from "vitest";
import OpenAPIResponseValidator from "openapi-response-validator";
import { openApiSpec } from "./lib/openapi-spec.js";

process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
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
    findMany: vi.fn().mockImplementation(
      async ({
        take,
        skip,
        cursor,
      }: {
        take?: number;
        skip?: number;
        cursor?: { id: string };
      } = {}) => {
        let filtered = [...servicesFixture];

        // Handle cursor-based pagination
        if (cursor) {
          const cursorIndex = filtered.findIndex((s) => s.id === cursor.id);
          if (cursorIndex !== -1) {
            filtered = filtered.slice(cursorIndex);
          }
        }

        // Handle skip
        if (skip) {
          filtered = filtered.slice(skip);
        }

        // Handle take
        if (take) {
          filtered = filtered.slice(0, take);
        }

        return filtered;
      },
    ),
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
    findMany: vi.fn().mockImplementation(
      async ({
        where,
        include,
        take,
        skip,
        cursor,
      }: {
        where?: any;
        include?: any;
        take?: number;
        skip?: number;
        cursor?: { id: string };
      } = {}) => {
        let filtered = bookingsFixture.filter((booking) => {
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
            if (where.scheduledAt.gte && date < new Date(where.scheduledAt.gte))
              return false;
            if (where.scheduledAt.lte && date > new Date(where.scheduledAt.lte))
              return false;
          }
          return true;
        });

        // Handle cursor-based pagination
        if (cursor) {
          const cursorIndex = filtered.findIndex((b) => b.id === cursor.id);
          if (cursorIndex !== -1) {
            filtered = filtered.slice(cursorIndex);
          }
        }

        // Handle skip
        if (skip) {
          filtered = filtered.slice(skip);
        }

        // Handle take
        if (take) {
          filtered = filtered.slice(0, take);
        }

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
    create: vi.fn().mockImplementation(async ({ data, select }: any) => {
      if (usersFixture.some((user) => user.email === data.email)) {
        const error: any = new Error(
          "Unique constraint failed on the fields: (`email`)",
        );
        error.code = "P2002";
        error.meta = { target: ["email"] };
        error.clientVersion = "6.0.0";
        throw error;
      }
      const record = {
        id: makeCuid(usersFixture.length + 300),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      };
      usersFixture.push(record);
      if (select) {
        return {
          id: record.id,
          email: record.email,
          fullName: record.fullName,
          role: record.role,
          isActive: record.isActive,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
        };
      }
      return record;
    }),
    update: vi.fn().mockImplementation(async ({ where, data }: any) => {
      const user = usersFixture.find((item) => item.id === where.id);
      if (!user) {
        throw new Error("User not found");
      }
      Object.assign(user, data, { updatedAt: new Date() });
      return {
        id: user.id,
        email: user.email,
        fullName: user.fullName ?? null,
        role: user.role,
        isActive: user.isActive,
        updatedAt: user.updatedAt,
      };
    }),
  },
  property: {
    findMany: vi.fn().mockImplementation(
      async ({
        take,
        skip,
        cursor,
      }: {
        take?: number;
        skip?: number;
        cursor?: { id: string };
      } = {}) => {
        let filtered = [...propertiesFixture];

        // Handle cursor-based pagination
        if (cursor) {
          const cursorIndex = filtered.findIndex((p) => p.id === cursor.id);
          if (cursorIndex !== -1) {
            filtered = filtered.slice(cursorIndex);
          }
        }

        // Handle skip
        if (skip) {
          filtered = filtered.slice(skip);
        }

        // Handle take
        if (take) {
          filtered = filtered.slice(0, take);
        }

        return filtered;
      },
    ),
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
    ? { sub: makeCuid(102), email: "admin@brisacubanaclean.com", role: "ADMIN" }
    : token === "jwt-coordinator"
      ? {
          sub: makeCuid(103),
          email: "ops@brisacubanaclean.com",
          role: "COORDINATOR",
        }
      : null,
);

const mockSign = vi.fn(() => "jwt-admin");

const mockCompare = vi.fn().mockResolvedValue(true);
const mockHash = vi.fn().mockResolvedValue("hashed-password");

vi.mock("./lib/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("./lib/jwt", () => ({
  signAuthToken: mockSign,
  verifyAuthToken: mockVerify,
}));

vi.mock("bcryptjs", () => ({
  default: { compare: mockCompare, hash: mockHash },
  compare: mockCompare,
  hash: mockHash,
}));

const app = (await import("./app")).default;

const authorizedHeaders = {
  Authorization: "Bearer jwt-admin",
};

const coordinatorHeaders = {
  Authorization: "Bearer jwt-coordinator",
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
      {
        id: makeCuid(2),
        name: "Move-In/Move-Out",
        description: "Limpieza para mudanzas",
        basePrice: 350,
        durationMin: 240,
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
        isActive: true,
      },
      {
        id: makeCuid(102),
        fullName: "Admin Brisa",
        email: "admin@brisacubanaclean.com",
        passwordHash: "$2a$10$hashed",
        role: "ADMIN",
        isActive: true,
      },
      {
        id: makeCuid(103),
        fullName: "Coordinador",
        email: "ops@brisacubanaclean.com",
        passwordHash: "$2a$10$hashed",
        role: "COORDINATOR",
        isActive: true,
      },
    ];
    propertiesFixture = [
      {
        id: makeCuid(201),
        label: "Brickell Loft",
        city: "Miami",
        ownerId: makeCuid(101),
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      },
      {
        id: makeCuid(202),
        label: "Coral Gables House",
        city: "Miami",
        ownerId: makeCuid(101),
        createdAt: new Date("2024-02-01"),
        updatedAt: new Date("2024-02-01"),
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

  it("paginates services with default limit", async () => {
    const res = await app.request("/api/services");
    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json.data).toBeDefined();
    expect(json.pagination).toBeDefined();
    expect(json.pagination.limit).toBe(50);
    expect(json.pagination.hasMore).toBe(false);
  });

  it("paginates services with custom limit", async () => {
    const res = await app.request("/api/services?limit=1");
    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json.data.length).toBeLessThanOrEqual(1);
    expect(json.pagination.limit).toBe(1);
  });

  it("navigates services pagination with cursor", async () => {
    const firstPage = await app.request("/api/services?limit=1");
    const firstJson = await firstPage.json();

    expect(firstJson.pagination.hasMore).toBe(true);
    expect(firstJson.pagination.nextCursor).toBeDefined();

    const secondPage = await app.request(
      `/api/services?limit=1&cursor=${firstJson.pagination.nextCursor}`,
    );
    const secondJson = await secondPage.json();

    expect(secondJson.data[0]?.id).not.toBe(firstJson.data[0]?.id);
  });

  it("validates services pagination boundaries", async () => {
    const invalidLimit = await app.request("/api/services?limit=0");
    expect(invalidLimit.status).toBe(400);

    const tooHighLimit = await app.request("/api/services?limit=101");
    expect(tooHighLimit.status).toBe(400);
  });

  it("paginates properties with default limit", async () => {
    const res = await app.request("/api/properties");
    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json.data).toBeDefined();
    expect(json.pagination).toBeDefined();
    expect(json.pagination.limit).toBe(50);
    expect(json.pagination.hasMore).toBe(false);
  });

  it("paginates properties with custom limit", async () => {
    const res = await app.request("/api/properties?limit=1");
    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json.data.length).toBeLessThanOrEqual(1);
    expect(json.pagination.limit).toBe(1);
  });

  it("navigates properties pagination with cursor", async () => {
    const firstPage = await app.request("/api/properties?limit=1");
    const firstJson = await firstPage.json();

    expect(firstJson.pagination.hasMore).toBe(true);
    expect(firstJson.pagination.nextCursor).toBeDefined();

    const secondPage = await app.request(
      `/api/properties?limit=1&cursor=${firstJson.pagination.nextCursor}`,
    );
    const secondJson = await secondPage.json();

    expect(secondJson.data[0]?.id).not.toBe(firstJson.data[0]?.id);
  });

  it("validates properties pagination boundaries", async () => {
    const invalidLimit = await app.request("/api/properties?limit=0");
    expect(invalidLimit.status).toBe(400);

    const tooHighLimit = await app.request("/api/properties?limit=101");
    expect(tooHighLimit.status).toBe(400);
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

  it("paginates bookings with default limit", async () => {
    // Create multiple bookings to test pagination
    for (let i = 0; i < 25; i++) {
      bookingsFixture.push({
        id: makeCuid(1000 + i),
        code: `BRISA-TEST-${i}`,
        scheduledAt: new Date(Date.now() + i * 86400000).toISOString(),
        durationMin: 120,
        notes: `Test booking ${i}`,
        status: "PENDING",
        totalAmount: "150.00",
        customerId: makeCuid(101),
        propertyId: makeCuid(201),
        serviceId: servicesFixture[0]?.id || makeCuid(301),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    const res = await app.request("/api/bookings");
    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json.data).toBeDefined();
    expect(json.pagination).toBeDefined();
    expect(json.pagination.limit).toBe(20);
    expect(json.pagination.hasMore).toBe(true);
    expect(json.pagination.nextCursor).toBeDefined();
    expect(json.data.length).toBeLessThanOrEqual(20);
  });

  it("paginates bookings with custom limit", async () => {
    const res = await app.request("/api/bookings?limit=5");
    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json.data.length).toBeLessThanOrEqual(5);
    expect(json.pagination.limit).toBe(5);
  });

  it("paginates bookings with cursor", async () => {
    // First page
    const res1 = await app.request("/api/bookings?limit=5");
    expect(res1.status).toBe(200);
    const json1 = await res1.json();

    // Only test cursor if there are more results
    if (json1.pagination.hasMore) {
      const firstPageLastId = json1.data[json1.data.length - 1]?.id;
      expect(firstPageLastId).toBeDefined();
      expect(json1.pagination.nextCursor).toBe(firstPageLastId);

      // Second page using cursor
      const res2 = await app.request(
        `/api/bookings?limit=5&cursor=${json1.pagination.nextCursor}`,
      );
      expect(res2.status).toBe(200);
      const json2 = await res2.json();

      expect(json2.pagination.cursor).toBe(json1.pagination.nextCursor);
      expect(json2.data[0]?.id).not.toBe(firstPageLastId);
    } else {
      // If no more results, nextCursor should be null
      expect(json1.pagination.nextCursor).toBeNull();
    }
  });

  it("validates pagination limit boundaries", async () => {
    // limit too small
    const res1 = await app.request("/api/bookings?limit=0");
    expect(res1.status).toBe(400);

    // limit too large
    const res2 = await app.request("/api/bookings?limit=101");
    expect(res2.status).toBe(400);

    // valid limit
    const res3 = await app.request("/api/bookings?limit=50");
    expect(res3.status).toBe(200);
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

  it("lists users for admin", async () => {
    const res = await app.request("/api/users", {
      headers: authorizedHeaders,
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.length).toBeGreaterThan(0);
    expect(json.data[0]).toMatchObject({
      email: expect.any(String),
      role: expect.any(String),
      isActive: true,
    });
  });

  it("forbids listing users for coordinators", async () => {
    const res = await app.request("/api/users", {
      headers: coordinatorHeaders,
    });

    expect(res.status).toBe(403);
  });

  it("creates a user when admin", async () => {
    const payload = {
      email: "new.user@test.com",
      fullName: "Nuevo Usuario",
      role: "STAFF",
      password: "ClaveSegura123",
    };

    const res = await app.request("/api/users", {
      method: "POST",
      headers: {
        ...authorizedHeaders,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.email).toBe(payload.email);
    expect(json.data.role).toBe("STAFF");
    expect(json.data.isActive).toBe(true);
    expect(mockHash).toHaveBeenCalledWith("ClaveSegura123", 10);
  });

  it("rejects duplicate user emails", async () => {
    const res = await app.request("/api/users", {
      method: "POST",
      headers: {
        ...authorizedHeaders,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        email: usersFixture[0].email,
        fullName: "Duplicado",
        password: "ClaveSegura123",
        role: "STAFF",
      }),
    });

    expect(res.status).toBe(409);
  });

  it("prevents admins from deactivating themselves", async () => {
    const me = usersFixture[1];
    const res = await app.request(`/api/users/${me.id}`, {
      method: "PATCH",
      headers: {
        ...authorizedHeaders,
        Authorization: "Bearer jwt-admin",
        "content-type": "application/json",
      },
      body: JSON.stringify({ isActive: false }),
    });

    expect(res.status).toBe(400);
  });

  it("prevents admins from changing own role", async () => {
    const me = usersFixture[1];
    const res = await app.request(`/api/users/${me.id}`, {
      method: "PATCH",
      headers: {
        ...authorizedHeaders,
        Authorization: "Bearer jwt-admin",
        "content-type": "application/json",
      },
      body: JSON.stringify({ role: "STAFF" }),
    });

    expect(res.status).toBe(400);
  });

  it("updates user role and password", async () => {
    const target = usersFixture[2];

    const res = await app.request(`/api/users/${target.id}`, {
      method: "PATCH",
      headers: authorizedHeaders,
      body: JSON.stringify({ role: "STAFF", password: "NuevoPass123" }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.role).toBe("STAFF");
    expect(json.data.isActive).toBe(true);
    expect(mockHash).toHaveBeenCalledWith("NuevoPass123", 10);
  });

  it("logs in a user and returns a token", async () => {
    const res = await app.request("/api/authentication/login", {
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
      const res = await app.request("/api/authentication/login", {
        method: "POST",
        body: JSON.stringify({
          email: "unknown@brisacubanaclean.com",
          password: "WrongPass!",
        }),
      });
      expect(res.status).toBe(401);
    }

    const blocked = await app.request("/api/authentication/login", {
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

    const res = await app.request("/api/authentication/login", {
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

  describe("OpenAPI contract", () => {
    function assertConforms({
      path,
      method,
      status,
      body,
    }: {
      path: keyof typeof openApiSpec.paths;
      method: string;
      status: number;
      body: unknown;
    }) {
      const pathItem = openApiSpec.paths[path];
      if (!pathItem) {
        throw new Error(
          `Path '${String(path)}' not documented in OpenAPI spec`,
        );
      }

      const operation = (pathItem as Record<string, unknown>)[method];
      if (!operation) {
        throw new Error(
          `Operation '${method.toUpperCase()}' for path '${String(path)}' missing in OpenAPI spec`,
        );
      }

      const validator = new OpenAPIResponseValidator({
        version: openApiSpec.openapi,
        responses: (operation as { responses: unknown }).responses,
        components: openApiSpec.components as Record<string, unknown>,
      } as any);

      const validationResult = validator.validateResponse(status, body);
      if (validationResult) {
        const { message, errors } = validationResult;
        throw new Error(
          `Response for ${method.toUpperCase()} ${String(path)} did not match OpenAPI schema: ${message}\n${JSON.stringify(errors, null, 2)}`,
        );
      }
    }

    it("GET /api/services matches documented schema", async () => {
      const response = await app.request("/api/services");
      expect(response.status).toBe(200);
      const json = await response.json();
      assertConforms({
        path: "/api/services",
        method: "get",
        status: 200,
        body: json,
      });
    });

    it("GET /api/bookings matches documented schema", async () => {
      const response = await app.request("/api/bookings");
      expect(response.status).toBe(200);
      const json = await response.json();
      assertConforms({
        path: "/api/bookings",
        method: "get",
        status: 200,
        body: json,
      });
    });

    it("POST /api/authentication/login matches documented schema", async () => {
      const response = await app.request("/api/authentication/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "admin@brisacubanaclean.com",
          password: "Brisa123!",
        }),
      });

      expect(response.status).toBe(200);
      const json = await response.json();
      assertConforms({
        path: "/api/authentication/login",
        method: "post",
        status: 200,
        body: json,
      });
    });
  });
});
