import { Hono } from "hono";
import { z } from "zod";
import { db } from "../lib/db";
import { getAuthUser, requireAuth } from "../middleware/auth";

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

  const webhook = process.env.ALERTS_SLACK_WEBHOOK;
  const text = `:rotating_light: Alertas de pago detectadas (por ${authUser?.email ?? "sistema"}). Failed: ${failedPayments}. Pending: ${pendingPayments}.`;

  if (webhook) {
    try {
      await fetch(webhook, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ text }),
      });
    } catch (error) {
      console.error("Failed to send Slack alert", error);
    }
  } else {
    console.info("[alerts] slack webhook not configured", {
      failedPayments,
      pendingPayments,
    });
  }

  return c.json({ queued: true, alert });
});

export default alerts;
