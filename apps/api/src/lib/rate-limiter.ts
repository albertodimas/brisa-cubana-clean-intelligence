import type { Context, MiddlewareHandler } from "hono";
import honoRateLimiter from "hono-rate-limiter";
import { rateLimitLogger } from "./logger.js";

type RateLimiterOptions = {
  limit: number;
  windowMs: number;
  errorMessage: string;
  identifier?: string;
  keyGenerator?: (c: Context) => string;
};

function extractClientIdentifier(c: Context): string {
  const forwarded = c.req.header("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? forwarded;
  }

  const realIp =
    c.req.header("x-real-ip") ??
    c.req.header("cf-connecting-ip") ??
    c.req.header("fastly-client-ip");
  if (realIp) {
    return realIp;
  }

  const fallback =
    c.req.raw.headers.get("x-forwarded-for") ??
    c.req.raw.headers.get("x-real-ip") ??
    c.req.raw.headers.get("cf-connecting-ip");

  return fallback ?? "anonymous";
}

export function createRateLimiter({
  limit,
  windowMs,
  errorMessage,
  identifier,
  keyGenerator,
}: RateLimiterOptions): MiddlewareHandler {
  const { rateLimiter } = honoRateLimiter as {
    rateLimiter: (config: {
      windowMs: number;
      limit: number;
      standardHeaders: string;
      keyGenerator: (c: Context) => string;
      handler: MiddlewareHandler;
    }) => MiddlewareHandler;
  };

  const resolveKey = keyGenerator ?? extractClientIdentifier;

  return rateLimiter({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    keyGenerator: (c: Context) => {
      const key = resolveKey(c);
      rateLimitLogger.debug(
        {
          endpoint: identifier ?? "unknown",
          clientId: key,
          limit,
          windowMs,
        },
        `Rate limit verificado para ${identifier ?? "endpoint"}`,
      );
      return key;
    },
    handler: async (ctx: Context) => {
      const key = resolveKey(ctx);
      rateLimitLogger.warn(
        {
          endpoint: identifier ?? "unknown",
          clientId: key,
          limit,
          windowMs,
          path: ctx.req.path,
        },
        `Rate limit excedido para ${identifier ?? "endpoint"}`,
      );
      return ctx.json({ error: errorMessage }, 429);
    },
  });
}

export function defaultRateLimitKey(c: Context): string {
  return extractClientIdentifier(c);
}
