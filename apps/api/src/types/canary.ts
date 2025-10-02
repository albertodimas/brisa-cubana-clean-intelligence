/**
 * Type definitions for Canary Deployment Analysis
 */

export interface CanaryMetrics {
  errorRate: number; // 0.0 - 1.0
  latencyP95Ms: number; // milliseconds
  latencyP99Ms: number; // milliseconds
  requestRate: number; // requests per second
  successRate: number; // 0.0 - 1.0
}

export interface CanaryConfig {
  // SLO thresholds
  maxErrorRate: number;
  maxLatencyP95Ms: number;
  maxLatencyP99Ms: number;
  minSuccessRate: number;

  // Traffic shifting
  trafficSteps: number[]; // e.g., [10, 25, 50, 75, 100]
  stepDurationMinutes: number;

  // Analysis configuration
  analysisIntervalSeconds: number;
  metricsLookbackMinutes: number;

  // Prometheus integration
  prometheusUrl: string;
  canaryLabel: string; // Label to differentiate versions
}

export type CanaryAction = "PROMOTE" | "ROLLBACK" | "CONTINUE";

export interface CanaryDecision {
  action: CanaryAction;
  reason: string;
  violations: string[];
  metrics: {
    canary: CanaryMetrics;
    baseline: CanaryMetrics;
  };
  timestamp: string;
}

export interface FinOpsMetrics {
  // Railway metrics
  railway: {
    monthToDateCost: number; // USD
    projectedMonthlyCost: number;
    cpuUsagePercent: number;
    memoryUsageMB: number;
    networkEgressGB: number;
    estimatedSavings: number; // If rightsized
  };

  // Vercel metrics
  vercel: {
    monthToDateCost: number;
    projectedMonthlyCost: number;
    bandwidthGB: number;
    functionInvocations: number;
    buildMinutes: number;
    estimatedSavings: number;
  };

  // Neon (database) metrics
  neon: {
    monthToDateCost: number;
    projectedMonthlyCost: number;
    storageGB: number;
    computeHours: number;
    dataTransferGB: number;
    estimatedSavings: number;
  };

  // Total costs
  totalMonthlyCost: number;
  budgetLimit: number;
  budgetUsagePercent: number;
  forecastOverage: number; // Projected overage at month end
}
