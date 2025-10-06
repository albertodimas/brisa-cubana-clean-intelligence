import type { Context } from "hono";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { compress } from "hono/compress";
import { secureHeaders } from "hono/secure-headers";
import services from "./routes/services";
import bookings from "./routes/bookings";
import properties from "./routes/properties";
import users from "./routes/users";
import auth from "./routes/auth";
import payments from "./routes/payments";
import alerts from "./routes/alerts";
import notes from "./routes/reconciliation";
import reports from "./routes/reports";
import concierge from "./routes/concierge";
import health from "./routes/health";
import metrics from "./routes/metrics";
import features from "./routes/features";
import sentryTest from "./routes/sentry-test";
import { Sentry, sentryEnabled } from "./telemetry/sentry";
import { rateLimiter, RateLimits } from "./middleware/rate-limit";
import { requestLogger } from "./middleware/logger";
import { metricsMiddleware } from "./middleware/metrics";
import { logger } from "./lib/logger";
import { isAppError } from "./lib/errors";
import {
  tracingMiddleware,
  correlationIdMiddleware,
  requestLoggingMiddleware,
  errorTrackingMiddleware,
  performanceMonitoringMiddleware,
} from "./middleware/observability";
import { nonceMiddleware } from "./middleware/csp-nonce";
import { buildAllowedOrigins, originMatcher } from "./lib/cors-origins";

export const app = new Hono();

// Middleware (order matters!)
// 1. Generate nonce for CSP (must be first to set context variable)
app.use("*", nonceMiddleware);

// 2. Security headers with dynamic CSP nonce
app.use("*", async (c, next) => {
  // Get nonce from context
  const nonce = c.get("nonce");

  // Apply secure headers with nonce-based CSP (removes unsafe-inline!)
  await secureHeaders({
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", `'nonce-${nonce}'`],
      styleSrc: ["'self'", `'nonce-${nonce}'`],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
    xFrameOptions: "DENY",
    xContentTypeOptions: "nosniff",
    referrerPolicy: "strict-origin-when-cross-origin",
    strictTransportSecurity: "max-age=31536000; includeSubDomains",
  })(c, next);
});

// 2. Compression (for all responses)
app.use("*", compress());

// 3. Observability stack (tracing, correlation, metrics)
app.use("*", tracingMiddleware); // OpenTelemetry tracing
app.use("*", correlationIdMiddleware); // Correlation IDs for distributed tracing
app.use("*", metricsMiddleware); // Legacy Prometheus metrics

// 4. Logging and monitoring
app.use("*", requestLogger); // Legacy logger (TODO: migrate to requestLoggingMiddleware)
app.use("*", requestLoggingMiddleware); // Structured logging with correlation IDs
app.use("*", performanceMonitoringMiddleware); // Slow request detection
app.use("*", errorTrackingMiddleware); // Error tracking

// Production-grade CORS configuration
// Security audit: FASE 3 - Explicit origins only (no wildcards with credentials)
// References:
// - https://hono.dev/docs/middleware/builtin/cors
// - https://app.studyraid.com/en/read/11303/352730/cors-configuration-in-hono
// - ~/.codex/cors-hardening-analysis.md (Codex GPT-5 audit)
// Consulted: 2025-10-02 (updated 2025-10-06)

const allowedOrigins = buildAllowedOrigins();

app.use(
  "*",
  cors({
    origin: originMatcher(allowedOrigins),
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
      "X-Requested-With",
      "If-Match",
      "If-None-Match",
    ],
    exposeHeaders: ["Content-Length", "Content-Type"],
    maxAge: process.env.NODE_ENV === "production" ? 86400 : 3600,
    credentials: true,
  }),
);

// Add Vary: Origin header for cache safety
app.use("*", async (c, next) => {
  await next();
  c.header("Vary", "Origin", { append: true });
});

// Apply global API rate limiting (can be overridden by specific routes)
app.use("/api/*", rateLimiter(RateLimits.api));

// Health checks
app.get("/", (c) =>
  c.json({
    service: "Brisa Cubana Clean Intelligence API",
    status: "ok",
    version: "0.1.0",
    timestamp: new Date().toISOString(),
  }),
);

// Mount health check routes
app.route("/health", health);

// Prometheus metrics endpoint
app.route("/metrics", metrics);

// Legacy health check endpoint (kept for backwards compatibility)
app.get("/healthz", (c) =>
  c.json({
    ok: true,
  }),
);

// API routes
app.route("/api/services", services);
app.route("/api/bookings", bookings);
app.route("/api/properties", properties);
app.route("/api/users", users);
app.route("/api/auth", auth);
app.route("/api/payments", payments);
app.route("/api/alerts", alerts);
app.route("/api/reconciliation", notes);
app.route("/api/reports", reports);
app.route("/api/concierge", concierge);
app.route("/api/features", features);

// Sentry test endpoints (dev/staging only)
app.route("/api/sentry", sentryTest);

// 404 handler
app.notFound((c) => c.json({ error: "Not found" }, 404));

// Error handler
app.onError((err, c: Context) => {
  const requestId = (c.get("requestId") as string | undefined) ?? "unknown";

  // Check if it's a known application error
  if (isAppError(err)) {
    logger.warn(
      {
        requestId,
        method: c.req.method,
        url: c.req.url,
        statusCode: err.statusCode,
        errorCode: err.code,
        error: err.message,
        details: err.details,
      },
      `Application error: ${err.code}`,
    );

    // Don't send 4xx errors to Sentry (they're client errors)
    if (err.statusCode >= 500 && sentryEnabled) {
      Sentry.captureException(err, {
        contexts: {
          request: {
            requestId,
            method: c.req.method,
            url: c.req.url,
          },
        },
      });
    }

    return c.json(err.toJSON(), err.statusCode as never);
  }

  // Unknown error - log with full stack and send to Sentry
  logger.error(
    {
      requestId,
      method: c.req.method,
      url: c.req.url,
      error: err.message,
      stack: err.stack,
    },
    "Unexpected error in request",
  );

  if (sentryEnabled) {
    Sentry.captureException(err, {
      contexts: {
        request: {
          requestId,
          method: c.req.method,
          url: c.req.url,
        },
      },
    });
  }

  // Don't expose internal error details to client
  return c.json(
    {
      error: "Internal server error",
      code: "INTERNAL_ERROR",
    },
    500,
  );
});
