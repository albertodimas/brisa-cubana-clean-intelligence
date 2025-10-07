import type { MiddlewareHandler } from "hono";

const apiToken = process.env.API_TOKEN;

export const requireAuth: MiddlewareHandler = async (c, next) => {
  if (!apiToken) {
    return c.json({ error: "API token not configured" }, 500);
  }

  const header = c.req.header("authorization") ?? "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || token !== apiToken) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await next();
};
