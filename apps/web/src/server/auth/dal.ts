import { z } from "zod";
import { findFakeUser, isFakeDataEnabled } from "@/server/utils/fake";
import { env } from "@/config/env";
import { logger } from "@/server/logger";

const loginResponseSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable(),
  role: z.string().optional(),
  token: z.string(),
});

export type VerifiedUser = z.infer<typeof loginResponseSchema>;

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
    const response = await fetch(`${env.apiUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "<unreadable>");
      logger.warn(
        {
          status: response.status,
          errorBody,
        },
        "[auth] Failed to verify credentials",
      );
      return null;
    }

    const json = await response.json();
    const parsed = loginResponseSchema.safeParse(json);
    if (!parsed.success) {
      logger.error(
        {
          issues: parsed.error.flatten(),
        },
        "[auth] Invalid login payload",
      );
      return null;
    }

    return parsed.data;
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : "unknown" },
      "[auth] Error verifying credentials",
    );
    return null;
  }
}
