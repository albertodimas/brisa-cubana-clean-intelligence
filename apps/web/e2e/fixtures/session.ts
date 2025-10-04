import type { APIRequestContext, Cookie, Page } from "@playwright/test";

export const API_BASE =
  process.env.PLAYWRIGHT_API_URL ?? "http://127.0.0.1:3001";
export const WEB_BASE =
  process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

export interface Credentials {
  email: string;
  password: string;
}

export async function establishSession(
  page: Page,
  request: APIRequestContext,
  { email, password }: Credentials,
) {
  const csrfResponse = await request.get(`${WEB_BASE}/api/auth/csrf`);
  if (!csrfResponse.ok()) {
    throw new Error("Failed to retrieve CSRF token");
  }

  const { csrfToken } = (await csrfResponse.json()) as { csrfToken: string };

  const csrfCookies = csrfResponse
    .headersArray()
    .filter((header) => header.name.toLowerCase() === "set-cookie")
    .map((header) => header.value.split(";")[0]?.trim())
    .filter((value): value is string => Boolean(value));

  const cookieHeader = csrfCookies.join("; ");

  const callbackResponse = await request.fetch(
    `${WEB_BASE}/api/auth/callback/credentials?json=true`,
    {
      method: "POST",
      maxRedirects: 0,
      form: {
        csrfToken,
        email,
        password,
        callbackUrl: `${WEB_BASE}/dashboard`,
      },
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
    },
  );

  if (![200, 302].includes(callbackResponse.status())) {
    throw new Error(
      `Failed to establish session (${callbackResponse.status()})`,
    );
  }

  const cookieHeaders = callbackResponse
    .headersArray()
    .filter((header) => header.name.toLowerCase() === "set-cookie");

  if (cookieHeaders.length === 0) {
    throw new Error("No session cookies were returned");
  }

  const { hostname } = new URL(WEB_BASE);

  const cookies: Cookie[] = cookieHeaders.map((header) => {
    const [cookiePair, ...attributePairs] = header.value.split(";");
    const [cookieName, ...cookieValueParts] = cookiePair.split("=");
    const cookieValue = cookieValueParts.join("=");
    const cookie: Cookie = {
      name: cookieName.trim(),
      value: cookieValue.trim(),
      domain: hostname,
      path: "/",
      expires: -1,
      httpOnly: false,
      secure: false,
      sameSite: "Lax",
    };

    for (const attribute of attributePairs) {
      const [rawKey, rawValue] = attribute.trim().split("=");
      const key = rawKey?.toLowerCase();
      if (!key) continue;
      switch (key) {
        case "httponly":
          cookie.httpOnly = true;
          break;
        case "secure":
          cookie.secure = true;
          break;
        case "samesite":
          cookie.sameSite = (rawValue ?? "Lax") as "Strict" | "Lax" | "None";
          break;
        case "expires":
          cookie.expires = Math.round(
            new Date(rawValue ?? "").getTime() / 1000,
          );
          break;
        case "max-age":
          cookie.expires =
            Math.round(Date.now() / 1000) + Number(rawValue ?? "0");
          break;
      }
    }

    return cookie;
  });

  await page.context().addCookies(cookies);
}
