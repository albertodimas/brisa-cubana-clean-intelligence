import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN;
const enabled = Boolean(dsn);
const environment =
  process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ??
  process.env.SENTRY_ENVIRONMENT ??
  process.env.NODE_ENV ??
  "development";

const tracesSampleRate = Number(
  process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ??
    process.env.SENTRY_TRACES_SAMPLE_RATE ??
    (process.env.NODE_ENV === "production" ? "0.1" : "1.0"),
);

Sentry.init({
  dsn: dsn || undefined,
  enabled,
  environment,
  tracesSampleRate: Number.isNaN(tracesSampleRate) ? 0 : tracesSampleRate,
  profilesSampleRate: 0,
  debug: process.env.NODE_ENV === "development",
});
