"use client";

import type { Booking } from "./api";

type PortalActionResult = {
  data: Booking;
  error?: string;
};

async function parseActionResponse(
  response: Response,
): Promise<PortalActionResult> {
  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return (await response.json()) as PortalActionResult;
  }

  return { data: undefined as unknown as Booking };
}

export async function cancelPortalBooking(options: {
  bookingId: string;
  reason?: string;
}): Promise<Booking> {
  const response = await fetch(
    `/api/portal/bookings/${options.bookingId}/cancel`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ reason: options.reason }),
    },
  );

  const payload = await parseActionResponse(response);
  if (!response.ok || !payload.data) {
    throw new Error(payload.error ?? "No pudimos cancelar la reserva.");
  }

  return payload.data;
}

export async function reschedulePortalBooking(options: {
  bookingId: string;
  scheduledAt: string;
  notes?: string;
}): Promise<Booking> {
  const response = await fetch(
    `/api/portal/bookings/${options.bookingId}/reschedule`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        scheduledAt: options.scheduledAt,
        notes: options.notes,
      }),
    },
  );

  const payload = await parseActionResponse(response);
  if (!response.ok || !payload.data) {
    throw new Error(payload.error ?? "No pudimos reagendar la reserva.");
  }

  return payload.data;
}
