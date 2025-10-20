const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN;
const enabled =
  typeof window !== "undefined" &&
  Boolean(dsn) &&
  process.env.NODE_ENV !== "test";
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

async function bootstrapSentry() {
  const Sentry = await import("@sentry/nextjs");
  Sentry.init({
    dsn: dsn || undefined,
    enabled: true,
    environment,
    tracesSampleRate: Number.isNaN(tracesSampleRate) ? 0 : tracesSampleRate,
    profilesSampleRate: 0,
    debug: process.env.NODE_ENV === "development",
  });
}

if (enabled) {
  const load = () => {
    bootstrapSentry().catch((error) => {
      if (process.env.NODE_ENV === "development") {
        console.warn("[Sentry] failed to initialize", error);
      }
    });
  };

  const idle = (
    window as typeof window & {
      requestIdleCallback?: (cb: IdleRequestCallback) => number;
    }
  ).requestIdleCallback;

  if (typeof idle === "function") {
    idle(() => load());
  } else {
    setTimeout(load, 0);
  }
}

export {};
