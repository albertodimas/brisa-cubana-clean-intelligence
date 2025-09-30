/**
 * Prometheus metrics for observability
 */
import {
  Counter,
  Gauge,
  Histogram,
  Registry,
  collectDefaultMetrics,
} from "prom-client";

// Create a new registry
export const register = new Registry();

// Collect default metrics (CPU, memory, event loop, etc.)
collectDefaultMetrics({
  register,
  prefix: "brisa_api_",
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
});

/**
 * HTTP Metrics
 */

// HTTP request duration histogram
export const httpRequestDuration = new Histogram({
  name: "brisa_api_http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.001, 0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

// HTTP request counter
export const httpRequestTotal = new Counter({
  name: "brisa_api_http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

// HTTP requests in flight
export const httpRequestsInFlight = new Gauge({
  name: "brisa_api_http_requests_in_flight",
  help: "Number of HTTP requests currently being processed",
  labelNames: ["method", "route"],
  registers: [register],
});

/**
 * Business Metrics
 */

// Booking metrics
export const bookingsCreatedTotal = new Counter({
  name: "brisa_api_bookings_created_total",
  help: "Total number of bookings created",
  labelNames: ["status"],
  registers: [register],
});

export const bookingsActiveGauge = new Gauge({
  name: "brisa_api_bookings_active",
  help: "Number of active bookings (PENDING, CONFIRMED, IN_PROGRESS)",
  registers: [register],
});

// User metrics
export const usersRegisteredTotal = new Counter({
  name: "brisa_api_users_registered_total",
  help: "Total number of registered users",
  labelNames: ["role"],
  registers: [register],
});

export const usersActiveGauge = new Gauge({
  name: "brisa_api_users_active",
  help: "Number of active users",
  labelNames: ["role"],
  registers: [register],
});

// Payment metrics
export const paymentsProcessedTotal = new Counter({
  name: "brisa_api_payments_processed_total",
  help: "Total number of payments processed",
  labelNames: ["status"],
  registers: [register],
});

export const paymentsAmountTotal = new Counter({
  name: "brisa_api_payments_amount_total_cents",
  help: "Total amount of payments in cents",
  labelNames: ["status"],
  registers: [register],
});

// Error metrics
export const errorsTotal = new Counter({
  name: "brisa_api_errors_total",
  help: "Total number of errors",
  labelNames: ["type", "code"],
  registers: [register],
});

/**
 * Database Metrics
 */

// Database query duration
export const dbQueryDuration = new Histogram({
  name: "brisa_api_db_query_duration_seconds",
  help: "Duration of database queries in seconds",
  labelNames: ["operation", "model"],
  buckets: [0.001, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

// Database connections
export const dbConnectionsActive = new Gauge({
  name: "brisa_api_db_connections_active",
  help: "Number of active database connections",
  registers: [register],
});

/**
 * Rate Limiting Metrics
 */

export const rateLimitHitsTotal = new Counter({
  name: "brisa_api_rate_limit_hits_total",
  help: "Total number of rate limit hits",
  labelNames: ["endpoint"],
  registers: [register],
});

export const rateLimitExceededTotal = new Counter({
  name: "brisa_api_rate_limit_exceeded_total",
  help: "Total number of requests that exceeded rate limits",
  labelNames: ["endpoint"],
  registers: [register],
});

/**
 * Helper functions
 */

/**
 * Record HTTP request metrics
 */
export function recordHttpRequest(
  method: string,
  route: string,
  statusCode: number,
  duration: number,
) {
  httpRequestTotal.inc({ method, route, status_code: statusCode });
  httpRequestDuration.observe(
    { method, route, status_code: statusCode },
    duration,
  );
}

/**
 * Record error metrics
 */
export function recordError(type: string, code: string) {
  errorsTotal.inc({ type, code });
}

/**
 * Update active bookings gauge
 */
export function updateBookingsGauge(count: number) {
  bookingsActiveGauge.set(count);
}

/**
 * Update active users gauge
 */
export function updateUsersGauge(role: string, count: number) {
  usersActiveGauge.set({ role }, count);
}
