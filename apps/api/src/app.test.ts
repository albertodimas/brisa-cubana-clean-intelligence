import { describe, expect, it, vi, beforeEach } from "vitest";

process.env.API_TOKEN = "test-token";

let servicesFixture: any[] = [];
let bookingsFixture: any[] = [];
let usersFixture: any[] = [];
let propertiesFixture: any[] = [];

const makeCuid = (index: number) =>
  `c${index.toString(36).padStart(24, "0")}`;

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
    update: vi.fn().mockImplementation(async ({ where, data }: { where: any; data: any }) => {
      const record = servicesFixture.find((item) => item.id === where.id);
      if (!record) {
        throw new Error("Service not found");
      }
      Object.assign(record, data, { updatedAt: new Date() });
      return record;
    }),
    findUnique: vi.fn().mockImplementation(async ({ where }: { where: any }) =>
      servicesFixture.find((item) => item.id === where.id) ?? null,
    ),
  },
  booking: {
    findMany: vi.fn().mockImplementation(async () => bookingsFixture),
    create: vi.fn().mockImplementation(async ({ data, include }: { data: any; include: any }) => {
      const service = servicesFixture.find((item) => item.id === data.serviceId);
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
          ? usersFixture.find((user) => user.id === data.customerId) ?? {
              id: data.customerId,
              fullName: "Cliente",
              email: "client@test.com",
            }
          : undefined,
        property: include?.property
          ? propertiesFixture.find((property) => property.id === data.propertyId) ?? {
              id: data.propertyId,
              label: "Prop",
              city: "Miami",
            }
          : undefined,
        service: include?.service ? service : undefined,
      };
    }),
  },
  user: {
    findUnique: vi.fn().mockImplementation(async ({ where }: { where: any }) =>
      usersFixture.find((item) => item.id === where.id) ?? null,
    ),
  },
  property: {
    findUnique: vi.fn().mockImplementation(async ({ where }: { where: any }) =>
      propertiesFixture.find((item) => item.id === where.id) ?? null,
    ),
  },
};

vi.mock("./lib/prisma", () => ({
  prisma: mockPrisma,
}));

const app = (await import("./app")).default;

const authorizedHeaders = {
  Authorization: "Bearer test-token",
};

describe("app", () => {
  beforeEach(() => {
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
    bookingsFixture = [];
    usersFixture = [
      {
        id: makeCuid(101),
        fullName: "Cliente Piloto",
        email: "client@test.com",
      },
    ];
    propertiesFixture = [
      {
        id: makeCuid(201),
        label: "Brickell Loft",
        city: "Miami",
      },
    ];
    mockPrisma.$queryRaw.mockClear();
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
    const res = await app.request("/api/services", { method: "POST", body: "{}" });
    expect(res.status).toBe(401);
  });

  it("lists bookings", async () => {
    const res = await app.request("/api/bookings");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toBeDefined();
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
});
