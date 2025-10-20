import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;
const enabled = Boolean(dsn);
const environment =
  process.env.SENTRY_ENVIRONMENT ??
  process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ??
  process.env.NODE_ENV ??
  "development";

const tracesSampleRate = Number(
  process.env.SENTRY_TRACES_SAMPLE_RATE ??
    process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ??
    (process.env.NODE_ENV === "production" ? "0.1" : "1.0"),
);

const profilesSampleRate = Number(
  process.env.SENTRY_PROFILES_SAMPLE_RATE ??
    process.env.NEXT_PUBLIC_SENTRY_PROFILES_SAMPLE_RATE ??
    (process.env.NODE_ENV === "production" ? "0.1" : "1.0"),
);

Sentry.init({
  dsn: dsn || undefined,
  enabled,
  environment,
  tracesSampleRate: Number.isNaN(tracesSampleRate) ? 0 : tracesSampleRate,
  profilesSampleRate: Number.isNaN(profilesSampleRate) ? 0 : profilesSampleRate,
  debug: process.env.NODE_ENV === "development",
});
