/**
 * Next.js Instrumentation
 *
 * This file is automatically loaded by Next.js during server startup.
 * It's the recommended way to initialize server-side monitoring and observability.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run on server
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Initialize Sentry for server-side monitoring
    await import("./sentry.server.config");
  }

  // Edge runtime (if needed in the future)
  if (process.env.NEXT_RUNTIME === "edge") {
    // Initialize edge-specific monitoring
    await import("./sentry.edge.config");
  }
}
