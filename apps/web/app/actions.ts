"use server";

import { revalidatePath } from "next/cache";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import {
  authenticatedFetch,
  coerceOptionalNumber,
  coerceOptionalString,
} from "@/lib/api-client";
import type { ActionResult } from "@/lib/types";

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

    return await authenticatedFetch(
      "/api/services",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      "No se pudo crear el servicio",
      "Servicio creado",
    );
  } catch (error) {
    console.error("[actions] createService", error);
    return { error: "Error inesperado" };
  }
}

export async function createPropertyAction(
  formData: FormData,
): Promise<ActionResult> {
  try {
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

    return await authenticatedFetch(
      "/api/properties",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      "No se pudo crear la propiedad",
      "Propiedad creada",
    );
  } catch (error) {
    console.error("[actions] createProperty", error);
    return { error: "Error inesperado" };
  }
}

export async function createBookingAction(
  formData: FormData,
): Promise<ActionResult> {
  try {
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

    return await authenticatedFetch(
      "/api/bookings",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      "No se pudo crear la reserva",
      "Reserva creada",
    );
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
    return await authenticatedFetch(
      `/api/services/${serviceId}`,
      {
        method: "PATCH",
        body: JSON.stringify({ active }),
      },
      "No se pudo actualizar el servicio",
      active ? "Servicio habilitado" : "Servicio deshabilitado",
    );
  } catch (error) {
    console.error("[actions] toggleService", error);
    return { error: "Error inesperado" };
  }
}

export async function updateServiceAction(
  serviceId: string,
  formData: FormData,
): Promise<ActionResult> {
  try {
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

    return await authenticatedFetch(
      `/api/services/${serviceId}`,
      {
        method: "PATCH",
        body: JSON.stringify(updates),
      },
      "No se pudo actualizar el servicio",
      "Servicio actualizado",
    );
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

    return await authenticatedFetch(
      `/api/properties/${propertyId}`,
      {
        method: "PATCH",
        body: JSON.stringify(updates),
      },
      "No se pudo actualizar la propiedad",
      "Propiedad actualizada",
    );
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

    return await authenticatedFetch(
      `/api/bookings/${bookingId}`,
      {
        method: "PATCH",
        body: JSON.stringify(updates),
      },
      "No se pudo actualizar la reserva",
      "Reserva actualizada",
    );
  } catch (error) {
    console.error("[actions] updateBooking", error);
    return { error: "Error inesperado" };
  }
}

export async function updateUserAction(
  userId: string,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const role = coerceOptionalString(formData.get("userRole"));
    const fullName = coerceOptionalString(formData.get("userFullName"));
    const passwordRaw = coerceOptionalString(formData.get("userPassword"));
    const isActiveRaw = coerceOptionalString(formData.get("userActive"));

    const payload: Record<string, unknown> = {};
    if (role) payload.role = role;
    if (fullName !== undefined) payload.fullName = fullName;
    if (passwordRaw) payload.password = passwordRaw;
    if (typeof isActiveRaw === "string") {
      payload.isActive = isActiveRaw === "true";
    }

    if (Object.keys(payload).length === 0) {
      return { error: "Sin cambios para actualizar" };
    }

    return await authenticatedFetch(
      `/api/users/${userId}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
      "No se pudo actualizar el usuario",
      "Usuario actualizado",
    );
  } catch (error) {
    console.error("[actions] updateUser", error);
    return { error: "Error inesperado" };
  }
}

export async function toggleUserActiveAction(
  userId: string,
  active: boolean,
): Promise<ActionResult> {
  const formData = new FormData();
  formData.set("userActive", String(active));
  return updateUserAction(userId, formData);
}

export async function createUserAction(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const payload = {
      email: formData.get("newUserEmail")?.toString() ?? "",
      fullName: formData.get("newUserFullName")?.toString() ?? "",
      role: formData.get("newUserRole")?.toString() ?? "STAFF",
      password: formData.get("newUserPassword")?.toString() ?? "",
    };

    if (!payload.email || !payload.fullName || !payload.password) {
      return {
        error: "Completa correo, nombre y contraseña",
      };
    }

    return await authenticatedFetch(
      "/api/users",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      "No se pudo crear el usuario",
      "Usuario creado",
    );
  } catch (error) {
    console.error("[actions] createUser", error);
    return { error: "Error inesperado" };
  }
}
