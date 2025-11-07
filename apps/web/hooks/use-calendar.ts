import { useState, useEffect, useCallback } from "react";

export type CalendarBooking = {
  id: string;
  code: string;
  scheduledAt: string;
  durationMin: number;
  status: string;
  service: {
    id: string;
    name: string;
  };
  property: {
    id: string;
    label: string;
  };
  customer: {
    id: string;
    fullName: string | null;
    email: string;
  };
  assignedStaff?: {
    id: string;
    fullName: string | null;
    email: string;
  } | null;
  totalAmount: number;
};

export type CalendarData = {
  bookingsByDate: Record<string, CalendarBooking[]>;
  dateRange: string[];
  summary: {
    totalBookings: number;
    statusCounts: Record<string, number>;
    totalRevenue: string;
  };
};

type UseCalendarOptions = {
  from: Date;
  to: Date;
  status?: string;
  propertyId?: string;
  serviceId?: string;
  assignedStaffId?: string;
};

export function useCalendar(options: UseCalendarOptions) {
  const [data, setData] = useState<CalendarData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCalendar = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        from: options.from.toISOString(),
        to: options.to.toISOString(),
      });

      if (options.status) {
        params.append("status", options.status);
      }
      if (options.propertyId) {
        params.append("propertyId", options.propertyId);
      }
      if (options.serviceId) {
        params.append("serviceId", options.serviceId);
      }
      if (options.assignedStaffId) {
        params.append("assignedStaffId", options.assignedStaffId);
      }

      const response = await fetch(`/api/calendar?${params.toString()}`, {
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch calendar data");
      }

      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      console.error("Error fetching calendar:", err);
    } finally {
      setIsLoading(false);
    }
  }, [
    options.from,
    options.to,
    options.status,
    options.propertyId,
    options.serviceId,
    options.assignedStaffId,
  ]);

  useEffect(() => {
    void fetchCalendar();
  }, [fetchCalendar]);

  return {
    data,
    isLoading,
    error,
    refresh: fetchCalendar,
  };
}

/**
 * Hook to get available time slots for a specific date and property
 */
export function useAvailability(
  date: Date | null,
  propertyId: string | null,
  durationMin: number = 60,
) {
  const [timeSlots, setTimeSlots] = useState<
    Array<{ time: string; available: boolean; bookingId?: string }>
  >([]);
  const [bookings, setBookings] = useState<CalendarBooking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!date || !propertyId) {
      setTimeSlots([]);
      setBookings([]);
      return;
    }

    const fetchAvailability = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          date: date.toISOString(),
          propertyId,
          durationMin: durationMin.toString(),
        });

        const response = await fetch(
          `/api/calendar/availability?${params.toString()}`,
          {
            credentials: "include",
          },
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch availability");
        }

        const result = await response.json();
        setTimeSlots(result.data.timeSlots);
        setBookings(result.data.bookings);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        console.error("Error fetching availability:", err);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchAvailability();
  }, [date, propertyId, durationMin]);

  return {
    timeSlots,
    bookings,
    isLoading,
    error,
  };
}
