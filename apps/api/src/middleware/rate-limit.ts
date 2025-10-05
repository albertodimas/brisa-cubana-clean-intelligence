import type { Context, Next } from "hono";
import type Redis from "ioredis";
import { logger } from "../lib/logger";
import { getRedisClient } from "../lib/redis";
import {
  rateLimitStorage,
  rateLimitHitsTotal,
  rateLimitExceededTotal,
  rateLimitFallbackTotal,
  rateLimitRedisErrorsTotal,
} from "../lib/metrics";

type RateLimitStore = Record<
  string,
  {
    count: number;
    resetTime: number;
  }
>;

// In-memory fallback store (single-instance only)
const store: RateLimitStore = {};
const metricsEnabled = process.env.NODE_ENV !== "test";

export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  max: number; // Max requests per window
  message?: string; // Custom error message
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
  keyGenerator?: (c: Context) => string; // Custom key generator
}

/**
 * Rate limiting middleware for Hono
 *
 * @example
 * ```typescript
 * import { rateLimiter } from "./middleware/rate-limit";
 *
 * // Apply to all routes
 * app.use("*", rateLimiter({ windowMs: 15 * 60 * 1000, max: 100 }));
 *
 * // Apply to specific routes
 * app.post("/api/auth/login", rateLimiter({ windowMs: 15 * 60 * 1000, max: 5 }));
 * ```
 */
export function rateLimiter(
  options: RateLimitOptions,
): (c: Context, next: Next) => Promise<Response | void> {
  const {
    windowMs,
    max,
    message = "Too many requests, please try again later.",
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    keyGenerator = defaultKeyGenerator,
  } = options;

  return async (c: Context, next: Next) => {
    const disableForTestEnv =
      process.env.NODE_ENV === "test" &&
      process.env.ENABLE_RATE_LIMITING !== "true";

    if (process.env.ENABLE_RATE_LIMITING === "false" || disableForTestEnv) {
      return next();
    }

    const key = keyGenerator(c);
    const redisClient = getRedisClient();
    let fallbackReason: "redis_error" | "no_client" | null = null;

    if (redisClient) {
      setRateLimitBackend("redis");
      try {
        return await handleWithRedis(
          redisClient,
          key,
          {
            windowMs,
            max,
            message,
            skipSuccessfulRequests,
            skipFailedRequests,
          },
          c,
          next,
        );
      } catch (error) {
        fallbackReason = "redis_error";
        if (metricsEnabled) {
          const labelledError = error as { code?: unknown } | undefined;
          const reasonLabel =
            typeof labelledError?.code === "string"
              ? labelledError.code
              : error instanceof Error
                ? error.name
                : "redis_error";
          rateLimitRedisErrorsTotal.inc({ reason: reasonLabel });
        }
        logger.warn(
          { error },
          "Redis rate limiter failed, falling back to in-memory store",
        );
      }
    } else {
      fallbackReason = "no_client";
    }

    if (metricsEnabled) {
      rateLimitFallbackTotal.inc({ reason: fallbackReason });
    }

    setRateLimitBackend("memory");
    return handleWithMemory(
      key,
      {
        windowMs,
        max,
        message,
        skipSuccessfulRequests,
        skipFailedRequests,
      },
      c,
      next,
    );
  };
}

/**
 * Default key generator: uses IP address
 */
function defaultKeyGenerator(c: Context): string {
  // Try to get real IP from headers (behind proxy)
  const forwarded = c.req.header("x-forwarded-for");
  const realIp = c.req.header("x-real-ip");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  // Fallback to direct connection IP
  return "unknown";
}

/**
 * Key generator by user ID (for authenticated routes)
 */
export function userKeyGenerator(c: Context): string {
  // Assuming auth middleware sets c.get("user")
  const user = c.get("user") as { sub?: string } | undefined;
  if (user?.sub) {
    return `user:${user.sub}`;
  }
  return defaultKeyGenerator(c);
}

/**
 * Cleanup expired records periodically
 */
export function cleanupRateLimitStore() {
  const now = Date.now();
  for (const key in store) {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  }
}

/**
 * Clear all rate limit records (for testing purposes)
 */
export function clearRateLimitStore() {
  for (const key in store) {
    delete store[key];
  }
}

// Run cleanup every 10 minutes
setInterval(cleanupRateLimitStore, 10 * 60 * 1000);

/**
 * Predefined rate limit configurations
 */
export const RateLimits = {
  /**
   * Strict rate limit for authentication endpoints
   * 3 requests per 15 minutes (reduced from 5 for security)
   */
  auth: {
    windowMs: 15 * 60 * 1000,
    max: 3,
    message: "Too many login attempts, please try again in 15 minutes.",
    skipSuccessfulRequests: true,
  } as const,

  /**
   * Standard rate limit for API endpoints
   * 100 requests per 15 minutes
   */
  api: {
    windowMs: 15 * 60 * 1000,
    max: 100,
  } as const,

  /**
   * Strict rate limit for write operations
   * 20 requests per 15 minutes
   */
  write: {
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: "Too many write requests, please slow down.",
    skipFailedRequests: true,
  } as const,

  /**
   * Lenient rate limit for read operations
   * 300 requests per 15 minutes
   */
  read: {
    windowMs: 15 * 60 * 1000,
    max: 300,
  } as const,
};

interface ResolvedOptions {
  windowMs: number;
  max: number;
  message: string;
  skipSuccessfulRequests: boolean;
  skipFailedRequests: boolean;
}

async function handleWithMemory(
  key: string,
  options: ResolvedOptions,
  c: Context,
  next: Next,
): Promise<Response | void> {
  const { windowMs, max, message, skipSuccessfulRequests, skipFailedRequests } =
    options;
  const now = Date.now();

  if (!store[key] || store[key].resetTime < now) {
    store[key] = {
      count: 0,
      resetTime: now + windowMs,
    };
  }

  const record = store[key];

  if (metricsEnabled) {
    rateLimitHitsTotal.inc({ endpoint: key });
  }

  if (record.count >= max) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    applyHeaders(c, max, 0, record.resetTime - now, retryAfter);
    if (metricsEnabled) {
      rateLimitExceededTotal.inc({ endpoint: key });
    }
    return c.json(
      {
        error: message,
        retryAfter,
      },
      429,
    );
  }

  if (!skipSuccessfulRequests && !skipFailedRequests) {
    record.count++;
  }

  applyHeaders(c, max, max - record.count, record.resetTime - now);

  await next();

  const statusCode = c.res.status;
  const isSuccessful = statusCode < 400;
  const isFailed = statusCode >= 400;

  if (skipSuccessfulRequests && !skipFailedRequests && !isSuccessful) {
    record.count++;
  } else if (skipFailedRequests && !skipSuccessfulRequests && !isFailed) {
    record.count++;
  }
}

async function handleWithRedis(
  redis: Redis,
  key: string,
  options: ResolvedOptions,
  c: Context,
  next: Next,
): Promise<Response | void> {
  const { windowMs, max, message, skipSuccessfulRequests, skipFailedRequests } =
    options;

  const redisKey = buildRedisKey(windowMs, key);

  if (!skipSuccessfulRequests && !skipFailedRequests) {
    if (metricsEnabled) {
      rateLimitHitsTotal.inc({ endpoint: key });
    }
    const count = await incrementRedis(redis, redisKey, windowMs);
    const ttlMs = await ensureTtl(redis, redisKey, windowMs);

    if (count > max) {
      const retryAfter = Math.ceil(ttlMs / 1000);
      applyHeaders(c, max, 0, ttlMs, retryAfter);
      if (metricsEnabled) {
        rateLimitExceededTotal.inc({ endpoint: key });
      }
      return c.json(
        {
          error: message,
          retryAfter,
        },
        429,
      );
    }

    applyHeaders(c, max, max - count, ttlMs);
    await next();
    return;
  }

  const { currentCount, ttlMs } = await getRedisState(
    redis,
    redisKey,
    windowMs,
  );

  if (currentCount >= max) {
    const retryAfter = Math.ceil(ttlMs / 1000);
    applyHeaders(c, max, 0, ttlMs, retryAfter);
    if (metricsEnabled) {
      rateLimitExceededTotal.inc({ endpoint: key });
    }
    return c.json(
      {
        error: message,
        retryAfter,
      },
      429,
    );
  }

  if (metricsEnabled) {
    rateLimitHitsTotal.inc({ endpoint: key });
  }

  applyHeaders(c, max, max - currentCount, ttlMs);

  await next();

  const statusCode = c.res.status;
  const isSuccessful = statusCode < 400;
  const isFailed = statusCode >= 400;

  if (skipSuccessfulRequests && !skipFailedRequests && !isSuccessful) {
    await incrementRedis(redis, redisKey, windowMs);
  } else if (skipFailedRequests && !skipSuccessfulRequests && !isFailed) {
    await incrementRedis(redis, redisKey, windowMs);
  }
}

function buildRedisKey(windowMs: number, key: string): string {
  return `rate:${windowMs}:${key}`;
}

async function incrementRedis(redis: Redis, key: string, windowMs: number) {
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.pexpire(key, windowMs);
  }
  return count;
}

async function ensureTtl(redis: Redis, key: string, windowMs: number) {
  let ttlMs = await redis.pttl(key);
  if (ttlMs === -1 || ttlMs === -2 || ttlMs < 0) {
    await redis.pexpire(key, windowMs);
    ttlMs = windowMs;
  }
  return ttlMs;
}

async function getRedisState(redis: Redis, key: string, windowMs: number) {
  const multiResult = await redis.multi().pttl(key).get(key).exec();

  if (!multiResult) {
    return { currentCount: 0, ttlMs: windowMs };
  }

  const ttlResult = multiResult[0]?.[1];
  const valueResult = multiResult[1]?.[1];

  let ttlMs = typeof ttlResult === "number" ? ttlResult : Number(ttlResult);
  if (!Number.isFinite(ttlMs) || ttlMs === -1 || ttlMs === -2 || ttlMs < 0) {
    ttlMs = windowMs;
  }

  const currentCount = valueResult ? Number(valueResult) : 0;

  if (currentCount === 0) {
    // Ensure TTL exists for future increments
    await redis.pexpire(key, windowMs);
  }

  return { currentCount, ttlMs };
}

function applyHeaders(
  c: Context,
  limit: number,
  remaining: number,
  ttlMs: number,
  retryAfterSeconds?: number,
) {
  c.header("X-RateLimit-Limit", limit.toString());
  c.header("X-RateLimit-Remaining", Math.max(remaining, 0).toString());
  const resetDate = new Date(Date.now() + Math.max(ttlMs, 0));
  c.header("X-RateLimit-Reset", resetDate.toISOString());

  if (retryAfterSeconds !== undefined) {
    c.header("Retry-After", Math.max(retryAfterSeconds, 0).toString());
  }
}
function setRateLimitBackend(backend: "redis" | "memory") {
  if (!metricsEnabled) {
    return;
  }
  rateLimitStorage.set({ backend: "redis" }, backend === "redis" ? 1 : 0);
  rateLimitStorage.set({ backend: "memory" }, backend === "memory" ? 1 : 0);
}
