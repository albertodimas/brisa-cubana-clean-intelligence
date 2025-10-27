import type { APIRequestContext } from "@playwright/test";
import { adminEmail, adminPassword } from "./auth";

const apiBaseUrl = process.env.E2E_API_URL || "http://localhost:3001";
let cachedAdminToken: { value: string; issuedAt: number } | null = null;
const TOKEN_TTL_MS = 10 * 60 * 1000; // 10 minutes

export async function getAdminAccessToken(
  request: APIRequestContext,
): Promise<string> {
  if (
    cachedAdminToken &&
    Date.now() - cachedAdminToken.issuedAt < TOKEN_TTL_MS
  ) {
    return cachedAdminToken.value;
  }

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await request.post(
      `${apiBaseUrl}/api/authentication/login`,
      {
        data: {
          email: adminEmail,
          password: adminPassword,
        },
      },
    );

    if (response.ok()) {
      const json = (await response.json()) as { token?: string };
      if (!json.token) {
        throw new Error("Respuesta de autenticación sin token de acceso");
      }
      cachedAdminToken = { value: json.token, issuedAt: Date.now() };
      return json.token;
    }

    const status = response.status();
    const shouldRetry =
      status === 429 || status === 403 || status === 503 || status === 500;
    lastError = new Error(
      `No se pudo autenticar al administrador: ${status} ${response.statusText()}`,
    );
    if (!shouldRetry || attempt === 3) {
      break;
    }
    await new Promise((resolve) =>
      setTimeout(resolve, 300 * Math.pow(2, attempt)),
    );
  }

  cachedAdminToken = null;
  throw (
    lastError ??
    new Error("No se pudo autenticar al administrador tras múltiples intentos")
  );
}

type ServicePayload = {
  name?: string;
  description?: string;
  basePrice?: number;
  durationMin?: number;
};

type UserPayload = {
  email?: string;
  fullName?: string;
  password?: string;
  role?: "ADMIN" | "COORDINATOR" | "STAFF" | "CLIENT";
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

export async function createUserFixture(
  request: APIRequestContext,
  overrides: UserPayload = {},
) {
  const accessToken = await getAdminAccessToken(request);
  const email =
    overrides.email ??
    `qa-user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@brisacubanacleanintelligence.com`;
  const password = overrides.password ?? "Brisa123!";
  const fullName = overrides.fullName ?? "QA Notifications";
  const role = overrides.role ?? "ADMIN";

  const response = await request.post(`${apiBaseUrl}/api/users`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    data: {
      email,
      fullName,
      password,
      role,
    },
  });

  if (!response.ok()) {
    throw new Error(
      `No se pudo crear el usuario de prueba: ${response.status()} ${response.statusText()}`,
    );
  }

  const json = (await response.json()) as {
    data: { id: string; email: string; fullName: string; role: string };
  };

  return {
    id: json.data.id,
    email,
    password,
  };
}

export async function deleteUserFixture(
  request: APIRequestContext,
  userId: string,
) {
  const accessToken = await getAdminAccessToken(request);
  const response = await request.delete(`${apiBaseUrl}/api/users/${userId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok()) {
    throw new Error(
      `No se pudo eliminar el usuario de prueba: ${response.status()} ${response.statusText()}`,
    );
  }
}

export async function getUserAccessToken(
  request: APIRequestContext,
  email: string,
  password: string,
) {
  const response = await request.post(
    `${apiBaseUrl}/api/authentication/login`,
    {
      data: {
        email,
        password,
      },
    },
  );

  if (!response.ok()) {
    throw new Error(
      `No se pudo autenticar al usuario ${email}: ${response.status()} ${response.statusText()}`,
    );
  }

  const json = (await response.json()) as { token?: string };
  if (!json.token) {
    throw new Error("Respuesta de autenticación sin token de acceso");
  }

  return json.token;
}

async function fetchCollection<T>(
  request: APIRequestContext,
  accessToken: string,
  path: string,
): Promise<T[]> {
  const response = await request.get(`${apiBaseUrl}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok()) {
    throw new Error(
      `No se pudo obtener datos desde ${path}: ${response.status()} ${response.statusText()}`,
    );
  }

  const json = (await response.json()) as { data?: T[] };
  return json.data ?? [];
}

type BookingFixtureOptions = {
  status?: "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
};

export async function createBookingFixture(
  request: APIRequestContext,
  accessToken: string,
  options: BookingFixtureOptions = {},
) {
  const [customers, properties, services] = await Promise.all([
    fetchCollection<{ id: string }>(
      request,
      accessToken,
      "/api/customers?limit=1",
    ),
    fetchCollection<{ id: string }>(
      request,
      accessToken,
      "/api/properties?limit=1",
    ),
    fetchCollection<{ id: string; durationMin: number }>(
      request,
      accessToken,
      "/api/services?limit=1",
    ),
  ]);

  const customerId = customers[0]?.id;
  const propertyId = properties[0]?.id;
  const service = services[0];

  if (!customerId || !propertyId || !service?.id) {
    throw new Error(
      "No se encontraron datos suficientes para crear una reserva de prueba",
    );
  }

  const scheduledAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

  const response = await request.post(`${apiBaseUrl}/api/bookings`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    data: {
      customerId,
      propertyId,
      serviceId: service.id,
      scheduledAt,
      durationMin: service.durationMin ?? 120,
    },
  });

  if (!response.ok()) {
    throw new Error(
      `No se pudo crear la reserva de prueba: ${response.status()} ${response.statusText()}`,
    );
  }

  const bookingResponse = (await response.json()) as {
    data: { id: string; code: string; status: string };
  };

  const booking = bookingResponse.data;

  if (options.status && options.status !== booking.status) {
    const patchResponse = await request.patch(
      `${apiBaseUrl}/api/bookings/${booking.id}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        data: {
          status: options.status,
        },
      },
    );

    if (!patchResponse.ok()) {
      throw new Error(
        `No se pudo actualizar la reserva de prueba: ${patchResponse.status()} ${patchResponse.statusText()}`,
      );
    }

    const patched = (await patchResponse.json()) as {
      data: { id: string; code: string; status: string };
    };

    return patched.data;
  }

  return booking;
}
