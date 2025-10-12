/**
 * API client utilities for authenticated requests
 */

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import type { ActionResult } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/**
 * Resolves the current user's access token from the session
 */
export async function resolveAccessToken(): Promise<string | null> {
  const session = await auth();
  return session?.accessToken ?? null;
}

/**
 * Makes an authenticated fetch request to the API
 * @param endpoint - API endpoint path (e.g., "/api/services")
 * @param options - Fetch options (method, body, headers)
 * @param errorMessage - Custom error message for failed requests
 * @param successMessage - Custom success message for successful requests
 * @param shouldRevalidate - Whether to revalidate the root path after success
 * @returns ActionResult with success or error message
 */
export async function authenticatedFetch(
  endpoint: string,
  options: RequestInit,
  errorMessage = "Operación fallida",
  successMessage = "Operación exitosa",
  shouldRevalidate = true,
): Promise<ActionResult> {
  const token = await resolveAccessToken();
  if (!token) {
    return { error: "Sesión no autenticada" };
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { error: body.error ?? errorMessage };
  }

  if (shouldRevalidate) {
    revalidatePath("/");
  }

  return { success: successMessage };
}

/**
 * Coerce optional form data value to number
 */
export function coerceOptionalNumber(
  value: FormDataEntryValue | null,
): number | undefined {
  if (value === null || value === undefined) return undefined;
  const text = value.toString().trim();
  if (!text) return undefined;
  const num = Number(text);
  return Number.isNaN(num) ? undefined : num;
}

/**
 * Coerce optional form data value to string
 */
export function coerceOptionalString(
  value: FormDataEntryValue | null,
): string | undefined {
  if (value === null || value === undefined) return undefined;
  const text = value.toString().trim();
  return text ? text : undefined;
}
