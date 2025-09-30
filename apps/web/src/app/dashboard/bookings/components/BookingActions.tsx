"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@brisa/ui";
import { CheckCircle, XCircle, PlayCircle } from "lucide-react";
import type { BookingStatus } from "@/types/api";

interface BookingActionsProps {
  bookingId: string;
  currentStatus: BookingStatus;
  accessToken: string;
}

const statusTransitions: Record<
  BookingStatus,
  { label: string; value: BookingStatus; icon: typeof CheckCircle }[]
> = {
  PENDING: [
    { label: "Confirmar", value: "CONFIRMED", icon: CheckCircle },
    { label: "Cancelar", value: "CANCELLED", icon: XCircle },
  ],
  CONFIRMED: [
    { label: "Iniciar Servicio", value: "IN_PROGRESS", icon: PlayCircle },
    { label: "Cancelar", value: "CANCELLED", icon: XCircle },
  ],
  IN_PROGRESS: [
    { label: "Marcar como Completada", value: "COMPLETED", icon: CheckCircle },
  ],
  COMPLETED: [],
  CANCELLED: [],
};

export default function BookingActions({
  bookingId,
  currentStatus,
  accessToken,
}: BookingActionsProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableTransitions = statusTransitions[currentStatus] ?? [];

  const handleStatusChange = async (newStatus: BookingStatus) => {
    setIsUpdating(true);
    setError(null);

    try {
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

      const payload: { status: BookingStatus; completedAt?: string } = {
        status: newStatus,
      };

      // If completing, set completedAt
      if (newStatus === "COMPLETED") {
        payload.completedAt = new Date().toISOString();
      }

      const response = await fetch(
        `${API_BASE_URL}/api/bookings/${bookingId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error?.message ?? "Error al actualizar estado",
        );
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsUpdating(false);
    }
  };

  if (availableTransitions.length === 0) {
    return (
      <Card>
        <p className="text-neutral-400">
          No hay acciones disponibles para esta reserva en su estado actual.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/50 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {availableTransitions.map((transition) => {
          const Icon = transition.icon;
          return (
            <Button
              key={transition.value}
              intent={transition.value === "CANCELLED" ? "ghost" : "primary"}
              onClick={() => handleStatusChange(transition.value)}
              disabled={isUpdating}
            >
              <Icon className="h-4 w-4" />
              {isUpdating ? "Actualizando..." : transition.label}
            </Button>
          );
        })}
      </div>

      <div className="mt-4 text-xs text-neutral-500">
        <p>Estado actual: {currentStatus}</p>
        <p className="mt-1">
          Los cambios de estado enviarán notificaciones al cliente.
        </p>
      </div>
    </Card>
  );
}
