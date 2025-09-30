import type { Context, Next } from "hono";
import { logger } from "../lib/logger";

/**
 * Logging middleware for HTTP requests
 * Logs request/response with timing information
 */
export async function requestLogger(c: Context, next: Next) {
  const start = Date.now();
  const { method, url } = c.req;

  // Generate request ID for tracing
  const requestId =
    c.req.header("x-request-id") ||
    `req_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

  // Add request ID to context for use in handlers
  c.set("requestId", requestId);

  // Log incoming request
  logger.info(
    {
      requestId,
      method,
      url,
      userAgent: c.req.header("user-agent"),
      ip:
        c.req.header("x-forwarded-for") ||
        c.req.header("x-real-ip") ||
        "unknown",
    },
    "Incoming request",
  );

  try {
    await next();

    // Log successful response
    const duration = Date.now() - start;
    const status = c.res.status;

    logger.info(
      {
        requestId,
        method,
        url,
        status,
        duration: `${duration}ms`,
      },
      "Request completed",
    );
  } catch (error) {
    // Log error response
    const duration = Date.now() - start;

    logger.error(
      {
        requestId,
        method,
        url,
        duration: `${duration}ms`,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      "Request failed",
    );

    throw error; // Re-throw to be handled by error handler
  }
}

/**
 * Add request context to logger
 * Use this in route handlers to include request context in logs
 */
export function getRequestLogger(c: Context) {
  const requestId = c.get("requestId") as string | undefined;
  return logger.child({
    requestId,
    path: c.req.path,
    method: c.req.method,
  });
}
