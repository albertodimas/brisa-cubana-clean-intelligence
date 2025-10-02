import { z } from "zod";
import { findFakeUser, isFakeDataEnabled } from "@/server/utils/fake";

const loginResponseSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable(),
  role: z.string().optional(),
  token: z.string(),
});

export type VerifiedUser = z.infer<typeof loginResponseSchema>;

function resolveApiBaseUrl() {
  return (
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:3001"
  );
}

export async function verifyUserCredentials(
  email: string,
  password: string,
): Promise<VerifiedUser | null> {
  if (isFakeDataEnabled()) {
    const fakeUser = findFakeUser(email, password);
    if (!fakeUser) {
      return null;
    }
    return fakeUser;
  }

  try {
    const response = await fetch(`${resolveApiBaseUrl()}/api/auth/login`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        "[auth] Failed to verify credentials",
        response.status,
        errorBody,
      );
      return null;
    }

    const json = await response.json();
    const parsed = loginResponseSchema.safeParse(json);
    if (!parsed.success) {
      console.error("[auth] Invalid login payload", parsed.error.flatten());
      return null;
    }

    return parsed.data;
  } catch (error) {
    console.error("[auth] Error verifying credentials", error);
    return null;
  }
}
