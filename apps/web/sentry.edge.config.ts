import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment:
      process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,

    // Performance Monitoring (lower sample rate for edge)
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 1.0,

    // Enhanced error context
    beforeSend(event, hint) {
      // Don't send errors in development
      if (process.env.NODE_ENV === "development") {
        return null;
      }

      // Add edge runtime context
      event.server_name = "brisa-web-edge";

      // Sanitize sensitive data
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }

      return event;
    },

    // Filter out noise
    ignoreErrors: ["Network request failed", "Failed to fetch", "Load failed"],

    // Set release version (should be set via CI/CD)
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,

    // Enable debug mode in development
    debug: process.env.NODE_ENV === "development",
  });
}
