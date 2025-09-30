import { Hono } from "hono";
import { cors } from "hono/cors";
import services from "./routes/services";
import bookings from "./routes/bookings";
import users from "./routes/users";
import auth from "./routes/auth";
import payments from "./routes/payments";
import alerts from "./routes/alerts";
import notes from "./routes/reconciliation";
import reports from "./routes/reports";
import health from "./routes/health";
import metrics from "./routes/metrics";
import { Sentry, sentryEnabled } from "./telemetry/sentry";
import { rateLimiter, RateLimits } from "./middleware/rate-limit";
import { requestLogger } from "./middleware/logger";
import { metricsMiddleware } from "./middleware/metrics";
import { logger } from "./lib/logger";
import { isAppError } from "./lib/errors";

export const app = new Hono();

// Middleware (order matters!)
app.use("*", requestLogger); // Logging first
app.use("*", metricsMiddleware); // Metrics second (after logging)
app.use(
  "*",
  cors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
    credentials: true,
  }),
);

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
app.route("/api/users", users);
app.route("/api/auth", auth);
app.route("/api/payments", payments);
app.route("/api/alerts", alerts);
app.route("/api/reconciliation", notes);
app.route("/api/reports", reports);

// 404 handler
app.notFound((c) => c.json({ error: "Not found" }, 404));

// Error handler
app.onError((err, c) => {
  const requestId = c.get("requestId") ?? "unknown";

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
