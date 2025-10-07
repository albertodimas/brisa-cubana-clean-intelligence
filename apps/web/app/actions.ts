"use server";

import { revalidatePath } from "next/cache";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const API_TOKEN = process.env.API_TOKEN;

function ensureAuthToken() {
  if (!API_TOKEN) {
    throw new Error("API_TOKEN is not configured");
  }
  return API_TOKEN;
}

type ActionResult = {
  success?: string;
  error?: string;
};

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

    const res = await fetch(`${API_URL}/api/services`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ensureAuthToken()}`,
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

export async function toggleServiceActiveAction(serviceId: string, active: boolean): Promise<ActionResult> {
  try {
    const res = await fetch(`${API_URL}/api/services/${serviceId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ensureAuthToken()}`,
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
