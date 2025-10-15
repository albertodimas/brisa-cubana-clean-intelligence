import type { APIRequestContext } from "@playwright/test";
import { adminEmail, adminPassword } from "./auth";

const apiBaseUrl = process.env.E2E_API_URL || "http://localhost:3001";

export async function getAdminAccessToken(
  request: APIRequestContext,
): Promise<string> {
  const response = await request.post(
    `${apiBaseUrl}/api/authentication/login`,
    {
      data: {
        email: adminEmail,
        password: adminPassword,
      },
    },
  );

  if (!response.ok()) {
    throw new Error(
      `No se pudo autenticar al administrador: ${response.status()} ${response.statusText()}`,
    );
  }

  const json = (await response.json()) as { token?: string };
  if (!json.token) {
    throw new Error("Respuesta de autenticación sin token de acceso");
  }

  return json.token;
}

type ServicePayload = {
  name?: string;
  description?: string;
  basePrice?: number;
  durationMin?: number;
};

export async function createServiceFixture(
  request: APIRequestContext,
  accessToken: string,
  overrides: ServicePayload = {},
) {
  const payload = {
    name: overrides.name ?? `Servicio QA ${Date.now()}`,
    description:
      overrides.description ?? "Servicio generado automáticamente en E2E.",
    basePrice: overrides.basePrice ?? 210,
    durationMin: overrides.durationMin ?? 120,
  };

  const response = await request.post(`${apiBaseUrl}/api/services`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    data: payload,
  });

  if (!response.ok()) {
    throw new Error(
      `No se pudo crear el servicio de prueba: ${response.status()} ${response.statusText()}`,
    );
  }

  return (await response.json()) as { data: { id: string; name: string } };
}
