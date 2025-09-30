import type { Context, Next } from "hono";

type RateLimitStore = Record<
  string,
  {
    count: number;
    resetTime: number;
  }
>;

// In-memory store (use Redis in production for multi-instance deployments)
const store: RateLimitStore = {};

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
export function rateLimiter(options: RateLimitOptions) {
  const {
    windowMs,
    max,
    message = "Too many requests, please try again later.",
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    keyGenerator = defaultKeyGenerator,
  } = options;

  return async (c: Context, next: Next) => {
    // Skip if rate limiting is disabled
    if (process.env.ENABLE_RATE_LIMITING === "false") {
      return next();
    }

    const key = keyGenerator(c);
    const now = Date.now();

    // Initialize or retrieve rate limit data
    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 0,
        resetTime: now + windowMs,
      };
    }

    const record = store[key];

    // Check if limit exceeded
    if (record.count >= max) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);

      c.header("Retry-After", retryAfter.toString());
      c.header("X-RateLimit-Limit", max.toString());
      c.header("X-RateLimit-Remaining", "0");
      c.header("X-RateLimit-Reset", new Date(record.resetTime).toISOString());

      return c.json(
        {
          error: message,
          retryAfter,
        },
        429,
      );
    }

    // Increment counter (before request if not skipping)
    if (!skipSuccessfulRequests && !skipFailedRequests) {
      record.count++;
    }

    // Set rate limit headers
    c.header("X-RateLimit-Limit", max.toString());
    c.header("X-RateLimit-Remaining", (max - record.count).toString());
    c.header("X-RateLimit-Reset", new Date(record.resetTime).toISOString());

    await next();

    // Update counter after request if skipping certain statuses
    const statusCode = c.res.status;
    const isSuccessful = statusCode < 400;
    const isFailed = statusCode >= 400;

    if (skipSuccessfulRequests && !skipFailedRequests && !isSuccessful) {
      record.count++;
    } else if (skipFailedRequests && !skipSuccessfulRequests && !isFailed) {
      record.count++;
    }
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

// Run cleanup every 10 minutes
setInterval(cleanupRateLimitStore, 10 * 60 * 1000);

/**
 * Predefined rate limit configurations
 */
export const RateLimits = {
  /**
   * Strict rate limit for authentication endpoints
   * 5 requests per 15 minutes
   */
  auth: {
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: "Too many login attempts, please try again in 15 minutes.",
    skipSuccessfulRequests: true,
  },

  /**
   * Standard rate limit for API endpoints
   * 100 requests per 15 minutes
   */
  api: {
    windowMs: 15 * 60 * 1000,
    max: 100,
  },

  /**
   * Strict rate limit for write operations
   * 20 requests per 15 minutes
   */
  write: {
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: "Too many write requests, please slow down.",
  },

  /**
   * Lenient rate limit for read operations
   * 300 requests per 15 minutes
   */
  read: {
    windowMs: 15 * 60 * 1000,
    max: 300,
  },
};
