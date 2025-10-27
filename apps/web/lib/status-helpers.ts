/**
 * Utilidades para mapear estados de la aplicación a variantes de componentes UI
 */

import type { BadgeProps } from "@/components/ui/badge";

export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export type UserStatus = "ACTIVE" | "INACTIVE";

export type ServiceStatus = "ACTIVE" | "INACTIVE";

/**
 * Mapea un estado de reserva a una variante de Badge
 */
export function getBookingStatusBadgeVariant(
  status: BookingStatus,
): BadgeProps["variant"] {
  const variantMap: Record<BookingStatus, BadgeProps["variant"]> = {
    PENDING: "warning",
    CONFIRMED: "info",
    IN_PROGRESS: "secondary",
    COMPLETED: "success",
    CANCELLED: "error",
  };
  return variantMap[status];
}

/**
 * Mapea un estado de reserva a una etiqueta legible en español
 */
export function getBookingStatusLabel(status: BookingStatus): string {
  const labelMap: Record<BookingStatus, string> = {
    PENDING: "Pendiente",
    CONFIRMED: "Confirmada",
    IN_PROGRESS: "En curso",
    COMPLETED: "Completada",
    CANCELLED: "Cancelada",
  };
  return labelMap[status];
}

/**
 * Mapea un estado de usuario a una variante de Badge
 */
export function getUserStatusBadgeVariant(
  isActive: boolean,
): BadgeProps["variant"] {
  return isActive ? "success" : "error";
}

/**
 * Mapea un estado de servicio a una variante de Badge
 */
export function getServiceStatusBadgeVariant(
  isActive: boolean,
): BadgeProps["variant"] {
  return isActive ? "success" : "secondary";
}

/**
 * Formatea un número como moneda USD
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formatea una fecha ISO a formato legible
 */
export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("es-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Formatea una fecha y hora ISO a formato legible
 */
export function formatDateTime(isoDate: string): string {
  return new Date(isoDate).toLocaleString("es-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
