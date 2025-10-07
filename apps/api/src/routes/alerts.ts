import { Hono } from "hono";
import { z } from "zod";
import { db } from "../lib/db";
import { getAuthUser, requireAuth } from "../middleware/auth";
import { env } from "../config/env";
import { fetchWithRetry, CircuitOpenError } from "../lib/http-client";
import { logger } from "../lib/logger";

const createPaymentAlertSchema = z.object({
  failedPayments: z.number().int().min(0),
  pendingPayments: z.number().int().min(0),
});

const alerts = new Hono();

alerts.use("*", requireAuth(["ADMIN", "STAFF"]));

alerts.get("/payment", async (c) => {
  const limit = Number.parseInt(c.req.query("limit") ?? "20", 10);
  const startDate = c.req.query("startDate");
  const endDate = c.req.query("endDate");
  const minFailedQuery = c.req.query("minFailed");
  const minPendingQuery = c.req.query("minPending");

  const minFailed = minFailedQuery
    ? Number.parseInt(minFailedQuery, 10)
    : undefined;
  const minPending = minPendingQuery
    ? Number.parseInt(minPendingQuery, 10)
    : undefined;

  const items = await db.paymentAlert.findMany({
    where: {
      triggeredAt: {
        gte: startDate ? new Date(startDate) : undefined,
        lte: endDate ? new Date(endDate) : undefined,
      },
      failedPayments:
        typeof minFailed === "number" && !Number.isNaN(minFailed)
          ? { gte: minFailed }
          : undefined,
      pendingPayments:
        typeof minPending === "number" && !Number.isNaN(minPending)
          ? { gte: minPending }
          : undefined,
    },
    orderBy: { triggeredAt: "desc" },
    take: Number.isNaN(limit) ? 20 : Math.min(limit, 100),
  });
  return c.json(items);
});

alerts.post("/payment", async (c) => {
  const authUser = getAuthUser(c);
  const json = (await c.req.json()) as unknown;
  const parsed = createPaymentAlertSchema.safeParse(json);

  if (!parsed.success) {
    return c.json(
      {
        error: "Invalid payment alert payload",
        details: parsed.error.flatten().fieldErrors,
      },
      400,
    );
  }

  const { failedPayments, pendingPayments } = parsed.data;
  const shouldNotify = failedPayments > 0 || pendingPayments > 5;

  if (!shouldNotify) {
    return c.json({ queued: false, reason: "threshold" });
  }

  const payloadHash = `${failedPayments}-${pendingPayments}`;
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

  const recent = await db.paymentAlert.findFirst({
    where: {
      payloadHash,
      triggeredAt: {
        gte: tenMinutesAgo,
      },
    },
    orderBy: { triggeredAt: "desc" },
  });

  if (recent) {
    return c.json({ queued: false, reason: "duplicate" });
  }

  const alert = await db.paymentAlert.create({
    data: {
      failedPayments,
      pendingPayments,
      payloadHash,
    },
  });

  const webhook = env.alerts.slackWebhook;
  const text = `:rotating_light: Alertas de pago detectadas (por ${authUser?.email ?? "sistema"}). Failed: ${failedPayments}. Pending: ${pendingPayments}.`;

  if (webhook) {
    try {
      const response = await fetchWithRetry(webhook, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ text }),
        timeoutMs: 3000,
        retries: 1,
        retryDelayMs: 250,
        circuitBreakerKey: "slack-webhook",
        circuitBreakerThreshold: 3,
        circuitBreakerCooldownMs: 120_000,
        name: "slack-webhook",
      });

      if (!response.ok) {
        logger.warn(
          {
            status: response.status,
            failedPayments,
            pendingPayments,
          },
          "Slack webhook responded with non-OK status",
        );
      }
    } catch (error) {
      if (error instanceof CircuitOpenError) {
        logger.warn(
          {
            failedPayments,
            pendingPayments,
          },
          "Slack webhook circuit open, skipping notification",
        );
      } else {
        logger.error(
          {
            error: error instanceof Error ? error.message : "unknown",
            failedPayments,
            pendingPayments,
          },
          "Failed to send Slack alert",
        );
      }
    }
  } else {
    logger.info(
      {
        failedPayments,
        pendingPayments,
      },
      "Slack webhook not configured; skipping notification",
    );
  }

  return c.json({ queued: true, alert });
});

export default alerts;
