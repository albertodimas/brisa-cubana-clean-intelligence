import "server-only";

import { ApiError } from "./client";

const API_BASE_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3001";

export interface ReconciliationNote {
  id: string;
  message: string;
  createdAt: string;
  status: "OPEN" | "RESOLVED";
  resolvedAt?: string | null;
  author: {
    id: string;
    name: string | null;
    email: string;
  };
  resolvedBy?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

export async function getReconciliationNotes(
  bookingId: string,
  accessToken: string,
): Promise<ReconciliationNote[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/reconciliation/booking/${bookingId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new ApiError(
      "No se pudieron obtener las notas de conciliación",
      response.status,
    );
  }

  return (await response.json()) as ReconciliationNote[];
}

export async function createReconciliationNote(
  bookingId: string,
  message: string,
  accessToken: string,
): Promise<ReconciliationNote> {
  const response = await fetch(
    `${API_BASE_URL}/api/reconciliation/booking/${bookingId}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ message }),
    },
  );

  if (!response.ok) {
    const json = await response.json().catch(() => null);
    const errorMessage = json?.error ?? "No se pudo guardar la nota";
    throw new ApiError(errorMessage, response.status);
  }

  return (await response.json()) as ReconciliationNote;
}

export async function resolveReconciliationNote(
  noteId: string,
  accessToken: string,
): Promise<ReconciliationNote> {
  const response = await fetch(
    `${API_BASE_URL}/api/reconciliation/note/${noteId}`,
    {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ status: "RESOLVED" }),
    },
  );

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const errorMessage = payload?.error ?? "No se pudo actualizar la nota";
    throw new ApiError(errorMessage, response.status);
  }

  return (await response.json()) as ReconciliationNote;
}
