/**
 * Chaos Engineering Middleware for Hono
 *
 * Injects controlled failures into HTTP requests to test resilience
 */

import type { MiddlewareHandler } from "hono";
import {
  shouldTriggerChaos,
  injectLatency,
  injectError,
  DEFAULT_CHAOS_CONFIG,
} from "../lib/chaos";

/**
 * Chaos middleware for Hono
 *
 * Usage:
 * ```typescript
 * import { chaosMiddleware } from "./middleware/chaos";
 *
 * // Apply globally (not recommended for production)
 * app.use("*", chaosMiddleware());
 *
 * // Apply to specific routes
 * app.use("/api/test/*", chaosMiddleware());
 * ```
 */
export const chaosMiddleware: MiddlewareHandler = async (c, next) => {
  // Check if chaos should be triggered
  if (!shouldTriggerChaos()) {
    await next();
    return;
  }

  // Randomly choose experiment type
  const experiment = Math.random();

  if (experiment < 0.7 && DEFAULT_CHAOS_CONFIG.experiments.latency.enabled) {
    // 70% chance: Latency injection
    await injectLatency();
    await next();
  } else if (DEFAULT_CHAOS_CONFIG.experiments.errors.enabled) {
    // 30% chance: Error injection
    const error = injectError();
    return c.json(
      { error: error.message, chaos: true },
      error.statusCode as 500 | 503 | 504,
    );
  } else {
    // Fallback: no chaos
    await next();
  }
};
