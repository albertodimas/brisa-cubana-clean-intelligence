/**
 * Metrics middleware for HTTP request tracking
 */
import type { Context, Next } from "hono";
import {
  httpRequestsInFlight,
  recordHttpRequest,
  recordError,
} from "../lib/metrics";

/**
 * Middleware to collect HTTP metrics
 */
export async function metricsMiddleware(c: Context, next: Next) {
  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;

  // Extract route pattern (remove IDs and dynamic segments)
  const route = normalizeRoute(path);

  // Track in-flight requests
  httpRequestsInFlight.inc({ method, route });

  try {
    await next();

    // Record successful request
    const duration = (Date.now() - start) / 1000; // Convert to seconds
    const statusCode = c.res.status;
    recordHttpRequest(method, route, statusCode, duration);

    // Track errors by status code
    if (statusCode >= 400) {
      const errorType = statusCode >= 500 ? "server_error" : "client_error";
      recordError(errorType, statusCode.toString());
    }
  } catch (error) {
    // Record failed request
    const duration = (Date.now() - start) / 1000;
    recordHttpRequest(method, route, 500, duration);
    recordError("server_error", "500");

    throw error;
  } finally {
    // Decrement in-flight counter
    httpRequestsInFlight.dec({ method, route });
  }
}

/**
 * Normalize route path to a pattern
 * Replaces IDs with placeholders for better metric grouping
 */
function normalizeRoute(path: string): string {
  // Remove trailing slash
  path = path.replace(/\/$/, "");

  // Replace common ID patterns
  return (
    path
      // Replace UUIDs/CUIDs (e.g., /users/clx123abc -> /users/:id)
      .replace(/\/[a-z0-9]{20,}/gi, "/:id")
      // Replace numeric IDs (e.g., /users/123 -> /users/:id)
      .replace(/\/\d+/g, "/:id")
      // Replace query parameters
      .split("?")[0] || path
  );
}
