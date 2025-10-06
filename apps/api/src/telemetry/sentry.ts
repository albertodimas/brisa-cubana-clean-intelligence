import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

const dsn = process.env.SENTRY_DSN;
const environment =
  process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? "development";
const enabled = Boolean(dsn);

// Initialize Sentry if DSN is configured and not already initialized
if (enabled && !Sentry.getClient()) {
  Sentry.init({
    dsn: dsn!,
    environment,

    // Performance Monitoring
    tracesSampleRate: environment === "production" ? 0.05 : 1.0,

    // Profiling (requires @sentry/profiling-node)
    profilesSampleRate: environment === "production" ? 0.05 : 1.0,
    integrations: [
      // Add profiling integration for performance insights
      nodeProfilingIntegration(),
    ],

    // Enhanced error context
    beforeSend(event, hint) {
      // Don't send errors in test environment
      if (process.env.NODE_ENV === "test") {
        return null;
      }

      // Add server context
      event.server_name = process.env.SERVICE_NAME ?? "brisa-api";

      // Sanitize sensitive data
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }

      return event;
    },

    // Filter out noise
    ignoreErrors: [
      // Browser errors (shouldn't happen on backend, but just in case)
      "ResizeObserver loop limit exceeded",
      "Non-Error promise rejection captured",
      // Network errors that are expected
      "ECONNREFUSED",
      "ENOTFOUND",
      // Client errors we don't need to track
      "Bad Request",
      "Unauthorized",
      "Forbidden",
    ],

    // Enable debug mode in development
    debug: environment === "development",

    // Set release version (should be set via CI/CD)
    release: process.env.SENTRY_RELEASE,
  });
}

export { Sentry, enabled as sentryEnabled };
