"use server";

import { revalidatePath } from "next/cache";
import { AuthError } from "next-auth";
import { auth, signIn, signOut } from "@/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

async function resolveAccessToken(): Promise<string | null> {
  const session = await auth();
  return session?.accessToken ?? null;
}

type ActionResult = {
  success?: string;
  error?: string;
};

export async function loginAction(formData: FormData): Promise<ActionResult> {
  const email = formData.get("email")?.toString() ?? "";
  const password = formData.get("password")?.toString() ?? "";

  if (!email || !password) {
    return { error: "Ingresa usuario y contraseña" };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    revalidatePath("/");
    return { success: "Sesión iniciada" };
  } catch (error) {
    console.error("[actions] login", error);
    if (error instanceof AuthError) {
      const code = error.type;
      if (code === "CredentialsSignin") {
        const cause = error.cause as
          | { status?: number; body?: { error?: string } }
          | undefined;
        if (cause?.status === 429) {
          return {
            error:
              cause.body?.error ??
              "Demasiados intentos de inicio de sesión. Intenta nuevamente en un momento.",
          };
        }
        return { error: cause?.body?.error ?? "Credenciales inválidas" };
      }
      return { error: "No se pudo iniciar sesión" };
    }
    return { error: "Error inesperado" };
  }
}

export async function logoutAction(): Promise<ActionResult> {
  try {
    await signOut({ redirect: false });
    revalidatePath("/");
    return { success: "Sesión cerrada" };
  } catch (error) {
    console.error("[actions] logout", error);
    return { error: "Error al cerrar sesión" };
  }
}

export async function createServiceAction(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const payload = {
      name: formData.get("name")?.toString() ?? "",
      description: formData.get("description")?.toString() ?? "",
      basePrice: Number(formData.get("basePrice")),
      durationMin: Number(formData.get("durationMin")),
    };

    if (
      !payload.name ||
      Number.isNaN(payload.basePrice) ||
      Number.isNaN(payload.durationMin)
    ) {
      return { error: "Completa los campos obligatorios" };
    }

    const token = await resolveAccessToken();
    if (!token) {
      return { error: "Sesión no autenticada" };
    }

    const res = await fetch(`${API_URL}/api/services`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { error: body.error ?? "No se pudo crear el servicio" };
    }

    revalidatePath("/");
    return { success: "Servicio creado" };
  } catch (error) {
    console.error("[actions] createService", error);
    return { error: "Error inesperado" };
  }
}

export async function createPropertyAction(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const token = await resolveAccessToken();
    if (!token) {
      return { error: "Sesión no autenticada" };
    }

    const payload = {
      label: formData.get("propertyLabel")?.toString() ?? "",
      addressLine: formData.get("propertyAddress")?.toString() ?? "",
      city: formData.get("propertyCity")?.toString() ?? "",
      state: (formData.get("propertyState")?.toString() ?? "").toUpperCase(),
      zipCode: formData.get("propertyZip")?.toString() ?? "",
      type: (formData.get("propertyType")?.toString() ??
        "RESIDENTIAL") as string,
      ownerId: formData.get("propertyOwner")?.toString() ?? "",
      bedrooms: Number(formData.get("propertyBedrooms")) || undefined,
      bathrooms: Number(formData.get("propertyBathrooms")) || undefined,
      sqft: Number(formData.get("propertySqft")) || undefined,
      notes: formData.get("propertyNotes")?.toString() ?? undefined,
    };

    if (
      !payload.label ||
      !payload.addressLine ||
      !payload.city ||
      !payload.state ||
      !payload.ownerId
    ) {
      return { error: "Completa los campos obligatorios de la propiedad" };
    }

    const res = await fetch(`${API_URL}/api/properties`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { error: body.error ?? "No se pudo crear la propiedad" };
    }

    revalidatePath("/");
    return { success: "Propiedad creada" };
  } catch (error) {
    console.error("[actions] createProperty", error);
    return { error: "Error inesperado" };
  }
}

export async function createBookingAction(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const token = await resolveAccessToken();
    if (!token) {
      return { error: "Sesión no autenticada" };
    }

    const scheduledAt = formData.get("bookingScheduledAt")?.toString() ?? "";
    const payload = {
      customerId: formData.get("bookingCustomer")?.toString() ?? "",
      propertyId: formData.get("bookingProperty")?.toString() ?? "",
      serviceId: formData.get("bookingService")?.toString() ?? "",
      scheduledAt,
      notes: formData.get("bookingNotes")?.toString() ?? undefined,
      durationMin: Number(formData.get("bookingDuration")) || undefined,
    };

    if (
      !payload.customerId ||
      !payload.propertyId ||
      !payload.serviceId ||
      !scheduledAt
    ) {
      return { error: "Completa todos los campos de la reserva" };
    }

    const res = await fetch(`${API_URL}/api/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { error: body.error ?? "No se pudo crear la reserva" };
    }

    revalidatePath("/");
    return { success: "Reserva creada" };
  } catch (error) {
    console.error("[actions] createBooking", error);
    return { error: "Error inesperado" };
  }
}

export async function toggleServiceActiveAction(
  serviceId: string,
  active: boolean,
): Promise<ActionResult> {
  try {
    const token = await resolveAccessToken();
    if (!token) {
      return { error: "Sesión no autenticada" };
    }

    const res = await fetch(`${API_URL}/api/services/${serviceId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ active }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { error: body.error ?? "No se pudo actualizar el servicio" };
    }

    revalidatePath("/");
    return {
      success: active ? "Servicio habilitado" : "Servicio deshabilitado",
    };
  } catch (error) {
    console.error("[actions] toggleService", error);
    return { error: "Error inesperado" };
  }
}

function coerceOptionalNumber(
  value: FormDataEntryValue | null,
): number | undefined {
  if (value === null || value === undefined) return undefined;
  const text = value.toString().trim();
  if (!text) return undefined;
  const num = Number(text);
  return Number.isNaN(num) ? undefined : num;
}

function coerceOptionalString(
  value: FormDataEntryValue | null,
): string | undefined {
  if (value === null || value === undefined) return undefined;
  const text = value.toString().trim();
  return text ? text : undefined;
}

export async function updateServiceAction(
  serviceId: string,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const token = await resolveAccessToken();
    if (!token) {
      return { error: "Sesión no autenticada" };
    }

    const updates: Record<string, unknown> = {};
    const name = coerceOptionalString(formData.get("serviceName"));
    const description = coerceOptionalString(
      formData.get("serviceDescription"),
    );
    const basePrice = coerceOptionalNumber(formData.get("serviceBasePrice"));
    const durationMin = coerceOptionalNumber(formData.get("serviceDuration"));
    const active = formData.get("serviceActive");

    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (basePrice !== undefined) updates.basePrice = basePrice;
    if (durationMin !== undefined) updates.durationMin = durationMin;
    if (typeof active === "string") {
      updates.active = active === "true";
    }

    if (Object.keys(updates).length === 0) {
      return { error: "Sin cambios para actualizar" };
    }

    const res = await fetch(`${API_URL}/api/services/${serviceId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { error: body.error ?? "No se pudo actualizar el servicio" };
    }

    revalidatePath("/");
    return { success: "Servicio actualizado" };
  } catch (error) {
    console.error("[actions] updateService", error);
    return { error: "Error inesperado" };
  }
}

export async function updatePropertyAction(
  propertyId: string,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const token = await resolveAccessToken();
    if (!token) {
      return { error: "Sesión no autenticada" };
    }

    const updates: Record<string, unknown> = {};
    const label = coerceOptionalString(formData.get("propertyLabel"));
    const addressLine = coerceOptionalString(formData.get("propertyAddress"));
    const city = coerceOptionalString(formData.get("propertyCity"));
    const state = coerceOptionalString(
      formData.get("propertyState"),
    )?.toUpperCase();
    const zipCode = coerceOptionalString(formData.get("propertyZip"));
    const type = coerceOptionalString(formData.get("propertyType"));
    const notes = coerceOptionalString(formData.get("propertyNotes"));
    const bedrooms = coerceOptionalNumber(formData.get("propertyBedrooms"));
    const bathrooms = coerceOptionalNumber(formData.get("propertyBathrooms"));
    const sqft = coerceOptionalNumber(formData.get("propertySqft"));
    const ownerId = coerceOptionalString(formData.get("propertyOwner"));

    if (label) updates.label = label;
    if (addressLine) updates.addressLine = addressLine;
    if (city) updates.city = city;
    if (state) updates.state = state;
    if (zipCode) updates.zipCode = zipCode;
    if (type) updates.type = type;
    if (notes !== undefined) updates.notes = notes;
    if (bedrooms !== undefined) updates.bedrooms = bedrooms;
    if (bathrooms !== undefined) updates.bathrooms = bathrooms;
    if (sqft !== undefined) updates.sqft = sqft;
    if (ownerId) updates.ownerId = ownerId;

    if (Object.keys(updates).length === 0) {
      return { error: "Sin cambios para actualizar" };
    }

    const res = await fetch(`${API_URL}/api/properties/${propertyId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { error: body.error ?? "No se pudo actualizar la propiedad" };
    }

    revalidatePath("/");
    return { success: "Propiedad actualizada" };
  } catch (error) {
    console.error("[actions] updateProperty", error);
    return { error: "Error inesperado" };
  }
}

export async function updateBookingAction(
  bookingId: string,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const token = await resolveAccessToken();
    if (!token) {
      return { error: "Sesión no autenticada" };
    }

    const updates: Record<string, unknown> = {};
    const scheduledAt = coerceOptionalString(
      formData.get("bookingScheduledAt"),
    );
    const durationMin = coerceOptionalNumber(formData.get("bookingDuration"));
    const status = coerceOptionalString(formData.get("bookingStatus"));
    const notes = formData.get("bookingNotes");
    const propertyId = coerceOptionalString(formData.get("bookingProperty"));
    const serviceId = coerceOptionalString(formData.get("bookingService"));

    if (scheduledAt) {
      const iso = new Date(scheduledAt).toISOString();
      updates.scheduledAt = iso;
    }
    if (durationMin !== undefined) updates.durationMin = durationMin;
    if (status) updates.status = status;
    if (notes !== null) {
      const trimmed = notes?.toString().trim();
      updates.notes = trimmed ?? null;
    }
    if (propertyId) updates.propertyId = propertyId;
    if (serviceId) updates.serviceId = serviceId;

    if (Object.keys(updates).length === 0) {
      return { error: "Sin cambios para actualizar" };
    }

    const res = await fetch(`${API_URL}/api/bookings/${bookingId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { error: body.error ?? "No se pudo actualizar la reserva" };
    }

    revalidatePath("/");
    return { success: "Reserva actualizada" };
  } catch (error) {
    console.error("[actions] updateBooking", error);
    return { error: "Error inesperado" };
  }
}
