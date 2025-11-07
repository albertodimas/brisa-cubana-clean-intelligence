import type { APIRequestContext } from "@playwright/test";
import { adminEmail } from "./auth";
import { getAdminAccessToken, getUserAccessToken } from "./services";

const apiBaseUrl = process.env.E2E_API_URL || "http://localhost:3001";

type CreateNotificationOptions = {
  userEmail?: string;
  message?: string;
  type?: string;
};

export async function createNotificationFixture(
  request: APIRequestContext,
  options: CreateNotificationOptions = {},
) {
  const accessToken = await getAdminAccessToken(request);
  const response = await request.post(
    `${apiBaseUrl}/api/test-utils/notifications`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      data: {
        userEmail: options.userEmail ?? adminEmail,
        message:
          options.message ??
          `Notificación automatizada ${new Date().toISOString()}`,
        type: options.type ?? "BOOKING_CREATED",
      },
    },
  );

  if (!response.ok()) {
    let errorDetails = "";
    try {
      errorDetails = await response.text();
    } catch {
      errorDetails = "";
    }
    throw new Error(
      `No se pudo crear la notificación: ${response.status()} ${response.statusText()} ${errorDetails}`,
    );
  }

  return (await response.json()) as {
    data: { id: string; userId: string; message: string };
  };
}

export async function markAllNotificationsReadFixture(
  request: APIRequestContext,
  options: { email?: string; password?: string } = {},
) {
  const accessToken = options.email
    ? await getUserAccessToken(
        request,
        options.email,
        options.password ?? "Brisa123!",
      )
    : await getAdminAccessToken(request);
  const response = await request.patch(
    `${apiBaseUrl}/api/notifications/read-all`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok()) {
    throw new Error(
      `No se pudieron marcar como leídas: ${response.status()} ${response.statusText()}`,
    );
  }

  return (await response.json()) as {
    data: { updatedCount: number };
  };
}
