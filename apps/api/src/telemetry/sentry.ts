import * as Sentry from "@sentry/node";

const dsn = process.env.SENTRY_DSN;

const enabled = Boolean(dsn);

// Initialize Sentry if DSN is configured and not already initialized
if (enabled && !Sentry.getClient()) {
  Sentry.init({
    dsn: dsn!,
    environment:
      process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? "development",
    tracesSampleRate: 0.05,
  });
}

export { Sentry, enabled as sentryEnabled };
