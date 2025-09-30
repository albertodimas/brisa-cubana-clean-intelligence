import { Hono } from "hono";
import { db } from "../lib/db";

const health = new Hono();

interface HealthCheck {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  uptime: number;
  checks: {
    database: CheckResult;
    memory: CheckResult;
    [key: string]: CheckResult;
  };
}

interface CheckResult {
  status: "pass" | "fail";
  responseTime?: number;
  message?: string;
  details?: unknown;
}

/**
 * Liveness probe - Simple check that the service is running
 * Used by container orchestrators (Docker, Kubernetes)
 */
health.get("/", (c) => {
  return c.json({
    status: "healthy",
    service: "brisa-cubana-api",
    version: "0.1.0",
    timestamp: new Date().toISOString(),
  });
});

/**
 * Readiness probe - Comprehensive health check
 * Checks all critical dependencies
 */
health.get("/ready", async (c) => {
  const checks: HealthCheck["checks"] = {
    database: { status: "pass" },
    memory: { status: "pass" },
  };

  // Check database connection with additional stats
  try {
    const dbStart = Date.now();
    await db.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - dbStart;

    // Get database pool stats if available
    checks.database = {
      status: responseTime < 100 ? "pass" : "fail",
      responseTime,
      message: responseTime < 100 ? "Connected" : "Slow response",
      details: {
        threshold: "100ms",
      },
    };
  } catch (error) {
    checks.database = {
      status: "fail",
      message:
        error instanceof Error ? error.message : "Database connection failed",
    };
  }

  // Check memory usage
  const memUsage = process.memoryUsage();
  const memUsageMB = {
    rss: Math.round(memUsage.rss / 1024 / 1024),
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
    external: Math.round(memUsage.external / 1024 / 1024),
  };

  // Memory warning if heap used > 400MB (out of typical 512MB)
  const heapUsedPercent = (memUsageMB.heapUsed / memUsageMB.heapTotal) * 100;
  checks.memory = {
    status: heapUsedPercent > 90 ? "fail" : "pass",
    message: `Heap: ${memUsageMB.heapUsed}MB / ${memUsageMB.heapTotal}MB (${Math.round(heapUsedPercent)}%)`,
    details: memUsageMB,
  };

  // Determine overall status
  const allPassed = Object.values(checks).every(
    (check) => check.status === "pass",
  );
  const anyFailed = Object.values(checks).some(
    (check) => check.status === "fail",
  );

  const healthCheck: HealthCheck = {
    status: anyFailed ? "unhealthy" : allPassed ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks,
  };

  const statusCode = healthCheck.status === "healthy" ? 200 : 503;
  return c.json(healthCheck, statusCode);
});

/**
 * Basic runtime info
 * For detailed metrics see /metrics (Prometheus format)
 */
health.get("/info", (c) => {
  const memUsage = process.memoryUsage();

  return c.json({
    service: "brisa-cubana-api",
    version: "0.1.0",
    environment: process.env.NODE_ENV ?? "development",
    process: {
      uptime: Math.floor(process.uptime()),
      uptimeFormatted: formatUptime(process.uptime()),
      pid: process.pid,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    },
    memory: {
      rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
    },
    timestamp: new Date().toISOString(),
  });
});

/**
 * Format uptime in human-readable format
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(" ");
}

export default health;
