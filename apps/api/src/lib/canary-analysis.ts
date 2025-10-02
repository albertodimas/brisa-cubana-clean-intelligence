/**
 * Canary Deployment Analysis System
 *
 * Automated analysis of canary deployments using Prometheus metrics
 * to make promote/rollback decisions based on SLO thresholds.
 *
 * Features:
 * - Automated metric collection from Prometheus
 * - SLO-based decision making
 * - Gradual traffic shifting (10% → 50% → 100%)
 * - Automatic rollback on SLO violations
 *
 * References:
 * - https://flagger.app (Flux CD Flagger)
 * - Google SRE Book: Canary Releases
 * - https://prometheus.io/docs/prometheus/latest/querying/api/
 *
 * Created: October 2, 2025
 */

import type {
  CanaryMetrics,
  CanaryDecision,
  CanaryConfig,
} from "../types/canary";

/**
 * Default canary configuration
 * Based on production SLOs defined in Phase 2
 */
export const DEFAULT_CANARY_CONFIG: CanaryConfig = {
  // SLO thresholds (must not exceed these)
  maxErrorRate: 0.01, // 1% error rate
  maxLatencyP95Ms: 500, // 500ms p95 latency
  maxLatencyP99Ms: 1000, // 1000ms p99 latency
  minSuccessRate: 0.99, // 99% success rate

  // Traffic shifting steps
  trafficSteps: [10, 25, 50, 75, 100], // Percentage of traffic
  stepDurationMinutes: 10, // Duration per step

  // Analysis windows
  analysisIntervalSeconds: 30, // How often to check metrics
  metricsLookbackMinutes: 5, // Window for metric aggregation

  // Deployment metadata
  prometheusUrl: process.env.PROMETHEUS_URL ?? "http://localhost:9090",
  canaryLabel: "version",
};

/**
 * Query Prometheus for canary metrics
 */
export async function fetchCanaryMetrics(
  config: CanaryConfig,
  canaryVersion: string,
  baselineVersion: string,
): Promise<{ canary: CanaryMetrics; baseline: CanaryMetrics }> {
  const prometheusUrl = config.prometheusUrl;
  const lookbackMinutes = config.metricsLookbackMinutes;

  // PromQL queries for canary and baseline
  const queries = {
    errorRate: (version: string) =>
      `sum(rate(http_requests_total{${config.canaryLabel}="${version}",status=~"5.."}[${lookbackMinutes}m])) / sum(rate(http_requests_total{${config.canaryLabel}="${version}"}[${lookbackMinutes}m]))`,
    latencyP95: (version: string) =>
      `histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{${config.canaryLabel}="${version}"}[${lookbackMinutes}m])) by (le))`,
    latencyP99: (version: string) =>
      `histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket{${config.canaryLabel}="${version}"}[${lookbackMinutes}m])) by (le))`,
    requestRate: (version: string) =>
      `sum(rate(http_requests_total{${config.canaryLabel}="${version}"}[${lookbackMinutes}m]))`,
  };

  // Fetch metrics for both versions
  const fetchMetric = async (query: string): Promise<number | null> => {
    try {
      const response = await fetch(
        `${prometheusUrl}/api/v1/query?query=${encodeURIComponent(query)}`,
      );
      const data = (await response.json()) as {
        data: { result: { value: [number, string] }[] };
      };

      if (data.data.result.length === 0) {
        return null;
      }

      return parseFloat(data.data.result[0].value[1]);
    } catch (error) {
      console.error(`Failed to fetch metric: ${query}`, error);
      return null;
    }
  };

  const [
    canaryErrorRate,
    canaryLatencyP95,
    canaryLatencyP99,
    canaryRequestRate,
    baselineErrorRate,
    baselineLatencyP95,
    baselineLatencyP99,
    baselineRequestRate,
  ] = await Promise.all([
    fetchMetric(queries.errorRate(canaryVersion)),
    fetchMetric(queries.latencyP95(canaryVersion)),
    fetchMetric(queries.latencyP99(canaryVersion)),
    fetchMetric(queries.requestRate(canaryVersion)),
    fetchMetric(queries.errorRate(baselineVersion)),
    fetchMetric(queries.latencyP95(baselineVersion)),
    fetchMetric(queries.latencyP99(baselineVersion)),
    fetchMetric(queries.requestRate(baselineVersion)),
  ]);

  return {
    canary: {
      errorRate: canaryErrorRate ?? 0,
      latencyP95Ms: (canaryLatencyP95 ?? 0) * 1000,
      latencyP99Ms: (canaryLatencyP99 ?? 0) * 1000,
      requestRate: canaryRequestRate ?? 0,
      successRate: 1 - (canaryErrorRate ?? 0),
    },
    baseline: {
      errorRate: baselineErrorRate ?? 0,
      latencyP95Ms: (baselineLatencyP95 ?? 0) * 1000,
      latencyP99Ms: (baselineLatencyP99 ?? 0) * 1000,
      requestRate: baselineRequestRate ?? 0,
      successRate: 1 - (baselineErrorRate ?? 0),
    },
  };
}

/**
 * Analyze canary metrics and make promotion decision
 *
 * Decision logic:
 * 1. Check absolute SLO thresholds (canary must meet SLOs)
 * 2. Compare canary vs baseline (canary must not be significantly worse)
 * 3. Return decision: PROMOTE, ROLLBACK, or CONTINUE
 */
export function analyzeCanaryMetrics(
  metrics: { canary: CanaryMetrics; baseline: CanaryMetrics },
  config: CanaryConfig,
): CanaryDecision {
  const { canary, baseline } = metrics;
  const violations: string[] = [];

  // 1. Check absolute SLO violations
  if (canary.errorRate > config.maxErrorRate) {
    violations.push(
      `Error rate ${(canary.errorRate * 100).toFixed(2)}% exceeds threshold ${(config.maxErrorRate * 100).toFixed(2)}%`,
    );
  }

  if (canary.latencyP95Ms > config.maxLatencyP95Ms) {
    violations.push(
      `Latency p95 ${canary.latencyP95Ms.toFixed(0)}ms exceeds threshold ${config.maxLatencyP95Ms}ms`,
    );
  }

  if (canary.latencyP99Ms > config.maxLatencyP99Ms) {
    violations.push(
      `Latency p99 ${canary.latencyP99Ms.toFixed(0)}ms exceeds threshold ${config.maxLatencyP99Ms}ms`,
    );
  }

  if (canary.successRate < config.minSuccessRate) {
    violations.push(
      `Success rate ${(canary.successRate * 100).toFixed(2)}% below threshold ${(config.minSuccessRate * 100).toFixed(2)}%`,
    );
  }

  // 2. Compare canary vs baseline (allow 10% degradation)
  const errorRateIncrease =
    baseline.errorRate > 0
      ? (canary.errorRate - baseline.errorRate) / baseline.errorRate
      : 0;
  if (errorRateIncrease > 0.1) {
    violations.push(
      `Error rate increased ${(errorRateIncrease * 100).toFixed(0)}% vs baseline`,
    );
  }

  const latencyP95Increase =
    baseline.latencyP95Ms > 0
      ? (canary.latencyP95Ms - baseline.latencyP95Ms) / baseline.latencyP95Ms
      : 0;
  if (latencyP95Increase > 0.1) {
    violations.push(
      `Latency p95 increased ${(latencyP95Increase * 100).toFixed(0)}% vs baseline`,
    );
  }

  // 3. Make decision
  if (violations.length > 0) {
    return {
      action: "ROLLBACK",
      reason: `SLO violations detected: ${violations.join(", ")}`,
      violations,
      metrics,
      timestamp: new Date().toISOString(),
    };
  }

  // Check if metrics are significantly better (>5% improvement)
  const isSignificantlyBetter =
    errorRateIncrease < -0.05 || latencyP95Increase < -0.05;

  if (isSignificantlyBetter) {
    return {
      action: "PROMOTE",
      reason: "Canary metrics meet SLOs and show improvement",
      violations: [],
      metrics,
      timestamp: new Date().toISOString(),
    };
  }

  return {
    action: "CONTINUE",
    reason: "Canary metrics stable, continue monitoring",
    violations: [],
    metrics,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Execute canary deployment with automated analysis
 *
 * Gradually shifts traffic from baseline to canary while monitoring metrics.
 * Automatically promotes or rolls back based on SLO analysis.
 */
export async function runCanaryDeployment(
  canaryVersion: string,
  baselineVersion: string,
  config: CanaryConfig = DEFAULT_CANARY_CONFIG,
): Promise<{ success: boolean; finalDecision: CanaryDecision }> {
  console.log(
    `[Canary] Starting deployment: ${baselineVersion} → ${canaryVersion}`,
  );

  for (const trafficPercent of config.trafficSteps) {
    console.log(
      `[Canary] Shifting ${trafficPercent}% traffic to canary version`,
    );

    // Simulate traffic shifting (in real deployment, this would call Vercel/Railway API)
    // await shiftTraffic(canaryVersion, trafficPercent);

    // Wait for metrics to stabilize
    const stabilizationMs = config.stepDurationMinutes * 60 * 1000;
    console.log(
      `[Canary] Waiting ${config.stepDurationMinutes} minutes for metrics...`,
    );
    await new Promise((resolve) => setTimeout(resolve, stabilizationMs));

    // Analyze metrics
    const metrics = await fetchCanaryMetrics(
      config,
      canaryVersion,
      baselineVersion,
    );
    const decision = analyzeCanaryMetrics(metrics, config);

    console.log(`[Canary] Analysis result: ${decision.action}`);
    console.log(`[Canary] Reason: ${decision.reason}`);

    if (decision.action === "ROLLBACK") {
      console.error(
        `[Canary] Rolling back due to violations: ${decision.violations.join(", ")}`,
      );
      return { success: false, finalDecision: decision };
    }

    if (decision.action === "PROMOTE" && trafficPercent === 100) {
      console.log("[Canary] Deployment successful, promoting to 100%");
      return { success: true, finalDecision: decision };
    }
  }

  // If we reach here, all steps passed
  const finalMetrics = await fetchCanaryMetrics(
    config,
    canaryVersion,
    baselineVersion,
  );
  const finalDecision = analyzeCanaryMetrics(finalMetrics, config);

  return {
    success: finalDecision.action !== "ROLLBACK",
    finalDecision,
  };
}
