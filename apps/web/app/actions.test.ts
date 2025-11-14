import { describe, expect, it, beforeEach, vi } from "vitest";
import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";
import {
  loginAction,
  logoutAction,
  createServiceAction,
  updateServiceAction,
  createPropertyAction,
  updatePropertyAction,
  createBookingAction,
  updateBookingAction,
  updateUserAction,
  toggleUserActiveAction,
} from "./actions";
import { signIn, signOut } from "@/auth";
import * as apiClient from "@/lib/api-client";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const authenticatedFetchMock = vi
  .spyOn(apiClient, "authenticatedFetch")
  .mockResolvedValue({ success: "ok" });

function buildFormData(entries: Record<string, string>): FormData {
  const formData = new FormData();
  Object.entries(entries).forEach(([key, value]) => {
    formData.set(key, value);
  });
  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("loginAction", () => {
  it("returns validation error when credentials are missing", async () => {
    const result = await loginAction(buildFormData({}));

    expect(result).toEqual({ error: "Ingresa usuario y contraseña" });
    expect(signIn).not.toHaveBeenCalled();
  });

  it("authenticates and revalidates on success", async () => {
    vi.mocked(signIn).mockResolvedValueOnce(undefined);

    const result = await loginAction(
      buildFormData({
        email: "user@example.com",
        password: "secret",
        tenantSlug: "brisa-cubana",
      }),
    );

    expect(signIn).toHaveBeenCalledWith(
      "credentials",
      expect.objectContaining({
        email: "user@example.com",
        password: "secret",
        tenantSlug: "brisa-cubana",
        redirect: false,
      }),
    );
    expect(result).toEqual({ success: "Sesión iniciada" });
    expect(revalidatePath).toHaveBeenCalledWith("/");
  });

  it("maps credential rate limit errors", async () => {
    const error = new AuthError("CredentialsSignin");
    Object.assign(error, {
      cause: {
        status: 429,
        body: {
          error:
            "Demasiados intentos de inicio de sesión. Intenta nuevamente en unos minutos.",
        },
      },
    });
    vi.mocked(signIn).mockRejectedValueOnce(error);

    const result = await loginAction(
      buildFormData({
        email: "user@example.com",
        password: "bad",
        tenantSlug: "brisa",
      }),
    );

    expect(result).toEqual({
      error:
        "Demasiados intentos de inicio de sesión. Intenta nuevamente en unos minutos.",
    });
  });

  it("handles unexpected AuthError types", async () => {
    const error = new AuthError("OAuthSignin");
    vi.mocked(signIn).mockRejectedValueOnce(error);

    const result = await loginAction(
      buildFormData({
        email: "user@example.com",
        password: "secret",
        tenantSlug: "demo",
      }),
    );

    expect(result).toEqual({ error: "No se pudo iniciar sesión" });
  });

  it("handles unknown errors", async () => {
    vi.mocked(signIn).mockRejectedValueOnce(new Error("boom"));

    const result = await loginAction(
      buildFormData({
        email: "user@example.com",
        password: "secret",
        tenantSlug: "demo",
      }),
    );

    expect(result).toEqual({ error: "Error inesperado" });
  });
});

describe("logoutAction", () => {
  it("signs out and revalidates", async () => {
    vi.mocked(signOut).mockResolvedValueOnce(undefined);

    const result = await logoutAction();

    expect(signOut).toHaveBeenCalledWith({ redirect: false });
    expect(result).toEqual({ success: "Sesión cerrada" });
    expect(revalidatePath).toHaveBeenCalledWith("/");
  });

  it("returns error when signOut throws", async () => {
    vi.mocked(signOut).mockRejectedValueOnce(new Error("boom"));

    const result = await logoutAction();

    expect(result).toEqual({ error: "Error al cerrar sesión" });
  });
});

describe("service actions", () => {
  it("rejects invalid service creation payloads", async () => {
    const result = await createServiceAction(
      buildFormData({
        name: "Deep Clean",
        description: "",
        basePrice: "invalid",
        durationMin: "60",
      }),
    );

    expect(result).toEqual({ error: "Completa los campos obligatorios" });
    expect(authenticatedFetchMock).not.toHaveBeenCalled();
  });

  it("creates services via authenticatedFetch", async () => {
    authenticatedFetchMock.mockResolvedValueOnce({
      success: "Servicio creado",
    });

    const result = await createServiceAction(
      buildFormData({
        name: "Turnover",
        description: "Express",
        basePrice: "150",
        durationMin: "90",
      }),
    );

    expect(authenticatedFetchMock).toHaveBeenCalledWith(
      "/api/services",
      expect.objectContaining({
        method: "POST",
      }),
      "No se pudo crear el servicio",
      "Servicio creado",
    );
    expect(result).toEqual({ success: "Servicio creado" });
  });

  it("returns error when no service updates provided", async () => {
    const result = await updateServiceAction(
      "svc_1",
      buildFormData({
        serviceName: "",
        serviceDescription: "",
      }),
    );

    expect(result).toEqual({ error: "Sin cambios para actualizar" });
    expect(authenticatedFetchMock).not.toHaveBeenCalled();
  });

  it("sends updated service fields", async () => {
    authenticatedFetchMock.mockImplementationOnce(
      async (_endpoint, options) => {
        const body = JSON.parse(String(options.body));
        expect(body).toEqual({
          name: "Premium",
          basePrice: 200,
          durationMin: 120,
          active: false,
        });
        return { success: "Servicio actualizado" };
      },
    );

    const result = await updateServiceAction(
      "svc_2",
      buildFormData({
        serviceName: " Premium ",
        serviceBasePrice: "200",
        serviceDuration: "120",
        serviceActive: "false",
      }),
    );

    expect(result).toEqual({ success: "Servicio actualizado" });
  });
});

describe("property actions", () => {
  it("validates property creation payload", async () => {
    const result = await createPropertyAction(
      buildFormData({
        propertyLabel: "",
        propertyAddress: "123 Main",
        propertyCity: "Miami",
        propertyState: "fl",
        propertyZip: "33101",
        propertyOwner: "",
      }),
    );

    expect(result).toEqual({
      error: "Completa los campos obligatorios de la propiedad",
    });
  });

  it("submits property updates with normalized state", async () => {
    authenticatedFetchMock.mockImplementationOnce(
      async (_endpoint, options) => {
        const body = JSON.parse(String(options.body));
        expect(body).toMatchObject({
          label: "Brickell",
          state: "FL",
          bedrooms: 2,
          sqft: 900,
        });
        return { success: "Propiedad actualizada" };
      },
    );

    const result = await updatePropertyAction(
      "prop_1",
      buildFormData({
        propertyLabel: " Brickell ",
        propertyState: "fl",
        propertyBedrooms: "2",
        propertySqft: "900",
      }),
    );

    expect(result).toEqual({ success: "Propiedad actualizada" });
  });
});

describe("booking actions", () => {
  it("validates booking creation payload", async () => {
    const result = await createBookingAction(
      buildFormData({
        bookingCustomer: "",
        bookingProperty: "prop",
        bookingService: "svc",
        bookingScheduledAt: "",
      }),
    );

    expect(result).toEqual({
      error: "Completa todos los campos de la reserva",
    });
  });

  it("normalizes scheduledAt on update", async () => {
    const sourceDate = "2025-10-13T12:00";
    const isoString = new Date(sourceDate).toISOString();

    authenticatedFetchMock.mockResolvedValueOnce({
      success: "Reserva actualizada",
    });

    const result = await updateBookingAction(
      "booking_1",
      buildFormData({
        bookingScheduledAt: sourceDate,
        bookingDuration: "45",
        bookingNotes: "   ",
      }),
    );

    expect(result).toEqual({ success: "Reserva actualizada" });

    const [, options] = authenticatedFetchMock.mock.calls[0] ?? [];
    expect(options).toBeTruthy();
    const rawBody = options?.body as string | undefined;
    expect(typeof rawBody).toBe("string");
    const body = JSON.parse(rawBody ?? "{}");
    expect(body).toMatchObject({
      scheduledAt: isoString,
      durationMin: 45,
      notes: "",
    });
    expect(authenticatedFetchMock).toHaveBeenCalledWith(
      "/api/bookings/booking_1",
      expect.objectContaining({ method: "PATCH" }),
      "No se pudo actualizar la reserva",
      "Reserva actualizada",
    );
  });
});

describe("user actions", () => {
  it("requires at least one field to update", async () => {
    const result = await updateUserAction("user_1", buildFormData({}));

    expect(result).toEqual({ error: "Sin cambios para actualizar" });
  });

  it("updates active flag via toggle helper", async () => {
    authenticatedFetchMock.mockResolvedValueOnce({
      success: "Usuario actualizado",
    });

    const result = await toggleUserActiveAction("user_2", false);

    expect(authenticatedFetchMock).toHaveBeenCalledWith(
      "/api/users/user_2",
      expect.any(Object),
      "No se pudo actualizar el usuario",
      "Usuario actualizado",
    );
    expect(result).toEqual({ success: "Usuario actualizado" });
  });
});
