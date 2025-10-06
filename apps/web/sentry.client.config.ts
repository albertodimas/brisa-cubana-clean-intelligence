import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment:
      process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,

    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

    integrations: [
      Sentry.replayIntegration({
        // Mask all text content
        maskAllText: true,
        // Block all media (images, videos, etc.)
        blockAllMedia: true,
      }),
      Sentry.browserTracingIntegration(),
      Sentry.browserProfilingIntegration(),
    ],

    // Enhanced error context
    beforeSend(event, hint) {
      // Don't send errors in development
      if (process.env.NODE_ENV === "development") {
        return null;
      }

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
      // Browser errors
      "ResizeObserver loop limit exceeded",
      "Non-Error promise rejection captured",
      // Network errors
      "Failed to fetch",
      "NetworkError",
      "Load failed",
      // React hydration errors (often transient)
      "Hydration failed",
      "Text content does not match",
    ],

    // Set release version (should be set via CI/CD)
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,

    // Enable debug mode in development
    debug: process.env.NODE_ENV === "development",
  });
}
