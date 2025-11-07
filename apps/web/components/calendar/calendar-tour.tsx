"use client";

import {
  OnboardingTour,
  type TourStep,
} from "@/components/onboarding/onboarding-tour";

const calendarTourSteps: TourStep[] = [
  {
    id: "welcome",
    title: "¡Bienvenido al Calendario!",
    description:
      "Este es tu centro de control para gestionar todas las reservas. Te mostraremos las funciones principales en una guía rápida.",
    position: "center",
  },
  {
    id: "filters",
    title: "Filtrar Reservas",
    description:
      "Usa estos filtros para encontrar reservas específicas por estado, propiedad, servicio o staff asignado. Haz clic en la flecha para expandir las opciones.",
    target: "#calendar-filters",
    position: "bottom",
  },
  {
    id: "view-toggle",
    title: "Cambiar Vista",
    description:
      "Alterna entre vista mensual y semanal para organizar tus reservas de diferentes maneras según tus necesidades.",
    target: '[aria-label="Selector de vista del calendario"]',
    position: "bottom",
  },
  {
    id: "bookings",
    title: "Interactuar con Reservas",
    description:
      "Haz clic en cualquier reserva del calendario para ver sus detalles completos, cancelarla, completarla o reprogramarla.",
    target: '[role="grid"]',
    position: "top",
  },
  {
    id: "drag-drop",
    title: "Reprogramar Rápido",
    description:
      "¡Tip Pro! Arrastra y suelta reservas confirmadas a diferentes días para reprogramarlas instantáneamente. La hora se mantiene automáticamente.",
    target: '[role="grid"]',
    position: "top",
  },
];

export interface CalendarTourProps {
  /**
   * Callback cuando se completa el tour
   */
  onComplete?: () => void;
  /**
   * Si el tour está activo
   */
  isActive?: boolean;
}

/**
 * Tour guiado específico para el calendario
 */
export function CalendarTour({ onComplete, isActive }: CalendarTourProps) {
  if (process.env.NEXT_PUBLIC_PLAYWRIGHT_TEST_RUN === "true") {
    return null;
  }

  return (
    <OnboardingTour
      tourId="calendar-main"
      steps={calendarTourSteps}
      onComplete={onComplete}
      isActive={isActive}
    />
  );
}
