"use client";

import { useState } from "react";
import { type CalendarBooking } from "@/hooks/use-calendar";
import { formatCurrency } from "@/lib/status-helpers";

type BookingDetailsModalProps = {
  booking: CalendarBooking | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (bookingId: string) => void;
  onCancel?: (bookingId: string) => Promise<void>;
  onComplete?: (bookingId: string) => Promise<void>;
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmada",
  IN_PROGRESS: "En curso",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  CONFIRMED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  IN_PROGRESS:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  COMPLETED:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export function BookingDetailsModal({
  booking,
  isOpen,
  onClose,
  onEdit,
  onCancel,
  onComplete,
}: BookingDetailsModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !booking) return null;

  const handleCancel = async () => {
    if (!onCancel || !window.confirm("¿Estás seguro de cancelar esta reserva?"))
      return;

    setIsProcessing(true);
    try {
      await onCancel(booking.id);
      onClose();
    } catch (error) {
      console.error("Error canceling booking:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleComplete = async () => {
    if (!onComplete || !window.confirm("¿Marcar esta reserva como completada?"))
      return;

    setIsProcessing(true);
    try {
      await onComplete(booking.id);
      onClose();
    } catch (error) {
      console.error("Error completing booking:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const canCancel =
    booking.status !== "CANCELLED" && booking.status !== "COMPLETED";
  const canComplete =
    booking.status === "IN_PROGRESS" || booking.status === "CONFIRMED";

  const scheduledDate = new Date(booking.scheduledAt);
  const formattedDate = scheduledDate.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = scheduledDate.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      data-testid="booking-details-modal-overlay"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-lg bg-white shadow-xl dark:bg-brisa-900"
        data-testid="booking-details-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-200 p-6 dark:border-brisa-700">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {booking.code}
            </h2>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                  STATUS_COLORS[booking.status] || STATUS_COLORS.PENDING
                }`}
              >
                {STATUS_LABELS[booking.status] || booking.status}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-brisa-800 dark:hover:text-brisa-300"
            aria-label="Cerrar"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="space-y-6 p-6">
          {/* Date and Time */}
          <div>
            <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-brisa-300">
              Fecha y Hora
            </h3>
            <div className="flex items-center gap-2 text-gray-900 dark:text-white">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="capitalize">{formattedDate}</span>
              <span className="text-gray-400">•</span>
              <span>{formattedTime}</span>
              <span className="text-gray-400">•</span>
              <span>{booking.durationMin} min</span>
            </div>
          </div>

          {/* Service */}
          <div>
            <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-brisa-300">
              Servicio
            </h3>
            <p className="text-gray-900 dark:text-white">
              {booking.service.name}
            </p>
          </div>

          {/* Property */}
          <div>
            <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-brisa-300">
              Propiedad
            </h3>
            <p className="text-gray-900 dark:text-white">
              {booking.property.label}
            </p>
          </div>

          {/* Customer */}
          <div>
            <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-brisa-300">
              Cliente
            </h3>
            <p className="text-gray-900 dark:text-white">
              {booking.customer.fullName || booking.customer.email}
            </p>
          </div>

          {/* Assigned Staff */}
          {booking.assignedStaff && (
            <div>
              <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-brisa-300">
                Personal Asignado
              </h3>
              <p className="text-gray-900 dark:text-white">
                {booking.assignedStaff.fullName || booking.assignedStaff.email}
              </p>
            </div>
          )}

          {/* Total Amount */}
          <div>
            <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-brisa-300">
              Monto Total
            </h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(Number(booking.totalAmount))}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap justify-end gap-3 border-t border-gray-200 p-6 dark:border-brisa-700">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-brisa-700 dark:bg-brisa-900 dark:text-brisa-200 dark:hover:bg-brisa-800"
          >
            Cerrar
          </button>

          {canComplete && onComplete && (
            <button
              onClick={handleComplete}
              disabled={isProcessing}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isProcessing ? "Procesando..." : "Marcar Completada"}
            </button>
          )}

          {canCancel && onCancel && (
            <button
              onClick={handleCancel}
              disabled={isProcessing}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isProcessing ? "Procesando..." : "Cancelar Reserva"}
            </button>
          )}

          {onEdit && (
            <button
              onClick={() => {
                onEdit(booking.id);
                onClose();
              }}
              disabled={isProcessing}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-600"
            >
              Editar Reserva
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
