"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/server/auth/config";
import { ApiError } from "@/server/api/client";
import {
  createReconciliationNote,
  resolveReconciliationNote,
} from "@/server/api/reconciliation";
import { isFakeDataEnabled } from "@/server/utils/fake";
import { env } from "@/config/env";
import { logger } from "@/server/logger";

const createBookingSchema = z.object({
  propertyId: z.string().min(1, "Selecciona una propiedad"),
  serviceId: z.string().min(1, "Selecciona un servicio"),
  scheduledAt: z.string().min(1, "Selecciona una fecha y hora"),
  notes: z.string().max(500).optional(),
});

export interface CreateBookingState {
  ok: boolean;
  error?: string;
  checkoutUrl?: string | null;
}

interface BookingApiResponse {
  booking: {
    id: string;
  };
  checkoutUrl?: string | null;
}

export interface UpdateBookingState {
  ok: boolean;
  error?: string;
}

export interface CreateReconciliationNoteState {
  ok: boolean;
  error?: string;
}

export interface ResolveReconciliationNoteState {
  ok: boolean;
  error?: string;
}

async function postBooking(body: unknown, userId: string) {
  if (isFakeDataEnabled()) {
    return {
      booking: {
        id: `fake-booking-${Date.now()}`,
      },
      checkoutUrl: null,
    } satisfies BookingApiResponse;
  }

  const response = await fetch(`${env.apiUrl}/api/bookings`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      ...(body as Record<string, unknown>),
      userId,
    }),
  });

  if (!response.ok) {
    const message = await response
      .json()
      .catch(() => ({ error: response.statusText }));
    throw new ApiError(
      typeof message?.error === "string"
        ? message.error
        : "No se pudo crear la reserva",
      response.status,
    );
  }

  return (await response.json()) as BookingApiResponse;
}

export async function createBooking(
  _prevState: CreateBookingState,
  formData: FormData,
): Promise<CreateBookingState> {
  const session = await auth();

  if (!session?.user?.id) {
    return { ok: false, error: "Sesión inválida. Inicia sesión nuevamente." };
  }

  if (isFakeDataEnabled()) {
    revalidatePath("/dashboard");
    return { ok: true, checkoutUrl: null };
  }

  const raw = {
    propertyId: formData.get("propertyId"),
    serviceId: formData.get("serviceId"),
    scheduledAt: formData.get("scheduledAt")
      ? new Date(String(formData.get("scheduledAt"))).toISOString()
      : undefined,
    notes: formData.get("notes") ? String(formData.get("notes")) : undefined,
  };

  const parsed = createBookingSchema.safeParse(raw);

  if (!parsed.success) {
    const firstError =
      parsed.error.issues.at(0)?.message ?? "Revisa los datos ingresados.";
    return { ok: false, error: firstError };
  }

  try {
    const result = await postBooking(parsed.data, session.user.id);
    logger.info(
      {
        userId: session.user.id,
        serviceId: parsed.data.serviceId,
        propertyId: parsed.data.propertyId,
        scheduledAt: parsed.data.scheduledAt,
      },
      "Booking created via dashboard action",
    );
    revalidatePath("/dashboard");
    return { ok: true, checkoutUrl: result.checkoutUrl ?? null };
  } catch (error) {
    if (error instanceof ApiError) {
      return { ok: false, error: error.message };
    }
    logger.error(
      { error: error instanceof Error ? error.message : "unknown" },
      "Error creating booking from dashboard action",
    );
    return {
      ok: false,
      error: "No se pudo crear la reserva. Intenta nuevamente.",
    };
  }
}

export async function updateBookingStatus(
  _prevState: UpdateBookingState,
  formData: FormData,
): Promise<UpdateBookingState> {
  const session = await auth();

  if (!session?.user?.id) {
    return { ok: false, error: "Sesión inválida. Inicia sesión nuevamente." };
  }

  const bookingId = formData.get("bookingId");
  const status = formData.get("status");

  if (!bookingId || !status) {
    return { ok: false, error: "Selecciona un estado válido." };
  }

  if (isFakeDataEnabled()) {
    revalidatePath("/dashboard");
    return { ok: true };
  }

  try {
    const response = await fetch(`${env.apiUrl}/api/bookings/${bookingId}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const message = await response
        .json()
        .catch(() => ({ error: response.statusText }));
      const errorMessage =
        typeof message?.error === "string"
          ? message.error
          : "No se pudo actualizar la reserva.";
      throw new ApiError(errorMessage, response.status);
    }

    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    if (error instanceof ApiError) {
      return { ok: false, error: error.message };
    }
    logger.error(
      { error: error instanceof Error ? error.message : "unknown" },
      "Error updating booking status from dashboard action",
    );
    return {
      ok: false,
      error: "No se pudo actualizar la reserva. Intenta nuevamente.",
    };
  }
}

export async function createReconciliationNoteAction(
  _prevState: CreateReconciliationNoteState,
  formData: FormData,
): Promise<CreateReconciliationNoteState> {
  const session = await auth();

  if (!session?.user?.id) {
    return { ok: false, error: "Sesión inválida. Inicia sesión nuevamente." };
  }

  if (isFakeDataEnabled()) {
    revalidatePath("/dashboard");
    return { ok: true };
  }

  const bookingId = formData.get("bookingId");
  const message = formData.get("message");

  if (
    !bookingId ||
    typeof bookingId !== "string" ||
    !message ||
    typeof message !== "string"
  ) {
    return {
      ok: false,
      error: "Los campos bookingId y message son obligatorios.",
    };
  }

  if (message.trim().length < 2) {
    return { ok: false, error: "La nota debe tener al menos 2 caracteres." };
  }

  try {
    await createReconciliationNote(bookingId, message.trim());
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    if (error instanceof ApiError) {
      return { ok: false, error: error.message };
    }
    logger.error(
      { error: error instanceof Error ? error.message : "unknown" },
      "Error creating reconciliation note",
    );
    return {
      ok: false,
      error: "No se pudo guardar la nota. Intenta nuevamente.",
    };
  }
}

export async function resolveReconciliationNoteAction(
  _prevState: ResolveReconciliationNoteState,
  formData: FormData,
): Promise<ResolveReconciliationNoteState> {
  const session = await auth();

  if (!session?.user?.id) {
    return { ok: false, error: "Sesión inválida. Inicia sesión nuevamente." };
  }

  const noteId = formData.get("noteId");
  if (!noteId || typeof noteId !== "string") {
    return { ok: false, error: "Identificador de nota inválido." };
  }

  if (isFakeDataEnabled()) {
    revalidatePath("/dashboard");
    return { ok: true };
  }

  try {
    await resolveReconciliationNote(noteId);
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    if (error instanceof ApiError) {
      return { ok: false, error: error.message };
    }
    logger.error(
      { error: error instanceof Error ? error.message : "unknown" },
      "Error resolving reconciliation note",
    );
    return { ok: false, error: "No se pudo actualizar la nota." };
  }
}
