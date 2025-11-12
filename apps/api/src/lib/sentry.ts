import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

export function initSentry() {
  if (!process.env.SENTRY_DSN) {
    if (process.env.NODE_ENV === "production") {
      console.warn("SENTRY_DSN not configured, Sentry will not be initialized");
    }
    return;
  }

  let enableProfiling = process.env.SENTRY_ENABLE_PROFILING !== "false";
  const integrations = [];
  if (enableProfiling) {
    try {
      integrations.push(nodeProfilingIntegration());
    } catch (error) {
      console.warn(
        "[sentry] node profiling integration disabled:",
        (error as Error).message,
      );
      enableProfiling = false;
    }
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",

    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Set sampling rate for profiling (requires add-on package)
    profilesSampleRate:
      enableProfiling && process.env.NODE_ENV === "production" ? 0.1 : 0,

    integrations,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,

    // Enable capturing of request body data
    sendDefaultPii: true,
  });
}

export { Sentry };
