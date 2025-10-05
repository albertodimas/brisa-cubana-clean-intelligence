import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { generateAccessToken } from "../lib/token";

// Mock dependencies
const reconciliationNoteMock = {
  findMany: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
};

vi.mock("../lib/db", () => ({
  db: {
    reconciliationNote: reconciliationNoteMock,
  },
}));

process.env.JWT_SECRET = "test-secret-reconciliation";

// Import after mocking
const reconciliation = (await import("./reconciliation")).default;

function buildApp() {
  const app = new Hono();
  app.route("/api/reconciliation", reconciliation);
  return app;
}

function authHeader(role: "ADMIN" | "STAFF" | "CLIENT", sub: string) {
  return {
    Authorization: `Bearer ${generateAccessToken({
      sub,
      email: `${sub}@example.com`,
      role,
    })}`,
  };
}

describe("Reconciliation Extended - GET /history/resolved", () => {
  let app: Hono;

  beforeEach(() => {
    app = buildApp();
    vi.clearAllMocks();
  });

  describe("Authorization", () => {
    it("should return 401 for unauthenticated requests", async () => {
      const response = await app.request(
        "/api/reconciliation/history/resolved",
      );

      expect(response.status).toBe(401);
    });

    it("should return 403 for CLIENT role", async () => {
      const response = await app.request(
        "/api/reconciliation/history/resolved",
        {
          headers: authHeader("CLIENT", "client-1"),
        },
      );

      expect(response.status).toBe(403);
    });

    it("should allow ADMIN access", async () => {
      reconciliationNoteMock.findMany.mockResolvedValueOnce([]);

      const response = await app.request(
        "/api/reconciliation/history/resolved",
        {
          headers: authHeader("ADMIN", "admin-1"),
        },
      );

      expect(response.status).toBe(200);
    });

    it("should allow STAFF access", async () => {
      reconciliationNoteMock.findMany.mockResolvedValueOnce([]);

      const response = await app.request(
        "/api/reconciliation/history/resolved",
        {
          headers: authHeader("STAFF", "staff-1"),
        },
      );

      expect(response.status).toBe(200);
    });
  });

  describe("Query Filters", () => {
    it("should filter by RESOLVED status", async () => {
      reconciliationNoteMock.findMany.mockResolvedValueOnce([]);

      await app.request("/api/reconciliation/history/resolved", {
        headers: authHeader("ADMIN", "admin-1"),
      });

      expect(reconciliationNoteMock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "RESOLVED",
          }),
        }),
      );
    });

    it("should use default limit of 20", async () => {
      reconciliationNoteMock.findMany.mockResolvedValueOnce([]);

      await app.request("/api/reconciliation/history/resolved", {
        headers: authHeader("ADMIN", "admin-1"),
      });

      expect(reconciliationNoteMock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
        }),
      );
    });

    it("should respect custom limit", async () => {
      reconciliationNoteMock.findMany.mockResolvedValueOnce([]);

      await app.request("/api/reconciliation/history/resolved?limit=50", {
        headers: authHeader("ADMIN", "admin-1"),
      });

      expect(reconciliationNoteMock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
        }),
      );
    });

    it("should cap limit at 100", async () => {
      reconciliationNoteMock.findMany.mockResolvedValueOnce([]);

      await app.request("/api/reconciliation/history/resolved?limit=200", {
        headers: authHeader("ADMIN", "admin-1"),
      });

      expect(reconciliationNoteMock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
        }),
      );
    });

    it("should filter by startDate", async () => {
      reconciliationNoteMock.findMany.mockResolvedValueOnce([]);

      await app.request(
        "/api/reconciliation/history/resolved?startDate=2025-01-01",
        {
          headers: authHeader("ADMIN", "admin-1"),
        },
      );

      expect(reconciliationNoteMock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            resolvedAt: expect.objectContaining({
              gte: new Date("2025-01-01"),
            }),
          }),
        }),
      );
    });

    it("should filter by endDate", async () => {
      reconciliationNoteMock.findMany.mockResolvedValueOnce([]);

      await app.request(
        "/api/reconciliation/history/resolved?endDate=2025-12-31",
        {
          headers: authHeader("ADMIN", "admin-1"),
        },
      );

      expect(reconciliationNoteMock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            resolvedAt: expect.objectContaining({
              lte: new Date("2025-12-31"),
            }),
          }),
        }),
      );
    });

    it("should filter by date range", async () => {
      reconciliationNoteMock.findMany.mockResolvedValueOnce([]);

      await app.request(
        "/api/reconciliation/history/resolved?startDate=2025-01-01&endDate=2025-12-31",
        {
          headers: authHeader("ADMIN", "admin-1"),
        },
      );

      expect(reconciliationNoteMock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            resolvedAt: {
              gte: new Date("2025-01-01"),
              lte: new Date("2025-12-31"),
            },
          }),
        }),
      );
    });

    it("should filter by authorEmail with case-insensitive search", async () => {
      reconciliationNoteMock.findMany.mockResolvedValueOnce([]);

      await app.request(
        "/api/reconciliation/history/resolved?authorEmail=john@example.com",
        {
          headers: authHeader("ADMIN", "admin-1"),
        },
      );

      expect(reconciliationNoteMock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            author: {
              email: {
                contains: "john@example.com",
                mode: "insensitive",
              },
            },
          }),
        }),
      );
    });

    it("should filter by bookingId", async () => {
      reconciliationNoteMock.findMany.mockResolvedValueOnce([]);

      await app.request(
        "/api/reconciliation/history/resolved?bookingId=booking-123",
        {
          headers: authHeader("ADMIN", "admin-1"),
        },
      );

      expect(reconciliationNoteMock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            bookingId: "booking-123",
          }),
        }),
      );
    });

    it("should order by resolvedAt desc", async () => {
      reconciliationNoteMock.findMany.mockResolvedValueOnce([]);

      await app.request("/api/reconciliation/history/resolved", {
        headers: authHeader("ADMIN", "admin-1"),
      });

      expect(reconciliationNoteMock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { resolvedAt: "desc" },
        }),
      );
    });

    it("should include author and resolvedBy", async () => {
      reconciliationNoteMock.findMany.mockResolvedValueOnce([]);

      await app.request("/api/reconciliation/history/resolved", {
        headers: authHeader("ADMIN", "admin-1"),
      });

      expect(reconciliationNoteMock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            author: expect.objectContaining({
              select: expect.objectContaining({
                id: true,
                name: true,
                email: true,
              }),
            }),
            resolvedBy: expect.any(Object),
          }),
        }),
      );
    });
  });
});

describe("Reconciliation Extended - GET /history/open", () => {
  let app: Hono;

  beforeEach(() => {
    app = buildApp();
    vi.clearAllMocks();
  });

  describe("Authorization", () => {
    it("should return 401 for unauthenticated requests", async () => {
      const response = await app.request("/api/reconciliation/history/open");

      expect(response.status).toBe(401);
    });

    it("should return 403 for CLIENT role", async () => {
      const response = await app.request("/api/reconciliation/history/open", {
        headers: authHeader("CLIENT", "client-1"),
      });

      expect(response.status).toBe(403);
    });

    it("should allow ADMIN and STAFF", async () => {
      reconciliationNoteMock.findMany.mockResolvedValueOnce([]);

      const response = await app.request("/api/reconciliation/history/open", {
        headers: authHeader("STAFF", "staff-1"),
      });

      expect(response.status).toBe(200);
    });
  });

  describe("Query Filters", () => {
    it("should filter by OPEN status", async () => {
      reconciliationNoteMock.findMany.mockResolvedValueOnce([]);

      await app.request("/api/reconciliation/history/open", {
        headers: authHeader("ADMIN", "admin-1"),
      });

      expect(reconciliationNoteMock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "OPEN",
          }),
        }),
      );
    });

    it("should filter by createdAt instead of resolvedAt", async () => {
      reconciliationNoteMock.findMany.mockResolvedValueOnce([]);

      await app.request(
        "/api/reconciliation/history/open?startDate=2025-01-01",
        {
          headers: authHeader("ADMIN", "admin-1"),
        },
      );

      expect(reconciliationNoteMock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: new Date("2025-01-01"),
            }),
          }),
        }),
      );
    });

    it("should order by createdAt desc", async () => {
      reconciliationNoteMock.findMany.mockResolvedValueOnce([]);

      await app.request("/api/reconciliation/history/open", {
        headers: authHeader("ADMIN", "admin-1"),
      });

      expect(reconciliationNoteMock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: "desc" },
        }),
      );
    });
  });
});

describe("Reconciliation Extended - GET /booking/:bookingId", () => {
  let app: Hono;

  beforeEach(() => {
    app = buildApp();
    vi.clearAllMocks();
  });

  describe("Authorization", () => {
    it("should return 401 for unauthenticated requests", async () => {
      const response = await app.request(
        "/api/reconciliation/booking/booking-1",
      );

      expect(response.status).toBe(401);
    });

    it("should return 403 for CLIENT role", async () => {
      const response = await app.request(
        "/api/reconciliation/booking/booking-1",
        {
          headers: authHeader("CLIENT", "client-1"),
        },
      );

      expect(response.status).toBe(403);
    });

    it("should allow ADMIN and STAFF", async () => {
      reconciliationNoteMock.findMany.mockResolvedValueOnce([]);

      const response = await app.request(
        "/api/reconciliation/booking/booking-1",
        {
          headers: authHeader("STAFF", "staff-1"),
        },
      );

      expect(response.status).toBe(200);
    });
  });

  describe("Query Parameters", () => {
    it("should filter by bookingId", async () => {
      reconciliationNoteMock.findMany.mockResolvedValueOnce([]);

      await app.request("/api/reconciliation/booking/booking-123", {
        headers: authHeader("ADMIN", "admin-1"),
      });

      expect(reconciliationNoteMock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            bookingId: "booking-123",
          }),
        }),
      );
    });

    it("should filter by OPEN status when provided", async () => {
      reconciliationNoteMock.findMany.mockResolvedValueOnce([]);

      await app.request("/api/reconciliation/booking/booking-1?status=OPEN", {
        headers: authHeader("ADMIN", "admin-1"),
      });

      expect(reconciliationNoteMock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "OPEN",
          }),
        }),
      );
    });

    it("should filter by RESOLVED status when provided", async () => {
      reconciliationNoteMock.findMany.mockResolvedValueOnce([]);

      await app.request(
        "/api/reconciliation/booking/booking-1?status=RESOLVED",
        {
          headers: authHeader("ADMIN", "admin-1"),
        },
      );

      expect(reconciliationNoteMock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "RESOLVED",
          }),
        }),
      );
    });

    it("should not filter by status if invalid value provided", async () => {
      reconciliationNoteMock.findMany.mockResolvedValueOnce([]);

      await app.request(
        "/api/reconciliation/booking/booking-1?status=INVALID",
        {
          headers: authHeader("ADMIN", "admin-1"),
        },
      );

      expect(reconciliationNoteMock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: undefined,
          }),
        }),
      );
    });

    it("should return all statuses when status param not provided", async () => {
      reconciliationNoteMock.findMany.mockResolvedValueOnce([]);

      await app.request("/api/reconciliation/booking/booking-1", {
        headers: authHeader("ADMIN", "admin-1"),
      });

      expect(reconciliationNoteMock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: undefined,
          }),
        }),
      );
    });
  });

  describe("Response", () => {
    it("should return array of notes", async () => {
      const mockNotes = [
        {
          id: "note-1",
          bookingId: "booking-1",
          message: "Payment discrepancy",
          status: "OPEN",
          author: { id: "staff-1", name: "Staff", email: "staff@example.com" },
        },
      ];

      reconciliationNoteMock.findMany.mockResolvedValueOnce(mockNotes);

      const response = await app.request(
        "/api/reconciliation/booking/booking-1",
        {
          headers: authHeader("ADMIN", "admin-1"),
        },
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveLength(1);
      expect(data[0].id).toBe("note-1");
    });

    it("should order by createdAt desc", async () => {
      reconciliationNoteMock.findMany.mockResolvedValueOnce([]);

      await app.request("/api/reconciliation/booking/booking-1", {
        headers: authHeader("ADMIN", "admin-1"),
      });

      expect(reconciliationNoteMock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: "desc" },
        }),
      );
    });
  });
});

describe("Reconciliation Extended - POST /booking/:bookingId", () => {
  let app: Hono;

  beforeEach(() => {
    app = buildApp();
    vi.clearAllMocks();
  });

  describe("Authorization", () => {
    it("should return 401 for unauthenticated requests", async () => {
      const response = await app.request(
        "/api/reconciliation/booking/booking-1",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: "Test note" }),
        },
      );

      expect(response.status).toBe(401);
    });

    it("should return 403 for CLIENT role", async () => {
      const response = await app.request(
        "/api/reconciliation/booking/booking-1",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeader("CLIENT", "client-1"),
          },
          body: JSON.stringify({ message: "Test note" }),
        },
      );

      expect(response.status).toBe(403);
    });

    it("should allow ADMIN to create notes", async () => {
      reconciliationNoteMock.create.mockResolvedValueOnce({
        id: "note-1",
        message: "Test note",
        author: { id: "admin-1", name: "Admin", email: "admin@example.com" },
      });

      const response = await app.request(
        "/api/reconciliation/booking/booking-1",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeader("ADMIN", "admin-1"),
          },
          body: JSON.stringify({ message: "Test note" }),
        },
      );

      expect(response.status).toBe(201);
    });

    it("should allow STAFF to create notes", async () => {
      reconciliationNoteMock.create.mockResolvedValueOnce({
        id: "note-1",
        message: "Test note",
        author: { id: "staff-1", name: "Staff", email: "staff@example.com" },
      });

      const response = await app.request(
        "/api/reconciliation/booking/booking-1",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeader("STAFF", "staff-1"),
          },
          body: JSON.stringify({ message: "Test note" }),
        },
      );

      expect(response.status).toBe(201);
    });
  });

  describe("Validation", () => {
    it("should return 400 for missing message", async () => {
      const response = await app.request(
        "/api/reconciliation/booking/booking-1",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeader("ADMIN", "admin-1"),
          },
          body: JSON.stringify({}),
        },
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Invalid reconciliation note payload");
      expect(data.details).toBeDefined();
    });

    it("should return 400 for empty message", async () => {
      const response = await app.request(
        "/api/reconciliation/booking/booking-1",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeader("ADMIN", "admin-1"),
          },
          body: JSON.stringify({ message: "" }),
        },
      );

      expect(response.status).toBe(400);
    });

    it("should accept valid message", async () => {
      reconciliationNoteMock.create.mockResolvedValueOnce({
        id: "note-1",
        message: "Valid note",
        author: { id: "admin-1", name: "Admin", email: "admin@example.com" },
      });

      const response = await app.request(
        "/api/reconciliation/booking/booking-1",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeader("ADMIN", "admin-1"),
          },
          body: JSON.stringify({ message: "Valid note" }),
        },
      );

      expect(response.status).toBe(201);
    });
  });

  describe("Note Creation", () => {
    it("should create note with OPEN status by default", async () => {
      reconciliationNoteMock.create.mockResolvedValueOnce({
        id: "note-1",
        message: "Test",
        status: "OPEN",
      });

      await app.request("/api/reconciliation/booking/booking-123", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader("ADMIN", "admin-1"),
        },
        body: JSON.stringify({ message: "Test" }),
      });

      expect(reconciliationNoteMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            bookingId: "booking-123",
            authorId: "admin-1",
            message: "Test",
            status: "OPEN",
            resolvedById: undefined,
            resolvedAt: undefined,
          }),
        }),
      );
    });

    it("should create note with RESOLVED status when provided", async () => {
      reconciliationNoteMock.create.mockResolvedValueOnce({
        id: "note-1",
        message: "Already resolved",
        status: "RESOLVED",
      });

      await app.request("/api/reconciliation/booking/booking-1", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader("STAFF", "staff-123"),
        },
        body: JSON.stringify({
          message: "Already resolved",
          status: "RESOLVED",
        }),
      });

      expect(reconciliationNoteMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "RESOLVED",
            resolvedById: "staff-123",
            resolvedAt: expect.any(Date),
          }),
        }),
      );
    });

    it("should set authorId from authenticated user", async () => {
      reconciliationNoteMock.create.mockResolvedValueOnce({
        id: "note-1",
        message: "Test",
      });

      await app.request("/api/reconciliation/booking/booking-1", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader("ADMIN", "admin-xyz"),
        },
        body: JSON.stringify({ message: "Test" }),
      });

      expect(reconciliationNoteMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            authorId: "admin-xyz",
          }),
        }),
      );
    });

    it("should return 201 with created note", async () => {
      const mockNote = {
        id: "note-new",
        bookingId: "booking-1",
        message: "New note",
        status: "OPEN",
        author: { id: "admin-1", name: "Admin", email: "admin@example.com" },
      };

      reconciliationNoteMock.create.mockResolvedValueOnce(mockNote);

      const response = await app.request(
        "/api/reconciliation/booking/booking-1",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeader("ADMIN", "admin-1"),
          },
          body: JSON.stringify({ message: "New note" }),
        },
      );

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.id).toBe("note-new");
      expect(data.message).toBe("New note");
    });
  });
});

describe("Reconciliation Extended - PATCH /note/:noteId", () => {
  let app: Hono;

  beforeEach(() => {
    app = buildApp();
    vi.clearAllMocks();
  });

  describe("Authorization", () => {
    it("should return 401 for unauthenticated requests", async () => {
      const response = await app.request("/api/reconciliation/note/note-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "RESOLVED" }),
      });

      expect(response.status).toBe(401);
    });

    it("should return 403 for CLIENT role", async () => {
      const response = await app.request("/api/reconciliation/note/note-1", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeader("CLIENT", "client-1"),
        },
        body: JSON.stringify({ status: "RESOLVED" }),
      });

      expect(response.status).toBe(403);
    });

    it("should allow ADMIN and STAFF", async () => {
      reconciliationNoteMock.update.mockResolvedValueOnce({
        id: "note-1",
        status: "RESOLVED",
      });

      const response = await app.request("/api/reconciliation/note/note-1", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeader("STAFF", "staff-1"),
        },
        body: JSON.stringify({ status: "RESOLVED" }),
      });

      expect(response.status).toBe(200);
    });
  });

  describe("Validation", () => {
    it("should return 400 for invalid payload", async () => {
      const response = await app.request("/api/reconciliation/note/note-1", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeader("ADMIN", "admin-1"),
        },
        body: JSON.stringify({ message: "" }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Invalid reconciliation note payload");
    });

    it("should accept partial updates", async () => {
      reconciliationNoteMock.update.mockResolvedValueOnce({
        id: "note-1",
        message: "Updated message",
      });

      const response = await app.request("/api/reconciliation/note/note-1", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeader("ADMIN", "admin-1"),
        },
        body: JSON.stringify({ message: "Updated message" }),
      });

      expect(response.status).toBe(200);
    });
  });

  describe("Status Updates", () => {
    it("should update status to RESOLVED with current timestamp", async () => {
      reconciliationNoteMock.update.mockResolvedValueOnce({
        id: "note-1",
        status: "RESOLVED",
      });

      await app.request("/api/reconciliation/note/note-1", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeader("STAFF", "staff-456"),
        },
        body: JSON.stringify({ status: "RESOLVED" }),
      });

      expect(reconciliationNoteMock.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "RESOLVED",
            resolvedById: "staff-456",
            resolvedAt: expect.any(Date),
          }),
        }),
      );
    });

    it("should update status to OPEN and clear resolved fields", async () => {
      reconciliationNoteMock.update.mockResolvedValueOnce({
        id: "note-1",
        status: "OPEN",
      });

      await app.request("/api/reconciliation/note/note-1", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeader("ADMIN", "admin-1"),
        },
        body: JSON.stringify({ status: "OPEN" }),
      });

      expect(reconciliationNoteMock.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "OPEN",
            resolvedById: null,
            resolvedAt: null,
          }),
        }),
      );
    });

    it("should use provided resolvedById when resolving", async () => {
      reconciliationNoteMock.update.mockResolvedValueOnce({
        id: "note-1",
        status: "RESOLVED",
        author: { id: "admin-1", name: "Admin", email: "admin@example.com" },
        resolvedBy: {
          id: "custom-user",
          name: "Custom",
          email: "custom@example.com",
        },
      });

      await app.request("/api/reconciliation/note/note-1", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeader("ADMIN", "admin-1"),
        },
        body: JSON.stringify({
          message: "Updated note",
          status: "RESOLVED",
          resolved: { resolvedById: "custom-user" },
        }),
      });

      expect(reconciliationNoteMock.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            resolvedById: "custom-user",
          }),
        }),
      );
    });

    it("should use provided resolvedAt when resolving", async () => {
      const customDate = "2025-01-15T10:00:00Z";

      reconciliationNoteMock.update.mockResolvedValueOnce({
        id: "note-1",
        status: "RESOLVED",
        resolvedAt: new Date(customDate),
        author: { id: "admin-1", name: "Admin", email: "admin@example.com" },
        resolvedBy: {
          id: "admin-1",
          name: "Admin",
          email: "admin@example.com",
        },
      });

      const response = await app.request("/api/reconciliation/note/note-1", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeader("ADMIN", "admin-1"),
        },
        body: JSON.stringify({
          message: "Resolved note",
          status: "RESOLVED",
          resolved: { resolvedById: "admin-1", resolvedAt: customDate },
        }),
      });

      expect(response.status).toBe(200);
      expect(reconciliationNoteMock.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            resolvedAt: new Date(customDate),
          }),
        }),
      );
    });

    it("should update only message without changing status", async () => {
      reconciliationNoteMock.update.mockResolvedValueOnce({
        id: "note-1",
        message: "Updated text",
      });

      await app.request("/api/reconciliation/note/note-1", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeader("ADMIN", "admin-1"),
        },
        body: JSON.stringify({ message: "Updated text" }),
      });

      expect(reconciliationNoteMock.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            message: "Updated text",
            status: undefined,
          }),
        }),
      );
    });
  });

  describe("Response", () => {
    it("should return updated note", async () => {
      const mockNote = {
        id: "note-1",
        message: "Updated",
        status: "RESOLVED",
        author: { id: "admin-1", name: "Admin", email: "admin@example.com" },
        resolvedBy: {
          id: "staff-1",
          name: "Staff",
          email: "staff@example.com",
        },
      };

      reconciliationNoteMock.update.mockResolvedValueOnce(mockNote);

      const response = await app.request("/api/reconciliation/note/note-1", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeader("ADMIN", "admin-1"),
        },
        body: JSON.stringify({ message: "Updated", status: "RESOLVED" }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBe("note-1");
      expect(data.status).toBe("RESOLVED");
    });
  });
});
