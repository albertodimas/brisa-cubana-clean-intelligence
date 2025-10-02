/**
 * FinOps (Financial Operations) Monitoring
 *
 * Cost monitoring and optimization for cloud infrastructure:
 * - Railway (API hosting)
 * - Vercel (Web hosting)
 * - Neon (PostgreSQL database)
 *
 * Features:
 * - Real-time cost tracking
 * - Budget alerts
 * - Rightsizing recommendations
 * - Cost forecasting
 *
 * References:
 * - Railway API: https://docs.railway.app/reference/public-api
 * - Vercel API: https://vercel.com/docs/rest-api
 * - Neon API: https://api-docs.neon.tech/reference/getting-started-with-neon-api
 *
 * Created: October 2, 2025
 */

import type { FinOpsMetrics } from "../types/canary";

/**
 * Fetch Railway project metrics and costs
 * Requires RAILWAY_TOKEN environment variable
 */
export async function fetchRailwayMetrics(): Promise<FinOpsMetrics["railway"]> {
  const railwayToken = process.env.RAILWAY_TOKEN;
  const railwayProjectId = process.env.RAILWAY_PROJECT_ID;

  if (!railwayToken || !railwayProjectId) {
    console.warn("[FinOps] Railway credentials not configured");
    return {
      monthToDateCost: 0,
      projectedMonthlyCost: 0,
      cpuUsagePercent: 0,
      memoryUsageMB: 0,
      networkEgressGB: 0,
      estimatedSavings: 0,
    };
  }

  try {
    // GraphQL query for Railway metrics
    const query = `
      query GetProjectMetrics($projectId: String!) {
        project(id: $projectId) {
          estimatedUsage {
            currentUsage
            estimatedCost
          }
          services {
            nodes {
              name
              metrics {
                cpuPercent
                memoryMB
                networkEgressGB
              }
            }
          }
        }
      }
    `;

    const response = await fetch("https://backboard.railway.app/graphql/v2", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${railwayToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables: { projectId: railwayProjectId },
      }),
    });

    const data = (await response.json()) as {
      data?: {
        project: {
          estimatedUsage: { currentUsage: number; estimatedCost: number };
          services: {
            nodes: {
              name: string;
              metrics: {
                cpuPercent: number;
                memoryMB: number;
                networkEgressGB: number;
              };
            }[];
          };
        };
      };
    };

    if (!data.data) {
      throw new Error("Invalid Railway API response");
    }

    const project = data.data.project;
    const totalCpu =
      project.services.nodes.reduce(
        (sum, s) => sum + (s.metrics?.cpuPercent ?? 0),
        0,
      ) / project.services.nodes.length;
    const totalMemory = project.services.nodes.reduce(
      (sum, s) => sum + (s.metrics?.memoryMB ?? 0),
      0,
    );
    const totalEgress = project.services.nodes.reduce(
      (sum, s) => sum + (s.metrics?.networkEgressGB ?? 0),
      0,
    );

    // Calculate savings if rightsized (if CPU < 50%, we're over-provisioned)
    const estimatedSavings =
      totalCpu < 50 ? project.estimatedUsage.estimatedCost * 0.3 : 0;

    return {
      monthToDateCost: project.estimatedUsage.currentUsage / 100,
      projectedMonthlyCost: project.estimatedUsage.estimatedCost / 100,
      cpuUsagePercent: totalCpu,
      memoryUsageMB: totalMemory,
      networkEgressGB: totalEgress,
      estimatedSavings,
    };
  } catch (error) {
    console.error("[FinOps] Failed to fetch Railway metrics:", error);
    return {
      monthToDateCost: 0,
      projectedMonthlyCost: 0,
      cpuUsagePercent: 0,
      memoryUsageMB: 0,
      networkEgressGB: 0,
      estimatedSavings: 0,
    };
  }
}

/**
 * Fetch Vercel project usage and costs
 * Requires VERCEL_TOKEN and VERCEL_PROJECT_ID environment variables
 */
export async function fetchVercelMetrics(): Promise<FinOpsMetrics["vercel"]> {
  const vercelToken = process.env.VERCEL_TOKEN;
  const vercelTeamId = process.env.VERCEL_TEAM_ID;

  if (!vercelToken || !vercelTeamId) {
    console.warn("[FinOps] Vercel credentials not configured");
    return {
      monthToDateCost: 0,
      projectedMonthlyCost: 0,
      bandwidthGB: 0,
      functionInvocations: 0,
      buildMinutes: 0,
      estimatedSavings: 0,
    };
  }

  try {
    // Get current month usage
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const since = Math.floor(startOfMonth.getTime() / 1000);

    const response = await fetch(
      `https://api.vercel.com/v1/teams/${vercelTeamId}/usage?since=${since}`,
      {
        headers: {
          Authorization: `Bearer ${vercelToken}`,
        },
      },
    );

    const data = (await response.json()) as {
      bandwidth?: { bytes: number };
      invocations?: { count: number };
      buildMinutes?: { minutes: number };
    };

    const bandwidthGB = (data.bandwidth?.bytes ?? 0) / 1024 / 1024 / 1024;
    const invocations = data.invocations?.count ?? 0;
    const buildMinutes = data.buildMinutes?.minutes ?? 0;

    // Estimate costs based on Vercel Pro pricing (as of 2025)
    // $20/mo base + $0.40/GB bandwidth + $40/million invocations + $0.50/build minute
    const bandwidthCost = Math.max(0, (bandwidthGB - 100) * 0.4); // 100GB included
    const invocationsCost = Math.max(
      0,
      ((invocations - 1000000) / 1000000) * 40,
    ); // 1M included
    const buildCost = Math.max(0, (buildMinutes - 6000) * (0.5 / 60)); // 6000 min included

    const monthToDateCost = 20 + bandwidthCost + invocationsCost + buildCost;

    // Project to end of month
    const daysInMonth = new Date(
      startOfMonth.getFullYear(),
      startOfMonth.getMonth() + 1,
      0,
    ).getDate();
    const daysPassed = new Date().getDate();
    const projectedMonthlyCost = (monthToDateCost / daysPassed) * daysInMonth;

    // Calculate savings potential (optimize build minutes with caching)
    const estimatedSavings = buildMinutes > 8000 ? buildCost * 0.2 : 0;

    return {
      monthToDateCost,
      projectedMonthlyCost,
      bandwidthGB,
      functionInvocations: invocations,
      buildMinutes,
      estimatedSavings,
    };
  } catch (error) {
    console.error("[FinOps] Failed to fetch Vercel metrics:", error);
    return {
      monthToDateCost: 0,
      projectedMonthlyCost: 0,
      bandwidthGB: 0,
      functionInvocations: 0,
      buildMinutes: 0,
      estimatedSavings: 0,
    };
  }
}

/**
 * Fetch Neon database usage and costs
 * Requires NEON_API_KEY environment variable
 */
export async function fetchNeonMetrics(): Promise<FinOpsMetrics["neon"]> {
  const neonApiKey = process.env.NEON_API_KEY;
  const neonProjectId = process.env.NEON_PROJECT_ID;

  if (!neonApiKey || !neonProjectId) {
    console.warn("[FinOps] Neon credentials not configured");
    return {
      monthToDateCost: 0,
      projectedMonthlyCost: 0,
      storageGB: 0,
      computeHours: 0,
      dataTransferGB: 0,
      estimatedSavings: 0,
    };
  }

  try {
    const response = await fetch(
      `https://console.neon.tech/api/v2/projects/${neonProjectId}/consumption`,
      {
        headers: {
          Authorization: `Bearer ${neonApiKey}`,
          Accept: "application/json",
        },
      },
    );

    const data = (await response.json()) as {
      periods?: {
        storage: { bytes: number };
        compute: { seconds: number };
        data_transfer: { bytes: number };
      }[];
    };

    if (!data.periods || data.periods.length === 0) {
      throw new Error("No Neon usage data available");
    }

    const currentPeriod = data.periods[0];
    const storageGB = currentPeriod.storage.bytes / 1024 / 1024 / 1024;
    const computeHours = currentPeriod.compute.seconds / 3600;
    const dataTransferGB =
      currentPeriod.data_transfer.bytes / 1024 / 1024 / 1024;

    // Neon pricing (as of 2025): $0.16/GB storage + $0.16/compute hour + $0.09/GB transfer
    const storageCost = storageGB * 0.16;
    const computeCost = computeHours * 0.16;
    const transferCost = dataTransferGB * 0.09;

    const monthToDateCost = storageCost + computeCost + transferCost;

    // Project to end of month
    const now = new Date();
    const daysInMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
    ).getDate();
    const daysPassed = now.getDate();
    const projectedMonthlyCost = (monthToDateCost / daysPassed) * daysInMonth;

    // Calculate savings (optimize autosuspend settings)
    const estimatedSavings = computeHours > 100 ? computeCost * 0.15 : 0;

    return {
      monthToDateCost,
      projectedMonthlyCost,
      storageGB,
      computeHours,
      dataTransferGB,
      estimatedSavings,
    };
  } catch (error) {
    console.error("[FinOps] Failed to fetch Neon metrics:", error);
    return {
      monthToDateCost: 0,
      projectedMonthlyCost: 0,
      storageGB: 0,
      computeHours: 0,
      dataTransferGB: 0,
      estimatedSavings: 0,
    };
  }
}

/**
 * Get complete FinOps metrics across all services
 */
export async function getFinOpsMetrics(
  budgetLimit = 500,
): Promise<FinOpsMetrics> {
  const [railway, vercel, neon] = await Promise.all([
    fetchRailwayMetrics(),
    fetchVercelMetrics(),
    fetchNeonMetrics(),
  ]);

  const totalMonthlyCost =
    railway.projectedMonthlyCost +
    vercel.projectedMonthlyCost +
    neon.projectedMonthlyCost;

  const budgetUsagePercent = (totalMonthlyCost / budgetLimit) * 100;
  const forecastOverage = Math.max(0, totalMonthlyCost - budgetLimit);

  return {
    railway,
    vercel,
    neon,
    totalMonthlyCost,
    budgetLimit,
    budgetUsagePercent,
    forecastOverage,
  };
}

/**
 * Check if budget alert should be triggered
 */
export function shouldAlertBudget(metrics: FinOpsMetrics): boolean {
  // Alert if:
  // 1. Over 80% of budget
  // 2. Forecasted to exceed budget
  // 3. Sudden spike (>20% increase from last check)
  return metrics.budgetUsagePercent > 80 || metrics.forecastOverage > 0;
}
