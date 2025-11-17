import type { BookingStatus } from "@prisma/client";
import type { BookingWithRelations } from "../repositories/booking-repository.js";

export type AiSummaryResult = {
  summary: string;
  model: string;
  tokens: number;
};

export class AiSummaryService {
  private readonly formatter = new Intl.DateTimeFormat("es-US", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "UTC",
  });

  generateSummary(booking: BookingWithRelations): AiSummaryResult {
    const property = booking.property?.label ?? "la propiedad";
    const serviceName = booking.service?.name ?? "servicio programado";
    const customer =
      booking.customer?.fullName ?? booking.customer?.email ?? "";
    const staff = booking.assignedStaff
      ? (booking.assignedStaff.fullName ??
        booking.assignedStaff.email ??
        "staff")
      : "nuestro equipo";
    const dateLabel = this.formatter.format(booking.scheduledAt);
    const statusLabel = this.translateStatus(booking.status);
    const noteSnippet = booking.notes
      ? `Notas del equipo: ${booking.notes.trim().slice(0, 180)}.`
      : "Sin incidencias reportadas por el equipo.";
    const propertyCity = booking.property?.city ?? "la ciudad";

    const summary = [
      `Servicio ${serviceName} (${statusLabel}) completado en ${property} (${propertyCity}) el ${dateLabel}.`,
      `Cliente: ${customer || booking.customerId}. Equipo asignado: ${staff}.`,
      noteSnippet,
      "Recomendaciones: mantener checklist hotelero y confirmar reposiciones críticas en el próximo turno.",
    ].join(" ");

    return {
      summary,
      model: "brisa-template-v1",
      tokens: this.estimateTokens(summary),
    };
  }

  private estimateTokens(text: string) {
    const words = text.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words * 1.3));
  }

  private translateStatus(status: BookingStatus) {
    switch (status) {
      case "CONFIRMED":
        return "confirmado";
      case "IN_PROGRESS":
        return "en progreso";
      case "COMPLETED":
        return "completado";
      case "CANCELLED":
        return "cancelado";
      case "PENDING":
      default:
        return "pendiente";
    }
  }
}
