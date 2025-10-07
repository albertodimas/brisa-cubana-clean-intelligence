"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

async function resolveAuthToken(): Promise<string | null> {
  const store = await cookies();
  return store.get("auth_token")?.value ?? process.env.API_TOKEN ?? null;
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
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { error: body.error ?? "Credenciales inválidas" };
    }

    const json = await res.json();
    const token = json.token as string | undefined;
    if (!token) {
      return { error: "Respuesta de autenticación incompleta" };
    }

    const secure = process.env.NODE_ENV === "production";
    const store = await cookies();
    store.set("auth_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    revalidatePath("/");
    return { success: "Sesión iniciada" };
  } catch (error) {
    console.error("[actions] login", error);
    return { error: "Error inesperado" };
  }
}

export async function logoutAction(): Promise<ActionResult> {
  try {
    const token = await resolveAuthToken();
    if (token) {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => undefined);
    }

    const store = await cookies();
    store.delete("auth_token");
    revalidatePath("/");
    return { success: "Sesión cerrada" };
  } catch (error) {
    console.error("[actions] logout", error);
    return { error: "Error al cerrar sesión" };
  }
}

export async function createServiceAction(formData: FormData): Promise<ActionResult> {
  try {
    const payload = {
      name: formData.get("name")?.toString() ?? "",
      description: formData.get("description")?.toString() ?? "",
      basePrice: Number(formData.get("basePrice")),
      durationMin: Number(formData.get("durationMin")),
    };

    if (!payload.name || Number.isNaN(payload.basePrice) || Number.isNaN(payload.durationMin)) {
      return { error: "Completa los campos obligatorios" };
    }

    const token = await resolveAuthToken();
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

export async function createPropertyAction(formData: FormData): Promise<ActionResult> {
  try {
    const token = await resolveAuthToken();
    if (!token) {
      return { error: "Sesión no autenticada" };
    }

    const payload = {
      label: formData.get("propertyLabel")?.toString() ?? "",
      addressLine: formData.get("propertyAddress")?.toString() ?? "",
      city: formData.get("propertyCity")?.toString() ?? "",
      state: (formData.get("propertyState")?.toString() ?? "").toUpperCase(),
      zipCode: formData.get("propertyZip")?.toString() ?? "",
      type: (formData.get("propertyType")?.toString() ?? "RESIDENTIAL") as string,
      ownerId: formData.get("propertyOwner")?.toString() ?? "",
      bedrooms: Number(formData.get("propertyBedrooms")) || undefined,
      bathrooms: Number(formData.get("propertyBathrooms")) || undefined,
      sqft: Number(formData.get("propertySqft")) || undefined,
      notes: formData.get("propertyNotes")?.toString() ?? undefined,
    };

    if (!payload.label || !payload.addressLine || !payload.city || !payload.state || !payload.ownerId) {
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

export async function createBookingAction(formData: FormData): Promise<ActionResult> {
  try {
    const token = await resolveAuthToken();
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

    if (!payload.customerId || !payload.propertyId || !payload.serviceId || !scheduledAt) {
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

export async function toggleServiceActiveAction(serviceId: string, active: boolean): Promise<ActionResult> {
  try {
    const token = await resolveAuthToken();
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
    return { success: active ? "Servicio habilitado" : "Servicio deshabilitado" };
  } catch (error) {
    console.error("[actions] toggleService", error);
    return { error: "Error inesperado" };
  }
}
