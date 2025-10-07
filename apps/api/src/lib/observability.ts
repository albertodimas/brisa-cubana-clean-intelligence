/**
 * Observability Module - OpenTelemetry + Prometheus Integration
 *
 * Implements comprehensive observability with:
 * - Distributed tracing (OpenTelemetry)
 * - Metrics collection (Prometheus)
 * - Structured logging with correlation IDs
 *
 * References:
 * - OpenTelemetry Hono: https://www.npmjs.com/package/@hono/otel
 * - Prometheus Hono: https://www.npmjs.com/package/@hono/prometheus
 * - OpenTelemetry Node.js: https://opentelemetry.io/docs/languages/js/getting-started/nodejs/
 *
 * Consulted: October 2, 2025
 */

import { randomUUID } from "node:crypto";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { PrometheusExporter } from "@opentelemetry/exporter-prometheus";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import {
  defaultResource,
  resourceFromAttributes,
} from "@opentelemetry/resources";
import {
  SEMRESATTRS_SERVICE_NAME,
  SEMRESATTRS_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";
import { logger } from "./logger";

// Initialize OpenTelemetry SDK
let sdk: NodeSDK | null = null;

type HeaderRecord = Record<string, string>;

function parseOtlpHeaders(value: string | undefined): HeaderRecord {
  if (!value) {
    return {};
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return Object.entries(parsed).reduce<HeaderRecord>((acc, [key, val]) => {
        if (typeof val === "string") {
          acc[key] = val;
        }
        return acc;
      }, {});
    }
  } catch (error) {
    logger.warn(
      { error: error instanceof Error ? error.message : "unknown" },
      "[OpenTelemetry] Invalid OTLP_HEADERS value ignored",
    );
  }

  return {};
}

function resolveMetricsPort(): number {
  const envPort = process.env.PROMETHEUS_PORT;
  if (envPort) {
    const parsed = Number(envPort);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return 9464;
}

/**
 * Initialize OpenTelemetry instrumentation
 *
 * Sets up:
 * - Automatic instrumentation for Node.js modules
 * - Prometheus metrics exporter
 * - OTLP trace exporter (if configured)
 * - Service resource attributes
 */
export function initializeOpenTelemetry() {
  // Skip initialization if already done or in test environment
  if (sdk || process.env.NODE_ENV === "test") {
    return;
  }

  // Prometheus metrics exporter (port 9464 by default)
  const prometheusExporter = new PrometheusExporter({
    port: resolveMetricsPort(),
  });

  // OTLP trace exporter configuration (optional - for external collectors)
  const otlpExporter = process.env.OTLP_ENDPOINT
    ? new OTLPTraceExporter({
        url: process.env.OTLP_ENDPOINT,
        headers: parseOtlpHeaders(process.env.OTLP_HEADERS),
      })
    : undefined;

  // Service resource attributes
  const resource = defaultResource().merge(
    resourceFromAttributes({
      [SEMRESATTRS_SERVICE_NAME]: process.env.SERVICE_NAME ?? "brisa-api",
      [SEMRESATTRS_SERVICE_VERSION]: process.env.npm_package_version ?? "1.0.0",
      environment: process.env.NODE_ENV ?? "development",
      "deployment.environment":
        process.env.RAILWAY_ENVIRONMENT ?? process.env.VERCEL_ENV ?? "local",
    }),
  );

  // Initialize OpenTelemetry SDK
  sdk = new NodeSDK({
    resource,
    metricReader: prometheusExporter,
    traceExporter: otlpExporter,
    instrumentations: [
      getNodeAutoInstrumentations({
        // Disable noisy instrumentations
        "@opentelemetry/instrumentation-fs": {
          enabled: false,
        },
        // Configure HTTP instrumentation
        "@opentelemetry/instrumentation-http": {
          enabled: true,
          ignoreIncomingRequestHook: (req) => {
            const ignorePaths = [
              "/healthz",
              "/metrics",
              "/health/ready",
              "/health/live",
            ];
            return ignorePaths.some((path) => req.url?.includes(path));
          },
        },
        // Configure database instrumentation
        "@opentelemetry/instrumentation-pg": {
          enabled: true,
        },
      }),
    ],
  });

  // Start SDK
  sdk.start();

  const metricsPort = resolveMetricsPort();
  logger.info("[OpenTelemetry] Instrumentation initialized");
  logger.info(
    { port: metricsPort },
    `[Prometheus] Metrics available at http://localhost:${metricsPort}/metrics`,
  );

  // Graceful shutdown
  process.on("SIGTERM", () => {
    void (async () => {
      try {
        await sdk?.shutdown();
        logger.info("[OpenTelemetry] Shutdown complete");
      } catch (error) {
        logger.error(
          { error: error instanceof Error ? error.message : "unknown" },
          "[OpenTelemetry] Shutdown error",
        );
      }
    })();
  });
}

/**
 * Generate correlation ID for request tracing
 * Format: uuid-v4 or existing trace ID from headers
 */
export function generateCorrelationId(): string {
  return randomUUID();
}

/**
 * Extract correlation ID from request headers
 * Supports:
 * - X-Correlation-ID
 * - X-Request-ID
 * - traceparent (W3C Trace Context)
 */
export function extractCorrelationId(
  headers: Record<string, string | undefined>,
): string | null {
  const traceParentId = headers.traceparent?.split("-")[1];

  return (
    headers["x-correlation-id"] ??
    headers["x-request-id"] ??
    traceParentId ??
    null
  );
}

/**
 * Custom metrics helpers (Prometheus-compatible)
 *
 * These are exposed via @hono/prometheus middleware
 *
 * Metrics exposed:
 * - http_requests_total (counter)
 * - http_request_duration_seconds (histogram)
 * - http_requests_in_progress (gauge)
 */

/**
 * SLO (Service Level Objective) definitions
 *
 * Define target performance metrics for monitoring
 */
export const SLO_TARGETS = {
  // Availability: 99.9% uptime (allows 43 min downtime/month)
  availability: 0.999,

  // Latency: p95 < 500ms, p99 < 1000ms
  latency: {
    p95: 500, // milliseconds
    p99: 1000,
  },

  // Error rate: < 1% of requests
  errorRate: 0.01,

  // Database query time: p95 < 100ms
  dbQueryTime: {
    p95: 100,
  },
};

/**
 * Log structured event with correlation ID
 *
 * @param level - Log level (info, warn, error)
 * @param message - Log message
 * @param context - Additional context (correlationId, userId, etc.)
 */
export function logStructured(
  level: "info" | "warn" | "error",
  message: string,
  context: Record<string, unknown> = {},
) {
  logger[level](
    {
      service: process.env.SERVICE_NAME ?? "brisa-api",
      environment: process.env.NODE_ENV ?? "development",
      ...context,
    },
    message,
  );
}
