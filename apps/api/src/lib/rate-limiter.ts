import type { Context, MiddlewareHandler } from "hono";
import honoRateLimiter from "hono-rate-limiter";
import { rateLimitLogger } from "./logger.js";

const INTERNAL_REMOTE_ADDR_HEADER = "x-internal-remote-address";

type RateLimiterOptions = {
  limit: number;
  windowMs: number;
  errorMessage: string;
  identifier?: string;
  keyGenerator?: (c: Context) => string;
};

function normalizeIp(ip: string): string {
  return ip.replace(/^::ffff:/i, "").trim();
}

function isPrivateIp(ip: string): boolean {
  if (ip === "127.0.0.1" || ip === "::1") return true;
  if (ip.startsWith("10.")) return true;
  if (ip.startsWith("192.168.")) return true;
  if (ip.startsWith("172.")) {
    const secondOctet = Number.parseInt(ip.split(".")[1] ?? "0", 10);
    if (secondOctet >= 16 && secondOctet <= 31) {
      return true;
    }
  }
  if (ip.startsWith("fc") || ip.startsWith("fd")) {
    return true;
  }
  return false;
}

function firstForwardedAddress(
  header: string | null | undefined,
): string | null {
  if (!header) return null;
  const [first] = header.split(",");
  const trimmed = first?.trim();
  return trimmed ? normalizeIp(trimmed) : null;
}

function extractClientIdentifier(c: Context, identifier?: string): string {
  const internalAddress = firstForwardedAddress(
    c.req.header(INTERNAL_REMOTE_ADDR_HEADER),
  );

  if (internalAddress) {
    if (!isPrivateIp(internalAddress)) {
      return internalAddress;
    }

    const trustedForwarded = firstForwardedAddress(
      c.req.header("x-forwarded-for") ??
        c.req.raw.headers.get("x-forwarded-for"),
    );

    if (trustedForwarded) {
      rateLimitLogger.debug(
        {
          clientId: trustedForwarded,
          proxyIp: internalAddress,
        },
        "Using forwarded client IP behind trusted proxy",
      );
      return trustedForwarded;
    }

    return internalAddress;
  }

  const forwarded = firstForwardedAddress(c.req.header("x-forwarded-for"));
  if (forwarded) {
    rateLimitLogger.warn(
      {
        endpoint: identifier ?? "unknown",
        forwarded,
      },
      "Falling back to x-forwarded-for header for rate limiting",
    );
    return forwarded;
  }

  const realIp = firstForwardedAddress(
    c.req.header("x-real-ip") ??
      c.req.header("cf-connecting-ip") ??
      c.req.header("fastly-client-ip") ??
      c.req.raw.headers.get("x-real-ip") ??
      c.req.raw.headers.get("cf-connecting-ip"),
  );
  if (realIp) {
    return realIp;
  }

  return "anonymous";
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

  const resolveKey =
    keyGenerator ??
    ((ctx: Context) => extractClientIdentifier(ctx, identifier));

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
