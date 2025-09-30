import { describe, expect, it } from "vitest";
import { createBookingSchema, updateBookingSchema } from "./schemas";

describe("Booking Schema Validations", () => {
  describe("createBookingSchema", () => {
    const baseBookingData = {
      userId: "test-user-id",
      propertyId: "test-property-id",
      serviceId: "test-service-id",
    };

    describe("scheduledAt validations", () => {
      it("should reject booking scheduled in the past", () => {
        const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
        const result = createBookingSchema.safeParse({
          ...baseBookingData,
          scheduledAt: pastDate.toISOString(),
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain("scheduledAt");
          expect(result.error.issues[0].message).toContain(
            "2 hours in advance",
          );
        }
      });

      it("should reject booking scheduled less than 2 hours in advance", () => {
        const tooSoon = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
        const result = createBookingSchema.safeParse({
          ...baseBookingData,
          scheduledAt: tooSoon.toISOString(),
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain("scheduledAt");
          expect(result.error.issues[0].message).toContain(
            "2 hours in advance",
          );
        }
      });

      it("should reject booking scheduled more than 90 days in advance", () => {
        const tooFar = new Date(Date.now() + 91 * 24 * 60 * 60 * 1000); // 91 days
        const result = createBookingSchema.safeParse({
          ...baseBookingData,
          scheduledAt: tooFar.toISOString(),
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain("scheduledAt");
          expect(result.error.issues[0].message).toContain("90 days");
        }
      });

      it("should accept booking scheduled 2+ hours in advance", () => {
        const validTime = new Date(Date.now() + 3 * 60 * 60 * 1000); // 3 hours
        const result = createBookingSchema.safeParse({
          ...baseBookingData,
          scheduledAt: validTime.toISOString(),
        });

        expect(result.success).toBe(true);
      });

      it("should accept booking scheduled at 2 hours exactly", () => {
        const exactTime = new Date(Date.now() + 2 * 60 * 60 * 1000 + 60000); // 2 hours + 1 min
        const result = createBookingSchema.safeParse({
          ...baseBookingData,
          scheduledAt: exactTime.toISOString(),
        });

        expect(result.success).toBe(true);
      });

      it("should accept booking scheduled 89 days in advance", () => {
        const validFarDate = new Date(Date.now() + 89 * 24 * 60 * 60 * 1000);
        const result = createBookingSchema.safeParse({
          ...baseBookingData,
          scheduledAt: validFarDate.toISOString(),
        });

        expect(result.success).toBe(true);
      });
    });

    describe("totalPrice validations", () => {
      const validTime = new Date(Date.now() + 3 * 60 * 60 * 1000);

      it("should reject totalPrice less than $50", () => {
        const result = createBookingSchema.safeParse({
          ...baseBookingData,
          scheduledAt: validTime.toISOString(),
          totalPrice: 49.99,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain("totalPrice");
          expect(result.error.issues[0].message).toContain("$50");
        }
      });

      it("should accept totalPrice of exactly $50", () => {
        const result = createBookingSchema.safeParse({
          ...baseBookingData,
          scheduledAt: validTime.toISOString(),
          totalPrice: 50.0,
        });

        expect(result.success).toBe(true);
      });

      it("should accept totalPrice greater than $50", () => {
        const result = createBookingSchema.safeParse({
          ...baseBookingData,
          scheduledAt: validTime.toISOString(),
          totalPrice: 150.99,
        });

        expect(result.success).toBe(true);
      });

      it("should accept missing totalPrice (optional field)", () => {
        const result = createBookingSchema.safeParse({
          ...baseBookingData,
          scheduledAt: validTime.toISOString(),
        });

        expect(result.success).toBe(true);
      });

      it("should accept totalPrice of 0 (will use service basePrice)", () => {
        const result = createBookingSchema.safeParse({
          ...baseBookingData,
          scheduledAt: validTime.toISOString(),
          totalPrice: 0,
        });

        expect(result.success).toBe(true);
      });

      it("should reject negative totalPrice", () => {
        const result = createBookingSchema.safeParse({
          ...baseBookingData,
          scheduledAt: validTime.toISOString(),
          totalPrice: -10,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain("negative");
        }
      });
    });

    describe("notes validation", () => {
      const validTime = new Date(Date.now() + 3 * 60 * 60 * 1000);

      it("should accept booking with notes", () => {
        const result = createBookingSchema.safeParse({
          ...baseBookingData,
          scheduledAt: validTime.toISOString(),
          notes: "Please use eco-friendly products",
        });

        expect(result.success).toBe(true);
      });

      it("should accept booking without notes", () => {
        const result = createBookingSchema.safeParse({
          ...baseBookingData,
          scheduledAt: validTime.toISOString(),
        });

        expect(result.success).toBe(true);
      });

      it("should trim notes whitespace", () => {
        const result = createBookingSchema.safeParse({
          ...baseBookingData,
          scheduledAt: validTime.toISOString(),
          notes: "  Some notes  ",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.notes).toBe("Some notes");
        }
      });

      it("should reject notes longer than 1024 characters", () => {
        const longNotes = "a".repeat(1025);
        const result = createBookingSchema.safeParse({
          ...baseBookingData,
          scheduledAt: validTime.toISOString(),
          notes: longNotes,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain("1024");
        }
      });
    });

    describe("required fields validation", () => {
      const validTime = new Date(Date.now() + 3 * 60 * 60 * 1000);

      it("should reject missing userId", () => {
        const result = createBookingSchema.safeParse({
          propertyId: "test-property-id",
          serviceId: "test-service-id",
          scheduledAt: validTime.toISOString(),
        });

        expect(result.success).toBe(false);
      });

      it("should reject missing propertyId", () => {
        const result = createBookingSchema.safeParse({
          userId: "test-user-id",
          serviceId: "test-service-id",
          scheduledAt: validTime.toISOString(),
        });

        expect(result.success).toBe(false);
      });

      it("should reject missing serviceId", () => {
        const result = createBookingSchema.safeParse({
          userId: "test-user-id",
          propertyId: "test-property-id",
          scheduledAt: validTime.toISOString(),
        });

        expect(result.success).toBe(false);
      });

      it("should reject missing scheduledAt", () => {
        const result = createBookingSchema.safeParse({
          userId: "test-user-id",
          propertyId: "test-property-id",
          serviceId: "test-service-id",
        });

        expect(result.success).toBe(false);
      });
    });
  });

  describe("updateBookingSchema", () => {
    it("should accept valid status update", () => {
      const result = updateBookingSchema.safeParse({
        status: "CONFIRMED",
      });

      expect(result.success).toBe(true);
    });

    it("should accept valid notes update", () => {
      const result = updateBookingSchema.safeParse({
        notes: "Updated notes",
      });

      expect(result.success).toBe(true);
    });

    it("should accept both status and notes", () => {
      const result = updateBookingSchema.safeParse({
        status: "IN_PROGRESS",
        notes: "Service started",
      });

      expect(result.success).toBe(true);
    });

    it("should reject empty update (no fields)", () => {
      const result = updateBookingSchema.safeParse({});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("at least one field");
      }
    });

    it("should reject invalid status", () => {
      const result = updateBookingSchema.safeParse({
        status: "INVALID_STATUS",
      });

      expect(result.success).toBe(false);
    });

    it("should accept all valid status values", () => {
      const validStatuses = [
        "PENDING",
        "CONFIRMED",
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELLED",
      ];

      validStatuses.forEach((status) => {
        const result = updateBookingSchema.safeParse({ status });
        expect(result.success).toBe(true);
      });
    });
  });
});
