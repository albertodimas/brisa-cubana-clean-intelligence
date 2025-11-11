import { describe, expect, it, vi, beforeEach } from "vitest";
import OpenAPIResponseValidator from "openapi-response-validator";
import { openApiSpec } from "../../src/lib/openapi-spec.js";
import { resetRateLimiterStoresForTests } from "../../src/lib/rate-limiter.js";

process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.JWT_SECRET = "test-secret";
process.env.LOGIN_RATE_LIMIT = "3";
process.env.LOGIN_RATE_LIMIT_WINDOW_MS = "1000";

let servicesFixture: any[] = [];
let bookingsFixture: any[] = [];
let usersFixture: any[] = [];
let propertiesFixture: any[] = [];
let notificationsFixture: any[] = [];
let userSessionsFixture: any[] = [];

const makeCuid = (index: number) => `c${index.toString(36).padStart(24, "0")}`;

const mockPrisma = {
  $queryRaw: vi.fn().mockResolvedValue([{ ok: 1 }]),
  userSession: {
    create: vi.fn().mockImplementation(async ({ data }: any) => {
      const record = {
        id: makeCuid(userSessionsFixture.length + 1),
        userId: data.userId,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
        userAgent: data.userAgent ?? null,
        ipAddress: data.ipAddress ?? null,
        createdAt: new Date(),
        revokedAt: null,
        revocationReason: null,
      };
      userSessionsFixture.push(record);
      return record;
    }),
    findFirst: vi.fn().mockImplementation(
      async ({ where }: { where?: any }) =>
        userSessionsFixture.find((session) => {
          if (where?.tokenHash && session.tokenHash !== where.tokenHash) {
            return false;
          }
          if (where?.revokedAt === null && session.revokedAt !== null) {
            return false;
          }
          if (where?.expiresAt?.gt) {
            if (!(session.expiresAt > where.expiresAt.gt)) {
              return false;
            }
          }
          return true;
        }) ?? null,
    ),
    update: vi.fn().mockImplementation(async ({ where, data }: any) => {
      const target = userSessionsFixture.find(
        (session) => session.id === where.id,
      );
      if (!target) {
        throw new Error("Session not found");
      }
      Object.assign(target, data);
      return target;
    }),
    updateMany: vi.fn().mockImplementation(async ({ where, data }: any) => {
      let count = 0;
      userSessionsFixture.forEach((session) => {
        const matchesTokenHash =
          typeof where?.tokenHash === "string"
            ? session.tokenHash === where.tokenHash
            : true;
        const matchesUserId =
          typeof where?.userId === "string"
            ? session.userId === where.userId
            : true;
        const matchesRevoked =
          where?.revokedAt === null ? session.revokedAt === null : true;
        if (matchesTokenHash && matchesUserId && matchesRevoked) {
          Object.assign(session, data);
          count += 1;
        }
      });
      return { count };
    }),
  },
  service: {
    findMany: vi.fn().mockImplementation(
      async ({
        take,
        skip,
        cursor,
        where,
      }: {
        take?: number;
        skip?: number;
        cursor?: { id: string };
        where?: any;
      } = {}) => {
        let filtered = servicesFixture.filter(
          (service) => service.deletedAt === null,
        );

        if (where) {
          filtered = filtered.filter((service) => {
            if (typeof where.active === "boolean") {
              if (service.active !== where.active) {
                return false;
              }
            }

            if (Array.isArray(where.OR) && where.OR.length > 0) {
              const matchesOr = where.OR.some((clause: any) => {
                if (clause.name?.contains) {
                  return (
                    typeof service.name === "string" &&
                    service.name
                      .toLowerCase()
                      .includes(clause.name.contains.toLowerCase())
                  );
                }
                if (clause.description?.contains) {
                  if (!service.description) return false;
                  return service.description
                    .toLowerCase()
                    .includes(clause.description.contains.toLowerCase());
                }
                return false;
              });
              if (!matchesOr) {
                return false;
              }
            }

            return true;
          });
        }

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
        deletedAt: null,
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
          if (booking.deletedAt) {
            return false;
          }
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
          if (Array.isArray(where.OR) && where.OR.length > 0) {
            const matchesSearch = where.OR.some((clause: any) => {
              if (clause.code?.contains) {
                return booking.code
                  .toLowerCase()
                  .includes(clause.code.contains.toLowerCase());
              }
              if (clause.customer?.OR) {
                const customer =
                  usersFixture.find((user) => user.id === booking.customerId) ??
                  null;
                if (!customer) return false;
                return clause.customer.OR.some((customerClause: any) => {
                  if (customerClause.email?.contains) {
                    return customer.email
                      .toLowerCase()
                      .includes(customerClause.email.contains.toLowerCase());
                  }
                  if (customerClause.fullName?.contains) {
                    if (!customer.fullName) return false;
                    return customer.fullName
                      .toLowerCase()
                      .includes(customerClause.fullName.contains.toLowerCase());
                  }
                  return false;
                });
              }
              if (clause.property?.label?.contains) {
                const property =
                  propertiesFixture.find(
                    (property) => property.id === booking.propertyId,
                  ) ?? null;
                if (!property) return false;
                return property.label
                  .toLowerCase()
                  .includes(clause.property.label.contains.toLowerCase());
              }
              return false;
            });
            if (!matchesSearch) {
              return false;
            }
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
            deletedAt: null,
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
    findUnique: vi
      .fn()
      .mockImplementation(
        async ({ where, include }: { where: any; include?: any }) => {
          const booking = bookingsFixture.find((item) => item.id === where.id);
          if (!booking) {
            return null;
          }
          if (!include) {
            return booking;
          }
          return {
            ...booking,
            customer: include.customer
              ? (usersFixture.find((user) => user.id === booking.customerId) ??
                null)
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
          };
        },
      ),
    findFirst: vi.fn().mockResolvedValue(null), // Para hasTimeConflict - no conflictos por defecto
  },
  user: {
    findUnique: vi
      .fn()
      .mockImplementation(async ({ where }: { where: any }) => {
        const match = (() => {
          if (where.id) {
            return usersFixture.find((item) => item.id === where.id) ?? null;
          }
          if (where.email) {
            return (
              usersFixture.find((item) => item.email === where.email) ?? null
            );
          }
          return null;
        })();
        if (match?.deletedAt) {
          return null;
        }
        return match;
      }),
    findMany: vi.fn().mockImplementation(
      async ({
        where,
        take,
        skip,
        cursor,
        select,
      }: {
        where?: any;
        take?: number;
        skip?: number;
        cursor?: { id: string };
        select?: Record<string, boolean>;
      } = {}) => {
        let filtered = usersFixture.filter((user) => user.deletedAt === null);

        if (where?.role) {
          filtered = filtered.filter((user) => user.role === where.role);
        }

        if (typeof where?.isActive === "boolean") {
          filtered = filtered.filter(
            (user) => user.isActive === where.isActive,
          );
        }

        if (Array.isArray(where?.OR) && where.OR.length > 0) {
          filtered = filtered.filter((user) => {
            const matches = where.OR.some((clause: any) => {
              if (clause.email?.contains) {
                return user.email
                  .toLowerCase()
                  .includes(clause.email.contains.toLowerCase());
              }
              if (clause.fullName?.contains) {
                if (!user.fullName) return false;
                return user.fullName
                  .toLowerCase()
                  .includes(clause.fullName.contains.toLowerCase());
              }
              return false;
            });
            return matches;
          });
        }

        if (Array.isArray(where?.AND) && where.AND.length > 0) {
          filtered = filtered.filter((user) => {
            return where.AND.every((condition: any) => {
              if (Array.isArray(condition.OR)) {
                return condition.OR.some((clause: any) => {
                  if (clause.email?.contains) {
                    return user.email
                      .toLowerCase()
                      .includes(clause.email.contains.toLowerCase());
                  }
                  if (clause.fullName?.contains) {
                    if (!user.fullName) return false;
                    return user.fullName
                      .toLowerCase()
                      .includes(clause.fullName.contains.toLowerCase());
                  }
                  return false;
                });
              }
              return true;
            });
          });
        }

        if (cursor?.id) {
          const cursorIndex = filtered.findIndex(
            (user) => user.id === cursor.id,
          );
          if (cursorIndex !== -1) {
            filtered = filtered.slice(cursorIndex);
          }
        }

        if (skip) {
          filtered = filtered.slice(skip);
        }

        if (take) {
          filtered = filtered.slice(0, take);
        }

        if (select) {
          return filtered.map((user) => {
            const picked: Record<string, unknown> = {};
            for (const key of Object.keys(select)) {
              if (select[key]) {
                picked[key] = (user as any)[key];
              }
            }
            return picked;
          });
        }

        return filtered;
      },
    ),
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
        deletedAt: null,
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
        include,
        where,
      }: {
        take?: number;
        skip?: number;
        cursor?: { id: string };
        include?: any;
        where?: any;
      } = {}) => {
        let filtered = propertiesFixture.filter(
          (property) => property.deletedAt === null,
        );

        if (where) {
          filtered = filtered.filter((property) => {
            if (where.city && property.city !== where.city) {
              return false;
            }
            if (where.type && property.type !== where.type) {
              return false;
            }
            if (Array.isArray(where.OR) && where.OR.length > 0) {
              const matchesOr = where.OR.some((clause: any) => {
                if (clause.label?.contains) {
                  return property.label
                    .toLowerCase()
                    .includes(clause.label.contains.toLowerCase());
                }
                if (clause.city?.contains) {
                  return property.city
                    .toLowerCase()
                    .includes(clause.city.contains.toLowerCase());
                }
                if (clause.addressLine?.contains) {
                  return property.addressLine
                    .toLowerCase()
                    .includes(clause.addressLine.contains.toLowerCase());
                }
                return false;
              });
              if (!matchesOr) {
                return false;
              }
            }
            return true;
          });
        }

        if (cursor) {
          const cursorIndex = filtered.findIndex((p) => p.id === cursor.id);
          if (cursorIndex !== -1) {
            filtered = filtered.slice(cursorIndex);
          }
        }

        if (skip) {
          filtered = filtered.slice(skip);
        }

        if (take) {
          filtered = filtered.slice(0, take);
        }

        if (include?.owner) {
          filtered = filtered.map((property) => ({
            ...property,
            owner:
              usersFixture.find((user) => user.id === property.ownerId) ?? null,
          }));
        }

        return filtered;
      },
    ),
    create: vi
      .fn()
      .mockImplementation(
        async ({ data, include }: { data: any; include?: any }) => {
          const record = {
            id: makeCuid(propertiesFixture.length + 201),
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
            ...data,
          };
          propertiesFixture.push(record);
          if (include?.owner) {
            return {
              ...record,
              owner:
                usersFixture.find((user) => user.id === record.ownerId) ?? null,
            };
          }
          return record;
        },
      ),
    findUnique: vi
      .fn()
      .mockImplementation(
        async ({ where }: { where: any }) =>
          propertiesFixture.find((item) => item.id === where.id) ?? null,
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
          const property = propertiesFixture.find(
            (item) => item.id === where.id,
          );
          if (!property) {
            throw new Error("Property not found");
          }
          Object.assign(property, data, { updatedAt: new Date() });
          if (include?.owner) {
            return {
              ...property,
              owner:
                usersFixture.find((user) => user.id === property.ownerId) ??
                null,
            };
          }
          return property;
        },
      ),
  },
  notification: {
    findMany: vi.fn().mockImplementation(
      async ({
        where = {},
        take,
        skip,
        cursor,
      }: {
        where?: any;
        take?: number;
        skip?: number;
        cursor?: { id: string };
      } = {}) => {
        let filtered = notificationsFixture
          .filter((notification) =>
            where.userId ? notification.userId === where.userId : true,
          )
          .filter((notification) =>
            where.readAt === null ? notification.readAt === null : true,
          )
          .sort((a, b) => {
            const dateDiff = b.createdAt.getTime() - a.createdAt.getTime();
            if (dateDiff !== 0) {
              return dateDiff;
            }
            return b.id.localeCompare(a.id);
          });

        if (cursor?.id) {
          const cursorIndex = filtered.findIndex(
            (item) => item.id === cursor.id,
          );
          if (cursorIndex !== -1) {
            filtered = filtered.slice(cursorIndex + 1);
          }
        }

        if (skip) {
          filtered = filtered.slice(skip);
        }

        if (take) {
          filtered = filtered.slice(0, take);
        }

        return filtered;
      },
    ),
    update: vi
      .fn()
      .mockImplementation(
        async ({ where, data }: { where: any; data: any }) => {
          const notification = notificationsFixture.find(
            (item) => item.id === where.id && item.userId === where.userId,
          );
          if (!notification) {
            const error: any = new Error("Notification not found");
            error.code = "P2025";
            throw error;
          }
          Object.assign(notification, data);
          return notification;
        },
      ),
    updateMany: vi.fn().mockImplementation(async ({ where, data }: any) => {
      let count = 0;
      notificationsFixture.forEach((notification) => {
        if (
          notification.userId === where.userId &&
          (where.readAt === null ? notification.readAt === null : true)
        ) {
          Object.assign(notification, data);
          count += 1;
        }
      });
      return { count };
    }),
    create: vi.fn().mockImplementation(async ({ data }: any) => {
      const record = {
        id: makeCuid(900 + notificationsFixture.length),
        createdAt: new Date(),
        readAt: null,
        ...data,
      };
      notificationsFixture.unshift(record);
      return record;
    }),
  },
};

const mockVerify = vi.fn((token: string) =>
  token === "jwt-admin"
    ? {
        sub: makeCuid(102),
        email: "admin@brisacubanacleanintelligence.com",
        role: "ADMIN",
      }
    : token === "jwt-coordinator"
      ? {
          sub: makeCuid(103),
          email: "operaciones@brisacubanacleanintelligence.com",
          role: "COORDINATOR",
        }
      : null,
);

const mockSign = vi.fn(() => "jwt-admin");

const mockCompare = vi.fn().mockResolvedValue(true);
const mockHash = vi.fn().mockResolvedValue("hashed-password");

vi.mock("../../src/lib/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("../../src/lib/jwt", () => ({
  signAuthToken: mockSign,
  verifyAuthToken: mockVerify,
}));

vi.mock("bcryptjs", () => ({
  default: { compare: mockCompare, hash: mockHash },
  compare: mockCompare,
  hash: mockHash,
}));

const app = (await import("../../src/app")).default;
const { getServiceRepository, getBookingRepository } = await import(
  "../../src/container.js"
);

const authorizedHeaders = {
  Authorization: "Bearer jwt-admin",
};

const coordinatorHeaders = {
  Authorization: "Bearer jwt-coordinator",
};

describe("app", () => {
  beforeEach(async () => {
    await resetRateLimiterStoresForTests();
    vi.clearAllMocks();
    servicesFixture = [
      {
        id: makeCuid(1),
        name: "Turnover Premium Airbnb",
        description:
          "Cambio integral entre huéspedes con restocking completo y reporte fotográfico en menos de 4 horas.",
        basePrice: 249,
        durationMin: 160,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
      {
        id: makeCuid(2),
        name: "Deep Clean Brickell Collection",
        description:
          "Limpieza profunda con detailing premium y tratamiento antivaho.",
        basePrice: 369,
        durationMin: 210,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
      {
        id: makeCuid(3),
        name: "Post-Construcción Boutique",
        description:
          "Limpieza fina post obra con pulido de superficies y staging final.",
        basePrice: 489,
        durationMin: 240,
        active: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
      {
        id: makeCuid(4),
        name: "Amenity Refresh Express",
        description:
          "Reposición rápida entre estancias back-to-back y checklist de decoración.",
        basePrice: 129,
        durationMin: 90,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
    ];
    usersFixture = [
      {
        id: makeCuid(101),
        fullName: "Sofía Márquez",
        email: "client@test.com",
        passwordHash: "$2a$10$hashed",
        role: "CLIENT",
        isActive: true,
        deletedAt: null,
      },
      {
        id: makeCuid(102),
        fullName: "Laura Domínguez",
        email: "admin@brisacubanacleanintelligence.com",
        passwordHash: "$2a$10$hashed",
        role: "ADMIN",
        isActive: true,
        deletedAt: null,
      },
      {
        id: makeCuid(103),
        fullName: "Andrés Cabrera",
        email: "operaciones@brisacubanacleanintelligence.com",
        passwordHash: "$2a$10$hashed",
        role: "COORDINATOR",
        isActive: true,
        deletedAt: null,
      },
      {
        id: makeCuid(104),
        fullName: "Equipo Operaciones",
        email: "staff@test.com",
        passwordHash: "$2a$10$hashed",
        role: "STAFF",
        isActive: false,
        deletedAt: null,
      },
    ];
    propertiesFixture = [
      {
        id: makeCuid(201),
        label: "Skyline Loft Brickell",
        city: "Miami",
        ownerId: usersFixture[0].id,
        addressLine: "120 SW 8th St",
        state: "FL",
        zipCode: "33130",
        type: "VACATION_RENTAL",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
        deletedAt: null,
      },
      {
        id: makeCuid(202),
        label: "Azure Villa Key Biscayne",
        city: "Key Biscayne",
        ownerId: usersFixture[0].id,
        addressLine: "745 Harbor Dr",
        state: "FL",
        zipCode: "33149",
        type: "VACATION_RENTAL",
        createdAt: new Date("2024-02-01"),
        updatedAt: new Date("2024-02-01"),
        deletedAt: null,
      },
      {
        id: makeCuid(203),
        label: "Downtown Office Suite",
        city: "Orlando",
        ownerId: usersFixture[0].id,
        addressLine: "1 Orlando Center",
        state: "FL",
        zipCode: "32801",
        type: "OFFICE",
        createdAt: new Date("2024-03-01"),
        updatedAt: new Date("2024-03-01"),
        deletedAt: null,
      },
    ];
    bookingsFixture = [
      {
        id: "booking_fixture_1",
        code: "BRISA-0001",
        scheduledAt: new Date("2025-10-21T13:30:00Z"),
        durationMin: 160,
        notes:
          "Stock de amenities ‘Signature Citrus’. Revisar sensor de humedad en master bedroom.",
        status: "CONFIRMED",
        totalAmount: 249,
        customerId: usersFixture[0].id,
        propertyId: propertiesFixture[0].id,
        serviceId: servicesFixture[0].id,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
      {
        id: "booking_fixture_2",
        code: "BRISA-0003",
        scheduledAt: new Date("2025-10-22T18:00:00Z"),
        durationMin: 90,
        notes:
          "Back-to-back stay. Reponer welcome kit y staging del patio exterior.",
        status: "CONFIRMED",
        totalAmount: 129,
        customerId: usersFixture[0].id,
        propertyId: propertiesFixture[1].id,
        serviceId: servicesFixture[3].id,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
    ];
    notificationsFixture = [
      {
        id: makeCuid(900),
        userId: usersFixture[1].id,
        type: "BOOKING_CREATED",
        message:
          "Se agendó BRISA-0003 – Amenity Refresh Express en Azure Villa Key Biscayne.",
        readAt: null,
        createdAt: new Date("2025-10-15T09:00:00Z"),
      },
      {
        id: makeCuid(901),
        userId: usersFixture[1].id,
        type: "SERVICE_UPDATED",
        message:
          "El servicio Turnover Premium Airbnb ahora incluye auditoría de inventario con RFID.",
        readAt: new Date("2025-10-14T15:00:00Z"),
        createdAt: new Date("2025-10-14T12:00:00Z"),
      },
      {
        id: makeCuid(902),
        userId: usersFixture[2].id,
        type: "BOOKING_RESCHEDULED",
        message:
          "Alerta: cliente reporta humedad en baño de visitas (Skyline Loft Brickell) – coordinar inspección preventiva.",
        readAt: null,
        createdAt: new Date("2025-10-13T08:00:00Z"),
      },
    ];
    userSessionsFixture = [];
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
    const previousStripeSecret = process.env.STRIPE_SECRET_KEY;
    const previousStripeWebhook = process.env.STRIPE_WEBHOOK_SECRET;
    const mailerKeys = [
      "PORTAL_MAGIC_LINK_SMTP_HOST",
      "PORTAL_MAGIC_LINK_SMTP_PORT",
      "PORTAL_MAGIC_LINK_SMTP_USER",
      "PORTAL_MAGIC_LINK_SMTP_PASSWORD",
      "PORTAL_MAGIC_LINK_SMTP_SECURE",
      "PORTAL_MAGIC_LINK_FROM",
    ] as const;

    const previousMailer = mailerKeys.reduce<
      Record<string, string | undefined>
    >((acc, key) => {
      acc[key] = process.env[key];
      return acc;
    }, {});

    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    mailerKeys.forEach((key) => {
      delete process.env[key];
    });

    try {
      const res = await app.request("/health");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe("pass");
      expect(body.checks.database.status).toBe("ok");
      expect(body.checks.stripe.status).toBe("disabled");
      expect(body.checks.email.status).toBe("disabled");
      expect(body.checks.sentry.status).toBe("disabled");
      expect(body.timestamp).toBeDefined();
      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
    } finally {
      const restoreEnv = (key: string, value: string | undefined) => {
        if (value !== undefined) {
          process.env[key] = value;
        } else {
          delete process.env[key];
        }
      };

      restoreEnv("STRIPE_SECRET_KEY", previousStripeSecret);
      restoreEnv("STRIPE_WEBHOOK_SECRET", previousStripeWebhook);
      mailerKeys.forEach((key) => {
        restoreEnv(key, previousMailer[key]);
      });
    }
  });

  it("returns failure when database is down", async () => {
    mockPrisma.$queryRaw.mockRejectedValueOnce(new Error("connection refused"));

    const res = await app.request("/health");
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.status).toBe("fail");
    expect(body.checks.database.status).toBe("error");
  });

  it("lists services", async () => {
    const res = await app.request("/api/services");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.length).toBeGreaterThan(0);
  });

  it("delegates service listing to the service repository", async () => {
    const repository = getServiceRepository();
    const spy = vi.spyOn(repository, "findManyWithSearch");

    const res = await app.request("/api/services");
    expect(res.status).toBe(200);
    expect(spy).toHaveBeenCalledWith({
      search: undefined,
      active: undefined,
      limit: 50,
      cursor: undefined,
    });

    spy.mockRestore();
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

  it("soft deletes a service", async () => {
    const target = servicesFixture[0];

    const res = await app.request(`/api/services/${target.id}`, {
      method: "DELETE",
      headers: authorizedHeaders,
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.message).toBe("Service deleted successfully");

    const list = await app.request("/api/services");
    const listJson = await list.json();
    expect(listJson.data.some((service: any) => service.id === target.id)).toBe(
      false,
    );
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

  it("filters services by search term", async () => {
    const res = await app.request("/api/services?search=deep");
    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json.data.length).toBe(1);
    expect(json.data[0].name).toContain("Deep");
  });

  it("filters services by active flag", async () => {
    const res = await app.request("/api/services?active=false");
    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json.data.length).toBe(1);
    expect(json.data[0].active).toBe(false);
  });

  it("returns empty array when service search has no matches", async () => {
    const res = await app.request("/api/services?search=nomatch");
    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json.data).toHaveLength(0);
    expect(json.pagination.hasMore).toBe(false);
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
    const res = await app.request("/api/properties", {
      headers: authorizedHeaders,
    });
    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json.data).toBeDefined();
    expect(json.pagination).toBeDefined();
    expect(json.pagination.limit).toBe(50);
    expect(json.pagination.hasMore).toBe(false);
  });

  it("paginates properties with custom limit", async () => {
    const res = await app.request("/api/properties?limit=1", {
      headers: authorizedHeaders,
    });
    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json.data.length).toBeLessThanOrEqual(1);
    expect(json.pagination.limit).toBe(1);
  });

  it("filters properties by search and type", async () => {
    const res = await app.request(
      "/api/properties?search=biscayne&type=VACATION_RENTAL",
      { headers: authorizedHeaders },
    );
    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json.data).toHaveLength(1);
    expect(json.data[0].label).toBe("Azure Villa Key Biscayne");
  });

  it("navigates properties pagination with cursor", async () => {
    const firstPage = await app.request("/api/properties?limit=1", {
      headers: authorizedHeaders,
    });
    const firstJson = await firstPage.json();

    expect(firstJson.pagination.hasMore).toBe(true);
    expect(firstJson.pagination.nextCursor).toBeDefined();

    const secondPage = await app.request(
      `/api/properties?limit=1&cursor=${firstJson.pagination.nextCursor}`,
      { headers: authorizedHeaders },
    );
    const secondJson = await secondPage.json();

    expect(secondJson.data[0]?.id).not.toBe(firstJson.data[0]?.id);
  });

  it("validates properties pagination boundaries", async () => {
    const invalidLimit = await app.request("/api/properties?limit=0", {
      headers: authorizedHeaders,
    });
    expect(invalidLimit.status).toBe(400);

    const tooHighLimit = await app.request("/api/properties?limit=101", {
      headers: authorizedHeaders,
    });
    expect(tooHighLimit.status).toBe(400);
  });

  it("lists bookings", async () => {
    const res = await app.request("/api/bookings", {
      headers: authorizedHeaders,
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toBeDefined();
  });

  it("delegates booking listing to the booking repository", async () => {
    const repository = getBookingRepository();
    const spy = vi.spyOn(repository, "findManyPaginated");

    const res = await app.request("/api/bookings", {
      headers: authorizedHeaders,
    });
    expect(res.status).toBe(200);
    expect(spy).toHaveBeenCalledWith(20, undefined, {}, true, {
      orderBy: [{ scheduledAt: "asc" }, { id: "asc" }],
    });

    spy.mockRestore();
  });

  it("filters bookings by date range", async () => {
    const from = new Date("2025-10-20T00:00:00Z").toISOString();
    const to = new Date("2025-10-23T23:59:59Z").toISOString();
    const res = await app.request(
      `/api/bookings?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      { headers: authorizedHeaders },
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.length).toBeGreaterThan(0);
  });

  it("searches bookings by code", async () => {
    const res = await app.request("/api/bookings?search=BRISA-0001", {
      headers: authorizedHeaders,
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toHaveLength(1);
    expect(json.data[0].code).toBe("BRISA-0001");
  });

  it("returns empty bookings when search mismatches", async () => {
    const res = await app.request("/api/bookings?search=NO_MATCH_123", {
      headers: authorizedHeaders,
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toHaveLength(0);
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

  it("soft deletes a booking", async () => {
    const service = servicesFixture[0];
    const createRes = await app.request("/api/bookings", {
      method: "POST",
      headers: authorizedHeaders,
      body: JSON.stringify({
        customerId: makeCuid(101),
        propertyId: makeCuid(201),
        serviceId: service.id,
        scheduledAt: new Date().toISOString(),
      }),
    });
    expect(createRes.status).toBe(201);
    const created = await createRes.json();

    const res = await app.request(`/api/bookings/${created.data.id}`, {
      method: "DELETE",
      headers: authorizedHeaders,
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.message).toBe("Booking deleted successfully");

    const list = await app.request("/api/bookings", {
      headers: authorizedHeaders,
    });
    const listJson = await list.json();
    expect(
      listJson.data.some((booking: any) => booking.id === created.data.id),
    ).toBe(false);
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
        deletedAt: null,
      });
    }

    const res = await app.request("/api/bookings", {
      headers: authorizedHeaders,
    });
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
    const res = await app.request("/api/bookings?limit=5", {
      headers: authorizedHeaders,
    });
    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json.data.length).toBeLessThanOrEqual(5);
    expect(json.pagination.limit).toBe(5);
  });

  it("paginates bookings with cursor", async () => {
    // First page
    const res1 = await app.request("/api/bookings?limit=5", {
      headers: authorizedHeaders,
    });
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
        { headers: authorizedHeaders },
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
    const res1 = await app.request("/api/bookings?limit=0", {
      headers: authorizedHeaders,
    });
    expect(res1.status).toBe(400);

    // limit too large
    const res2 = await app.request("/api/bookings?limit=101", {
      headers: authorizedHeaders,
    });
    expect(res2.status).toBe(400);

    // valid limit
    const res3 = await app.request("/api/bookings?limit=50", {
      headers: authorizedHeaders,
    });
    expect(res3.status).toBe(200);
  });

  it("lists properties", async () => {
    const res = await app.request("/api/properties", {
      headers: authorizedHeaders,
    });
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

  it("soft deletes a property", async () => {
    const createRes = await app.request("/api/properties", {
      method: "POST",
      headers: authorizedHeaders,
      body: JSON.stringify({
        label: "Ocean Breeze Condo",
        addressLine: "250 Ocean Dr",
        city: "Miami",
        state: "FL",
        zipCode: "33139",
        type: "VACATION_RENTAL",
        ownerId: makeCuid(101),
      }),
    });

    expect(createRes.status).toBe(201);
    const created = await createRes.json();

    const res = await app.request(`/api/properties/${created.data.id}`, {
      method: "DELETE",
      headers: authorizedHeaders,
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.message).toBe("Property deleted successfully");

    const list = await app.request("/api/properties", {
      headers: authorizedHeaders,
    });
    const listJson = await list.json();
    expect(
      listJson.data.some((property: any) => property.id === created.data.id),
    ).toBe(false);
  });

  it("lists customers with authorization", async () => {
    const res = await app.request("/api/customers", {
      headers: authorizedHeaders,
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data[0].email).toBeDefined();
  });

  it("filters customers by search term", async () => {
    const res = await app.request("/api/customers?search=client", {
      headers: authorizedHeaders,
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toHaveLength(1);
    expect(json.data[0].email).toBe("client@test.com");
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

  it("filters users by search, role and active status", async () => {
    const res = await app.request(
      "/api/users?search=staff&role=STAFF&isActive=false",
      {
        headers: authorizedHeaders,
      },
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toHaveLength(1);
    expect(json.data[0]).toMatchObject({
      email: "staff@test.com",
      role: "STAFF",
      isActive: false,
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

  it("prevents admins from deleting themselves", async () => {
    const self = usersFixture[1];

    const res = await app.request(`/api/users/${self.id}`, {
      method: "DELETE",
      headers: authorizedHeaders,
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("No puedes eliminar tu propia cuenta");
  });

  it("soft deletes a user", async () => {
    const createRes = await app.request("/api/users", {
      method: "POST",
      headers: {
        ...authorizedHeaders,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        email: "delete.me@test.com",
        fullName: "Usuario Temporal",
        role: "STAFF",
        password: "Temporal123",
      }),
    });

    expect(createRes.status).toBe(201);
    const created = await createRes.json();

    const res = await app.request(`/api/users/${created.data.id}`, {
      method: "DELETE",
      headers: authorizedHeaders,
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.message).toBe("User deleted successfully");

    const list = await app.request("/api/users", {
      headers: authorizedHeaders,
    });
    const listJson = await list.json();
    expect(listJson.data.some((user: any) => user.id === created.data.id)).toBe(
      false,
    );
  });

  it("lists notifications for the authenticated admin", async () => {
    const res = await app.request("/api/notifications", {
      headers: authorizedHeaders,
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toHaveLength(2);
    expect(json.pagination.limit).toBe(25);
  });

  it("filters notifications by unreadOnly flag", async () => {
    const res = await app.request("/api/notifications?unreadOnly=true", {
      headers: authorizedHeaders,
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.every((notif: any) => notif.readAt === null)).toBe(true);
    expect(json.data).toHaveLength(1);
  });

  it("marks a notification as read", async () => {
    const target = notificationsFixture.find(
      (notif) => notif.userId === usersFixture[1].id && notif.readAt === null,
    );
    const res = await app.request(`/api/notifications/${target?.id}/read`, {
      method: "PATCH",
      headers: authorizedHeaders,
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.readAt).not.toBeNull();
    const updated = notificationsFixture.find(
      (notif) => notif.id === target?.id,
    );
    expect(updated?.readAt).not.toBeNull();
  });

  it("marks all notifications as read", async () => {
    const res = await app.request("/api/notifications/read-all", {
      method: "PATCH",
      headers: authorizedHeaders,
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.updatedCount).toBeGreaterThanOrEqual(1);
    expect(
      notificationsFixture
        .filter((notif) => notif.userId === usersFixture[1].id)
        .every((notif) => notif.readAt !== null),
    ).toBe(true);
  });

  it("rejects notification listing without authentication", async () => {
    const res = await app.request("/api/notifications");
    expect(res.status).toBe(401);
  });

  it("streams notifications for the authenticated admin", async () => {
    const res = await app.request("/api/notifications/stream", {
      headers: authorizedHeaders,
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("text/event-stream");

    const reader = res.body?.getReader();
    expect(reader).toBeDefined();
    const decoder = new TextDecoder();
    let combined = "";
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const chunk = await reader?.read();
      if (!chunk || chunk.done) {
        break;
      }
      combined += decoder.decode(chunk.value);
      if (combined.includes("event: init")) {
        break;
      }
    }
    expect(combined).toContain("event: init");
    await reader?.cancel();
  });

  it("rejects notification stream without authentication", async () => {
    const res = await app.request("/api/notifications/stream");
    expect(res.status).toBe(401);
  });

  it("logs in a user and returns a token", async () => {
    const res = await app.request("/api/authentication/login", {
      method: "POST",
      body: JSON.stringify({
        email: "admin@brisacubanacleanintelligence.com",
        password: "Brisa123!",
      }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.email).toBe("admin@brisacubanacleanintelligence.com");
    expect(json.token).toBe("jwt-admin");
    expect(mockSign).toHaveBeenCalled();
  });

  it("rejects login for inactive users", async () => {
    usersFixture[0].isActive = false;

    const res = await app.request("/api/authentication/login", {
      method: "POST",
      body: JSON.stringify({
        email: usersFixture[0].email,
        password: "AnyPassword123",
      }),
    });

    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("Account has been deactivated");

    usersFixture[0].isActive = true;
  });

  it("rate limits repeated login attempts", async () => {
    const windowMs = Number(process.env.LOGIN_RATE_LIMIT_WINDOW_MS ?? "1000");
    const limit = Number(process.env.LOGIN_RATE_LIMIT ?? "3");

    await new Promise((resolve) => setTimeout(resolve, windowMs + 100));

    for (let i = 0; i < limit; i += 1) {
      const res = await app.request("/api/authentication/login", {
        method: "POST",
        body: JSON.stringify({
          email: "unknown@brisacubanacleanintelligence.com",
          password: "WrongPass!",
        }),
      });
      expect(res.status).toBe(401);
    }

    const blocked = await app.request("/api/authentication/login", {
      method: "POST",
      body: JSON.stringify({
        email: "unknown@brisacubanacleanintelligence.com",
        password: "WrongPass!",
      }),
    });

    expect(blocked.status).toBe(429);
    const blockedBody = await blocked.json();
    expect(blockedBody.error).toContain(
      "Demasiados intentos de inicio de sesión",
    );

    await new Promise((resolve) => setTimeout(resolve, windowMs + 100));
  });

  it("rejects login with invalid credentials", async () => {
    mockCompare.mockResolvedValueOnce(false);

    const res = await app.request("/api/authentication/login", {
      method: "POST",
      body: JSON.stringify({
        email: "admin@brisacubanacleanintelligence.com",
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
      const response = await app.request("/api/bookings", {
        headers: authorizedHeaders,
      });
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
          email: "admin@brisacubanacleanintelligence.com",
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
