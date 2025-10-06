import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment:
      process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,

    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Profiling
    profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Enhanced error context
    beforeSend(event, hint) {
      // Don't send errors in development or test
      if (
        process.env.NODE_ENV === "development" ||
        process.env.NODE_ENV === "test"
      ) {
        return null;
      }

      // Add server context
      event.server_name = process.env.SERVICE_NAME ?? "brisa-web";

      // Sanitize sensitive data
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }

      // Add user context if available (without PII)
      if (event.user) {
        // Keep only non-PII user data
        event.user = {
          id: event.user.id,
        };
      }

      return event;
    },

    // Filter out noise
    ignoreErrors: [
      // Network errors
      "ECONNREFUSED",
      "ENOTFOUND",
      "ETIMEDOUT",
      // Client errors
      "Bad Request",
      "Unauthorized",
      "Forbidden",
    ],

    // Set release version (should be set via CI/CD)
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,

    // Enable debug mode in development
    debug: process.env.NODE_ENV === "development",
  });
}
