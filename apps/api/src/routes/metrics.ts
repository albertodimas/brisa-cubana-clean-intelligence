/**
 * Metrics endpoint for Prometheus scraping
 */
import { Hono } from "hono";
import { register } from "../lib/metrics";

const metrics = new Hono();

/**
 * GET /metrics
 * Returns Prometheus metrics in text format
 */
metrics.get("/", async (c) => {
  try {
    const metricsText = await register.metrics();

    return c.text(metricsText, 200, {
      "Content-Type": register.contentType,
    });
  } catch (error) {
    return c.json(
      {
        error: "Failed to collect metrics",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

export default metrics;
