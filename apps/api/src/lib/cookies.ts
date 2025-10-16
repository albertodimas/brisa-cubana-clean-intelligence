import type { Context } from "hono";

export type SameSitePolicy = "lax" | "strict";

/**
 * Determines secure and SameSite policies for cookies based on the current request.
 * Ensures consistency between auth routes (panel) and portal endpoints.
 */
export function resolveCookiePolicy(c: Context): {
  secure: boolean;
  sameSite: SameSitePolicy;
} {
  if (process.env.NODE_ENV === "production") {
    return { secure: true, sameSite: "strict" };
  }

  const forwardedProto = c.req.header("x-forwarded-proto");
  const secure = forwardedProto === "https" || c.req.url.startsWith("https");

  return { secure, sameSite: secure ? "strict" : "lax" };
}
