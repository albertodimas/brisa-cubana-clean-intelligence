import type { APIRequestContext } from "@playwright/test";
import { adminEmail, adminPassword } from "./auth";

const apiBaseUrl = process.env.E2E_API_URL || "http://localhost:3001";

let forwardedIpCounter = 10;
function nextForwardedIp(): string {
  forwardedIpCounter = (forwardedIpCounter + 1) % 200;
  const base = 50 + forwardedIpCounter;
  return `198.51.100.${base}`;
}

function loginHeaders(overrides: Record<string, string> = {}) {
  return {
    "Content-Type": "application/json",
    "x-forwarded-for":
      overrides["x-forwarded-for"] ??
      process.env.E2E_FORWARD_IP ??
      nextForwardedIp(),
    "x-internal-remote-address":
      overrides["x-internal-remote-address"] ?? "127.0.0.1",
    ...overrides,
  };
}

export async function getAdminAccessToken(
  request: APIRequestContext,
): Promise<string> {
  const response = await request.post(
    `${apiBaseUrl}/api/authentication/login`,
    {
      headers: loginHeaders(),
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

type DeleteBookingsOptions = {
  notesTag?: string;
};

export async function deleteAllBookings(
  request: APIRequestContext,
  accessToken: string,
  options: DeleteBookingsOptions = {},
): Promise<void> {
  const notesTag = options.notesTag ?? "[e2e]";
  const response = await request.delete(
    `${apiBaseUrl}/api/test-utils/bookings?tag=${encodeURIComponent(notesTag)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok()) {
    console.warn(
      "[e2e] No se pudo limpiar las reservas de prueba",
      response.status(),
      response.statusText(),
    );
  }
}

export async function resetRateLimitCounters(
  request: APIRequestContext,
  accessToken?: string,
): Promise<void> {
  const token = accessToken ?? (await getAdminAccessToken(request));
  const response = await request.post(
    `${apiBaseUrl}/api/test-utils/rate-limiter/reset`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok()) {
    throw new Error(
      `No se pudo reiniciar el rate limiting: ${response.status()} ${response.statusText()}`,
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
      headers: loginHeaders(),
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

const DEFAULT_BOOKING_OFFSET_MS = 10 * 24 * 60 * 60 * 1000;

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
  scheduledAt?: string;
  notes?: string;
  notesTag?: string;
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

  const useCustomSchedule = Boolean(options.scheduledAt);
  const baseTimestamp = useCustomSchedule
    ? new Date(options.scheduledAt!).getTime()
    : Date.now() + DEFAULT_BOOKING_OFFSET_MS;
  const durationMs = (service.durationMin ?? 120) * 60 * 1000;
  const jitterRange = Math.max(durationMs / 3, 5 * 60 * 1000);

  let booking: {
    id: string;
    code: string;
    status: string;
    scheduledAt: string;
  } | null = null;
  let lastError: { status: number; statusText: string } | null = null;

  const notesTag = options.notesTag ?? "[e2e]";
  const bookingNotes =
    options.notes ?? `${notesTag} booking fixture`.slice(0, 255);

  for (let attempt = 0; attempt < 6; attempt++) {
    const jitterMs = useCustomSchedule
      ? 0
      : Math.floor((Math.random() - 0.5) * jitterRange);
    const scheduledAt = new Date(
      baseTimestamp + attempt * durationMs + jitterMs,
    ).toISOString();

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
        notes: bookingNotes,
      },
    });

    if (response.ok()) {
      const bookingResponse = (await response.json()) as {
        data: {
          id: string;
          code: string;
          status: string;
          scheduledAt: string;
        };
      };
      booking = bookingResponse.data;
      break;
    }

    const status = response.status();
    const statusText = response.statusText();
    lastError = { status, statusText };

    if (status === 409) {
      // Conflicto por doble booking: intentar con otro horario.
      continue;
    }

    throw new Error(
      `No se pudo crear la reserva de prueba: ${status} ${statusText}`,
    );
  }

  if (!booking) {
    const details =
      lastError?.status === 409
        ? "La API reportó conflictos repetidos (409) a pesar de reintentos con horarios alternos."
        : `${lastError?.status ?? "desconocido"} ${
            lastError?.statusText ?? ""
          }`;
    throw new Error(
      `No se pudo crear la reserva de prueba tras múltiples intentos: ${details}`,
    );
  }

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
      data: {
        id: string;
        code: string;
        status: string;
        scheduledAt: string;
      };
    };

    return patched.data;
  }

  return booking;
}
