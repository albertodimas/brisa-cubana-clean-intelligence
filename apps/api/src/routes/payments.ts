import { Hono } from "hono";
import type { Context } from "hono";
import Stripe from "stripe";
import { logger } from "../lib/logger.js";

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

const stripeClient = stripeSecret
  ? new Stripe(stripeSecret, {
      apiVersion: "2023-10-16",
    })
  : null;

const router = new Hono();

router.post("/stripe/webhook", async (c: Context) => {
  if (!stripeClient || !stripeWebhookSecret) {
    logger.warn(
      "Stripe webhook invoked pero la configuración STRIPE_SECRET_KEY/STRIPE_WEBHOOK_SECRET está incompleta",
    );
    return c.json({ error: "Stripe no está configurado" }, 503);
  }

  const signature = c.req.header("stripe-signature");
  if (!signature) {
    return c.json({ error: "Falta stripe-signature" }, 400);
  }

  const rawBody = Buffer.from(await c.req.arrayBuffer());

  let event: Stripe.Event;
  try {
    event = stripeClient.webhooks.constructEvent(
      rawBody,
      signature,
      stripeWebhookSecret,
    );
  } catch (error) {
    logger.error(
      {
        err: error,
      },
      "Error verificando firma de webhook de Stripe",
    );
    return c.json({ error: "Firma inválida" }, 400);
  }

  switch (event.type) {
    case "checkout.session.completed":
      logger.info(
        {
          eventId: event.id,
          type: event.type,
          sessionId: (event.data?.object as Stripe.Checkout.Session)?.id,
        },
        "Checkout completado recibido desde Stripe",
      );
      break;
    default:
      logger.info(
        { eventId: event.id, type: event.type },
        "Webhook Stripe no manejado explícitamente",
      );
      break;
  }

  return c.json({ received: true });
});

export default router;
