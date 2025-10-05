import { serve } from "@hono/node-server";
import { app } from "./app";
import { initializeOpenTelemetry } from "./lib/observability";
import { validateEnv } from "./lib/env";
import { logger } from "./lib/logger";

// Validate environment variables first (fail-fast if missing critical vars)
try {
  validateEnv();
} catch {
  logger.error("Failed to start server: invalid environment configuration");
  process.exit(1);
}

// Initialize OpenTelemetry before starting server
// This must be done before any other imports to ensure instrumentation works
initializeOpenTelemetry();

// Server configuration for Docker deployment
const port = Number.parseInt(
  process.env.API_PORT ?? process.env.PORT ?? "3001",
  10,
);

serve(
  {
    fetch: app.fetch,
    port,
    hostname: "0.0.0.0", // Listen on all network interfaces for Docker
  },
  (info) => {
    console.log(
      `API ready on http://localhost:${info.port} (pid ${process.pid}, env ${process.env.NODE_ENV ?? "development"})`,
    );
    console.log(
      `Metrics: http://localhost:9464/metrics (Prometheus scrape endpoint)`,
    );
    const otlpEndpoint = process.env.OTLP_ENDPOINT;
    const tracingTarget =
      otlpEndpoint && otlpEndpoint.trim().length > 0
        ? otlpEndpoint
        : "Console only (set OTLP_ENDPOINT for external collector)";
    console.log(`Tracing: ${tracingTarget}`);
  },
);
