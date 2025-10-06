import { Hono } from "hono";
import { Sentry } from "../telemetry/sentry";

const app = new Hono();

/**
 * Test endpoint to verify Sentry error tracking
 * Only available in development and staging environments
 */
if (process.env.NODE_ENV !== "production") {
  app.get("/test-error", (c) => {
    // Throw a test error
    throw new Error(
      "Test Sentry Error - This is a test error to verify Sentry integration",
    );
  });

  app.get("/test-capture", (c) => {
    // Manually capture an error
    const testError = new Error("Manual Sentry Capture Test");
    Sentry.captureException(testError, {
      tags: {
        component: "SentryTest",
        type: "manual-capture",
      },
      contexts: {
        test: {
          timestamp: new Date().toISOString(),
          endpoint: "/api/sentry/test-capture",
        },
      },
    });

    return c.json({
      message: "Error captured and sent to Sentry",
      check: "Visit your Sentry dashboard to see the error",
    });
  });

  app.get("/test-breadcrumbs", (c) => {
    // Add breadcrumbs
    Sentry.addBreadcrumb({
      category: "test",
      message: "Starting breadcrumb test",
      level: "info",
    });

    Sentry.addBreadcrumb({
      category: "test",
      message: "Middle of breadcrumb test",
      level: "debug",
      data: { step: 2 },
    });

    Sentry.addBreadcrumb({
      category: "test",
      message: "About to throw error",
      level: "warning",
    });

    // Throw error to see breadcrumbs in context
    throw new Error("Test error with breadcrumbs");
  });

  app.get("/test-transaction", async (c) => {
    // Test performance monitoring
    const transaction = Sentry.startTransaction({
      op: "test",
      name: "Test Transaction",
    });

    // Simulate some work
    await new Promise((resolve) => setTimeout(resolve, 100));

    const span = transaction.startChild({
      op: "test.operation",
      description: "Simulated operation",
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    span.finish();
    transaction.finish();

    return c.json({
      message: "Transaction completed and sent to Sentry",
      check: "Visit Sentry Performance tab to see the transaction",
    });
  });

  app.get("/", (c) => {
    return c.json({
      message: "Sentry Test Endpoints",
      endpoints: [
        {
          path: "/api/sentry/test-error",
          description: "Throws an unhandled error",
        },
        {
          path: "/api/sentry/test-capture",
          description: "Manually captures an error",
        },
        {
          path: "/api/sentry/test-breadcrumbs",
          description: "Tests breadcrumbs by throwing error",
        },
        {
          path: "/api/sentry/test-transaction",
          description: "Tests performance monitoring",
        },
      ],
      note: "These endpoints are only available in development/staging",
    });
  });
}

export default app;
