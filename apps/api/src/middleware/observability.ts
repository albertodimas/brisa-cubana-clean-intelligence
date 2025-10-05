/**
 * Observability Middleware
 *
 * Integrates OpenTelemetry tracing and Prometheus metrics into Hono app
 *
 * Features:
 * - Distributed tracing with correlation IDs
 * - Automatic HTTP metrics (RED: Rate, Errors, Duration)
 * - Request/response logging
 *
 * References:
 * - @hono/otel: https://www.npmjs.com/package/@hono/otel
 * - @hono/prometheus: https://www.npmjs.com/package/@hono/prometheus
 *
 * Consulted: October 2, 2025
 */

import { MiddlewareHandler } from "hono";
import { otel } from "@hono/otel";
import { prometheus } from "@hono/prometheus";
import {
  extractCorrelationId,
  generateCorrelationId,
  logStructured,
} from "../lib/observability";

/**
 * OpenTelemetry tracing middleware
 *
 * Automatically creates spans for all HTTP requests
 * Propagates W3C Trace Context headers
 */
export const tracingMiddleware = otel();

/**
 * Prometheus metrics middleware
 *
 * Tracks:
 * - http_requests_total (counter)
 * - http_request_duration_seconds (histogram)
 * - http_requests_in_progress (gauge)
 */
export const metricsMiddleware = prometheus();

/**
 * Correlation ID middleware
 *
 * Adds correlation ID to request context for distributed tracing
 * - Extracts from headers if present
 * - Generates new UUID if missing
 * - Adds to response headers for client tracking
 */
export const correlationIdMiddleware: MiddlewareHandler = async (c, next) => {
  const incomingCorrelationId = extractCorrelationId(c.req.header());
  const correlationId = incomingCorrelationId ?? generateCorrelationId();

  // Store in context for downstream handlers
  c.set("correlationId", correlationId);

  // Add to response headers
  c.header("X-Correlation-ID", correlationId);

  await next();
};

/**
 * Request logging middleware
 *
 * Logs all HTTP requests with structured format
 * Includes:
 * - Method, path, status
 * - Duration (ms)
 * - Correlation ID
 * - User ID (if authenticated)
 */
export const requestLoggingMiddleware: MiddlewareHandler = async (c, next) => {
  const startTime = Date.now();
  const method = c.req.method;
  const path = c.req.path;
  const correlationId = c.get("correlationId") as string | undefined;

  // Execute request
  await next();

  const duration = Date.now() - startTime;
  const status = c.res.status;
  const userId = (c.get("userId") as string | undefined) ?? null; // From auth middleware

  // Determine log level based on status code
  const level = status >= 500 ? "error" : status >= 400 ? "warn" : "info";

  // Structured log
  logStructured(level, "HTTP Request", {
    correlationId,
    method,
    path,
    status,
    duration,
    userId,
    userAgent: c.req.header("user-agent"),
    ip:
      c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip") ?? undefined,
  });
};

/**
 * Error tracking middleware
 *
 * Captures unhandled errors and logs with full context
 */
export const errorTrackingMiddleware: MiddlewareHandler = async (c, next) => {
  try {
    await next();
  } catch (error) {
    const correlationId = c.get("correlationId") as string | undefined;

    logStructured("error", "Unhandled Error", {
      correlationId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      method: c.req.method,
      path: c.req.path,
      userId: c.get("userId") as string | undefined,
    });

    // Re-throw for Hono's error handler
    throw error;
  }
};

/**
 * Performance monitoring middleware
 *
 * Tracks slow requests and logs warnings
 * Threshold: 1000ms (1 second)
 */
export const performanceMonitoringMiddleware: MiddlewareHandler = async (
  c,
  next,
) => {
  const startTime = Date.now();

  await next();

  const duration = Date.now() - startTime;
  // Import from constants to avoid magic number
  const SLOW_REQUEST_THRESHOLD = 1000; // 1 second

  if (duration > SLOW_REQUEST_THRESHOLD) {
    const correlationId = c.get("correlationId") as string | undefined;

    logStructured("warn", "Slow Request Detected", {
      correlationId,
      method: c.req.method,
      path: c.req.path,
      duration,
      threshold: SLOW_REQUEST_THRESHOLD,
      // Add query params (sanitized)
      query: Object.keys(c.req.query()).length > 0 ? "present" : "none",
    });
  }
};
