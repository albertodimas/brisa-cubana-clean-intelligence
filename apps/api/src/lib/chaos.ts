/**
 * Chaos Engineering Framework
 *
 * Controlled failure injection for testing system resilience:
 * - Latency injection
 * - Error injection
 * - Resource exhaustion
 * - Circuit breaker testing
 *
 * Safety Features:
 * - Environment-based activation (only non-prod)
 * - Probability-based triggering
 * - Configurable failure scenarios
 * - Automatic disablement on high error rates
 *
 * References:
 * - Principles of Chaos Engineering: https://principlesofchaos.org/
 * - Netflix Chaos Monkey: https://netflix.github.io/chaosmonkey/
 * - AWS Fault Injection Simulator: https://aws.amazon.com/fis/
 *
 * Created: October 2, 2025
 */

/**
 * Chaos experiment configuration
 */
export interface ChaosConfig {
  enabled: boolean; // Master switch
  probability: number; // 0.0 - 1.0, probability of triggering
  experiments: {
    latency: {
      enabled: boolean;
      minMs: number;
      maxMs: number;
    };
    errors: {
      enabled: boolean;
      statusCodes: number[]; // e.g., [500, 503, 504]
    };
    resourceExhaustion: {
      enabled: boolean;
      memoryLeakMB: number;
    };
  };
  safetyLimits: {
    maxErrorRate: number; // Auto-disable if system error rate exceeds this
    allowedEnvironments: string[]; // Only run in these environments
  };
}

/**
 * Default chaos configuration
 * IMPORTANT: Only enabled in development/staging
 */
export const DEFAULT_CHAOS_CONFIG: ChaosConfig = {
  enabled: process.env.ENABLE_CHAOS_ENGINEERING === "true",
  probability: parseFloat(process.env.CHAOS_PROBABILITY ?? "0.01"), // 1% of requests
  experiments: {
    latency: {
      enabled: true,
      minMs: 100,
      maxMs: 2000,
    },
    errors: {
      enabled: true,
      statusCodes: [500, 503, 504],
    },
    resourceExhaustion: {
      enabled: false, // Disabled by default (dangerous)
      memoryLeakMB: 10,
    },
  },
  safetyLimits: {
    maxErrorRate: 0.05, // 5% error rate threshold
    allowedEnvironments: ["development", "staging", "test"],
  },
};

// Track chaos experiments
let chaosMetrics = {
  totalRequests: 0,
  chaosInjected: 0,
  latencyInjections: 0,
  errorInjections: 0,
};

/**
 * Check if chaos should be triggered for this request
 */
export function shouldTriggerChaos(
  config: ChaosConfig = DEFAULT_CHAOS_CONFIG,
): boolean {
  // Safety check: Only in allowed environments
  const currentEnv = process.env.NODE_ENV ?? "production";
  if (!config.safetyLimits.allowedEnvironments.includes(currentEnv)) {
    return false;
  }

  // Safety check: Master switch
  if (!config.enabled) {
    return false;
  }

  // Safety check: Error rate threshold
  const errorRate =
    chaosMetrics.totalRequests > 0
      ? chaosMetrics.chaosInjected / chaosMetrics.totalRequests
      : 0;
  if (errorRate > config.safetyLimits.maxErrorRate) {
    console.warn("[Chaos] Auto-disabled: error rate exceeded safety limit");
    return false;
  }

  // Probability check
  chaosMetrics.totalRequests++;
  return Math.random() < config.probability;
}

/**
 * Inject artificial latency
 */
export async function injectLatency(
  config: ChaosConfig = DEFAULT_CHAOS_CONFIG,
): Promise<void> {
  if (!config.experiments.latency.enabled) {
    return;
  }

  const delayMs =
    Math.random() *
      (config.experiments.latency.maxMs - config.experiments.latency.minMs) +
    config.experiments.latency.minMs;

  console.log(`[Chaos] Injecting ${delayMs.toFixed(0)}ms latency`);
  chaosMetrics.chaosInjected++;
  chaosMetrics.latencyInjections++;

  await new Promise((resolve) => setTimeout(resolve, delayMs));
}

/**
 * Inject error response
 */
export function injectError(config: ChaosConfig = DEFAULT_CHAOS_CONFIG): {
  statusCode: number;
  message: string;
} {
  if (!config.experiments.errors.enabled) {
    throw new Error("Error injection not enabled");
  }

  const statusCode =
    config.experiments.errors.statusCodes[
      Math.floor(Math.random() * config.experiments.errors.statusCodes.length)
    ];

  console.log(`[Chaos] Injecting error ${statusCode}`);
  chaosMetrics.chaosInjected++;
  chaosMetrics.errorInjections++;

  const messages: Record<number, string> = {
    500: "Chaos: Internal Server Error",
    503: "Chaos: Service Temporarily Unavailable",
    504: "Chaos: Gateway Timeout",
  };

  return {
    statusCode,
    message: messages[statusCode] ?? "Chaos: Unknown Error",
  };
}

/**
 * Simulate resource exhaustion (memory leak)
 * WARNING: Use with extreme caution, only in isolated test environments
 */
export function injectMemoryLeak(
  config: ChaosConfig = DEFAULT_CHAOS_CONFIG,
): void {
  if (!config.experiments.resourceExhaustion.enabled) {
    return;
  }

  console.warn(
    `[Chaos] Injecting ${config.experiments.resourceExhaustion.memoryLeakMB}MB memory leak`,
  );
  chaosMetrics.chaosInjected++;

  // Allocate memory that won't be garbage collected
  const leak = new Array(
    config.experiments.resourceExhaustion.memoryLeakMB * 1024 * 256,
  ).fill("chaos");
  (globalThis as { __chaosLeak?: unknown }).__chaosLeak = leak;
}

/**
 * Get chaos metrics for monitoring
 */
export function getChaosMetrics() {
  return {
    ...chaosMetrics,
    chaosRate:
      chaosMetrics.totalRequests > 0
        ? chaosMetrics.chaosInjected / chaosMetrics.totalRequests
        : 0,
  };
}

/**
 * Reset chaos metrics (for testing)
 */
export function resetChaosMetrics(): void {
  chaosMetrics = {
    totalRequests: 0,
    chaosInjected: 0,
    latencyInjections: 0,
    errorInjections: 0,
  };
}
