"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CalendarView } from "./calendar-view";
import { CalendarWeekView } from "./calendar-week-view";
import { CalendarFilters } from "./calendar-filters";
import { BookingDetailsModal } from "./booking-details-modal";
import { CalendarTour } from "./calendar-tour";
import type { CalendarBooking } from "@/hooks/use-calendar";
import { useRouter } from "next/navigation";

type CalendarPageClientProps = {
  properties: Array<{ id: string; label: string }>;
  services: Array<{ id: string; name: string }>;
  staff: Array<{ id: string; fullName: string | null; email: string }>;
};

type ViewMode = "month" | "week";

const VIEW_MODE_STORAGE_KEY = "brisa-calendar-view-mode";
const MOBILE_BREAKPOINT_QUERY = "(max-width: 1023px)";

const getStoredViewMode = () => {
  if (typeof window === "undefined") {
    return null;
  }
  const stored = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
  return stored === "month" || stored === "week" ? stored : null;
};

const getInitialViewMode = (): ViewMode => {
  if (typeof window === "undefined") {
    return "month";
  }
  const stored = getStoredViewMode();
  if (stored) {
    return stored;
  }
  return window.matchMedia(MOBILE_BREAKPOINT_QUERY).matches ? "week" : "month";
};

const waitForNextFrame = () =>
  new Promise<void>((resolve) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }
    window.requestAnimationFrame(() => resolve());
  });

export function CalendarPageClient({
  properties,
  services,
  staff,
}: CalendarPageClientProps) {
  const [selectedBooking, setSelectedBooking] =
    useState<CalendarBooking | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    getInitialViewMode(),
  );
  const [hasUserViewPreference, setHasUserViewPreference] = useState<boolean>(
    () => Boolean(getStoredViewMode()),
  );
  const [filters, setFilters] = useState<{
    status?: string;
    propertyId?: string;
    serviceId?: string;
    assignedStaffId?: string;
  }>({});
  const [calendarRefreshToken, setCalendarRefreshToken] = useState(0);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | "loading";
    message: string;
  } | null>(null);
  const loadingMinVisibleMs = 2000;
  const minimumVisibleWindowMs = 5000;
  const router = useRouter();
  const statusClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  type StatusDebugType = "success" | "error" | "loading" | "idle";

  const updateStatusDebug = (type: StatusDebugType, message: string) => {
    if (
      typeof window === "undefined" ||
      process.env.NEXT_PUBLIC_PLAYWRIGHT_TEST_RUN !== "true"
    ) {
      return;
    }
    const instrumentedWindow = window as typeof window & {
      __BRISA_LAST_STATUS__?: {
        type: StatusDebugType;
        message: string;
        at: number;
      };
    };
    instrumentedWindow.__BRISA_LAST_STATUS__ = {
      type,
      message,
      at: Date.now(),
    };
  };
  const scheduleStatusClear = () => {
    if (statusClearRef.current) {
      clearTimeout(statusClearRef.current);
    }
    statusClearRef.current = setTimeout(() => {
      setStatusMessage(null);
      statusClearRef.current = null;
    }, minimumVisibleWindowMs);
  };

  const setViewModeWithSource = useCallback(
    (mode: ViewMode, source: "user" | "auto" = "user") => {
      setViewMode((current) => {
        if (current === mode) {
          return current;
        }
        return mode;
      });
      if (source === "user" && typeof window !== "undefined") {
        window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
        setHasUserViewPreference(true);
      }
    },
    [],
  );

  useEffect(() => {
    if (typeof window === "undefined" || hasUserViewPreference) {
      return;
    }
    const mediaQuery = window.matchMedia(MOBILE_BREAKPOINT_QUERY);

    const applyPreferredMode = (matches: boolean) => {
      setViewModeWithSource(matches ? "week" : "month", "auto");
    };

    applyPreferredMode(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      applyPreferredMode(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [hasUserViewPreference, setViewModeWithSource]);

  useEffect(() => {
    return () => {
      if (statusClearRef.current) {
        clearTimeout(statusClearRef.current);
      }
    };
  }, []);

  const ensureLoadingWindow = async (startedAt: number) => {
    const elapsed = performance.now() - startedAt;
    if (elapsed < loadingMinVisibleMs) {
      await new Promise((resolve) =>
        setTimeout(resolve, loadingMinVisibleMs - elapsed),
      );
    }
  };

  const handleBookingClick = (booking: CalendarBooking) => {
    if (
      typeof window !== "undefined" &&
      process.env.NEXT_PUBLIC_PLAYWRIGHT_TEST_RUN === "true"
    ) {
      const instrumentedWindow = window as typeof window & {
        __BRISA_LAST_BOOKING_CLICK?: string;
      };
      instrumentedWindow.__BRISA_LAST_BOOKING_CLICK = booking.id;
    }
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  const handleEditBooking = (_bookingId: string) => {
    // Navigate to main panel where bookings can be managed
    router.push("/panel");
  };

  const handleBookingReschedule = async (
    bookingId: string,
    newDateKey: string,
    originalScheduledAt: string,
  ) => {
    const loadingStartedAt = performance.now();
    if (statusClearRef.current) {
      clearTimeout(statusClearRef.current);
      statusClearRef.current = null;
    }
    setStatusMessage({
      type: "loading",
      message: "Reprogramando reserva...",
    });
    updateStatusDebug("loading", "Reprogramando reserva...");
    await waitForNextFrame();

    try {
      const originalDate = new Date(originalScheduledAt);
      const newDate = new Date(newDateKey);

      // Keep the same time, just change the date
      newDate.setHours(originalDate.getHours());
      newDate.setMinutes(originalDate.getMinutes());
      newDate.setSeconds(originalDate.getSeconds());

      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          scheduledAt: newDate.toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al reprogramar la reserva");
      }

      await ensureLoadingWindow(loadingStartedAt);
      setStatusMessage({
        type: "success",
        message: "Reserva reprogramada exitosamente",
      });
      updateStatusDebug("success", "Reserva reprogramada exitosamente");

      scheduleStatusClear();

      // Refresh the page to show updated data
      router.refresh();
      setCalendarRefreshToken((token) => token + 1);
    } catch (error) {
      console.error("Error rescheduling booking:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error al reprogramar la reserva";
      await ensureLoadingWindow(loadingStartedAt);
      setStatusMessage({
        type: "error",
        message: errorMessage,
      });
      updateStatusDebug("error", errorMessage);
      scheduleStatusClear();
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    const response = await fetch(`/api/bookings/${bookingId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        status: "CANCELLED",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Error al cancelar la reserva");
    }

    // Refresh the page to show updated data
    router.refresh();
    setCalendarRefreshToken((token) => token + 1);
  };

  const handleCompleteBooking = async (bookingId: string) => {
    const response = await fetch(`/api/bookings/${bookingId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        status: "COMPLETED",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Error al completar la reserva");
    }

    // Refresh the page to show updated data
    router.refresh();
    setCalendarRefreshToken((token) => token + 1);
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (process.env.NEXT_PUBLIC_PLAYWRIGHT_TEST_RUN !== "true") {
      return;
    }
    const instrumentedWindow = window as typeof window & {
      __BRISA_TEST_RESCHEDULE__?: typeof handleBookingReschedule;
    };
    instrumentedWindow.__BRISA_TEST_RESCHEDULE__ = handleBookingReschedule;
    return () => {
      delete instrumentedWindow.__BRISA_TEST_RESCHEDULE__;
    };
  }, [handleBookingReschedule]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Filters */}
      <CalendarFilters
        onFiltersChange={setFilters}
        properties={properties}
        services={services}
        staff={staff}
      />

      {/* View Mode Toggle */}
      <div className="flex justify-center sm:justify-end">
        <div
          className="inline-flex w-full sm:w-auto rounded-lg border border-gray-300 bg-white p-1 dark:border-brisa-700 dark:bg-brisa-900"
          aria-label="Selector de vista del calendario"
        >
          <button
            onClick={() => setViewModeWithSource("month")}
            aria-label="Vista mensual"
            aria-pressed={viewMode === "month" ? "true" : "false"}
            className={`flex flex-1 sm:flex-initial items-center justify-center gap-1.5 sm:gap-2 rounded-md px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-all duration-200 ${
              viewMode === "month"
                ? "bg-blue-600 text-white shadow-sm dark:bg-blue-500"
                : "text-gray-700 hover:bg-gray-100 dark:text-brisa-200 dark:hover:bg-brisa-800"
            }`}
          >
            <svg
              className="h-3.5 w-3.5 sm:h-4 sm:w-4"
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
            <span>Mes</span>
          </button>
          <button
            onClick={() => setViewModeWithSource("week")}
            aria-label="Vista semanal"
            aria-pressed={viewMode === "week" ? "true" : "false"}
            className={`flex flex-1 sm:flex-initial items-center justify-center gap-1.5 sm:gap-2 rounded-md px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-all duration-200 ${
              viewMode === "week"
                ? "bg-blue-600 text-white shadow-sm dark:bg-blue-500"
                : "text-gray-700 hover:bg-gray-100 dark:text-brisa-200 dark:hover:bg-brisa-800"
            }`}
          >
            <svg
              className="h-3.5 w-3.5 sm:h-4 sm:w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
            <span>Semana</span>
          </button>
        </div>
      </div>

      {/* Status Message */}
      {statusMessage && (
        <div
          data-testid="calendar-status-alert"
          role="alert"
          aria-live="polite"
          className={`mb-3 sm:mb-4 rounded-lg p-2.5 sm:p-3 text-xs sm:text-sm animate-slide-down ${
            statusMessage.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200 dark:bg-green-950 dark:text-green-200 dark:border-green-800"
              : statusMessage.type === "error"
                ? "bg-red-50 text-red-800 border border-red-200 dark:bg-red-950 dark:text-red-200 dark:border-red-800"
                : "bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800"
          }`}
        >
          <div className="flex items-center gap-1.5 sm:gap-2">
            {statusMessage.type === "loading" && (
              <svg
                className="h-4 w-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            {statusMessage.type === "success" && (
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
            {statusMessage.type === "error" && (
              <svg
                className="h-4 w-4"
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
            )}
            <span data-testid="calendar-status-message">
              {statusMessage.message}
            </span>
          </div>
        </div>
      )}

      {/* Calendar Views */}
      {viewMode === "month" ? (
        <CalendarView
          onBookingClick={handleBookingClick}
          onBookingReschedule={handleBookingReschedule}
          filters={filters}
          refreshToken={calendarRefreshToken}
        />
      ) : (
        <CalendarWeekView
          onBookingClick={handleBookingClick}
          onBookingReschedule={handleBookingReschedule}
          onViewModePersist={() => setViewModeWithSource("week", "user")}
          filters={filters}
          refreshToken={calendarRefreshToken}
        />
      )}

      <BookingDetailsModal
        booking={selectedBooking}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onEdit={handleEditBooking}
        onCancel={handleCancelBooking}
        onComplete={handleCompleteBooking}
      />

      {/* Onboarding Tour - Se muestra automáticamente para usuarios nuevos */}
      <CalendarTour />
    </div>
  );
}
