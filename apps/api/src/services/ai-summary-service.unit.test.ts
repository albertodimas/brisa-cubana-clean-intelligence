import { describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";
import type { BookingWithRelations } from "../repositories/booking-repository.js";
import { AiSummaryService } from "./ai-summary-service.js";

const baseBooking: BookingWithRelations = {
  id: "booking_1",
  code: "BR-001",
  scheduledAt: new Date("2025-01-15T10:00:00Z"),
  durationMin: 90,
  status: "COMPLETED",
  totalAmount: new Prisma.Decimal(250),
  customerId: "customer_1",
  propertyId: "property_1",
  serviceId: "service_1",
  assignedStaffId: "staff_1",
  tenantId: "tenant_1",
  notes: "Reemplazar amenities y dejar reporte con fotos clave.",
  createdAt: new Date("2025-01-01T00:00:00Z"),
  updatedAt: new Date("2025-01-02T00:00:00Z"),
  deletedAt: null,
  service: {
    id: "service_1",
    tenantId: "tenant_1",
    name: "Turnover Premium",
    description: null,
    basePrice: new Prisma.Decimal(250),
    durationMin: 90,
    active: true,
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-02T00:00:00Z"),
    deletedAt: null,
  },
  property: {
    id: "property_1",
    label: "Villa Aurora",
    addressLine: "123 Brickell Ave",
    city: "Miami",
    state: "FL",
    zipCode: "33131",
    type: "VACATION_RENTAL",
    ownerId: "customer_1",
    tenantId: "tenant_1",
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-02T00:00:00Z"),
    deletedAt: null,
    notes: null,
    sqft: null,
    bedrooms: null,
    bathrooms: null,
  },
  customer: {
    id: "customer_1",
    email: "client@test.com",
    fullName: "Cliente Demo",
    role: "CLIENT",
    isActive: true,
    passwordHash: "test",
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-02T00:00:00Z"),
    deletedAt: null,
  } as any,
  assignedStaff: {
    id: "staff_1",
    email: "staff@test.com",
    fullName: "Supervisora Laura",
    role: "STAFF",
    isActive: true,
  },
};

describe("AiSummaryService", () => {
  const service = new AiSummaryService();

  it("creates a contextualized summary with metadata", () => {
    const result = service.generateSummary(baseBooking);

    expect(result.model).toBe("brisa-template-v1");
    expect(result.summary).toContain("Servicio Turnover Premium (completado)");
    expect(result.summary).toContain("Villa Aurora (Miami)");
    expect(result.summary).toContain("15 de enero de 2025");
    expect(result.summary).toContain("Cliente: Cliente Demo");
    expect(result.summary).toContain("Notas del equipo: Reemplazar amenities");
    expect(result.tokens).toBeGreaterThan(10);
  });

  it("falls back to identifiers when optional relations are missing", () => {
    const minimalBooking: BookingWithRelations = {
      ...baseBooking,
      service: null,
      property: null,
      customer: null,
      assignedStaff: null,
      notes: null,
    };

    const result = service.generateSummary(minimalBooking);

    expect(result.summary).toContain("servicio programado");
    expect(result.summary).toContain("la propiedad (la ciudad)");
    expect(result.summary).toContain("Cliente: customer_1");
    expect(result.summary).toContain("Sin incidencias reportadas");
  });
});
