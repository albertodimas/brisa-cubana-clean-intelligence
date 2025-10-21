import { Hono } from "hono";
import type { Context } from "hono";
import { z } from "zod";
import Stripe from "stripe";
import { logger } from "../lib/logger.js";
import { getServiceRepository } from "../container.js";

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const stripeDefaultCurrency =
  process.env.STRIPE_DEFAULT_CURRENCY?.toLowerCase() ?? "usd";

const stripePackageVersion = (Stripe as unknown as { PACKAGE_VERSION?: string })
  .PACKAGE_VERSION;

const stripeApiVersion =
  process.env.STRIPE_API_VERSION ??
  (stripePackageVersion?.startsWith("19.")
    ? "2025-09-30.clover"
    : "2023-10-16");

const stripeClient = stripeSecret
  ? new Stripe(stripeSecret, {
      apiVersion: stripeApiVersion as Stripe.LatestApiVersion,
    })
  : null;

const router = new Hono();

const createIntentSchema = z.object({
  serviceId: z.string().min(1),
  scheduledFor: z.string().datetime().optional().nullable(),
  customerEmail: z.string().email(),
  customerFullName: z.string().min(2).max(120).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

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

router.post("/stripe/intent", async (c) => {
  if (!stripeClient) {
    logger.error("Intent de Stripe solicitado sin STRIPE_SECRET_KEY definido");
    return c.json({ error: "Stripe no está configurado" }, 503);
  }

  let json: unknown;
  try {
    json = await c.req.json();
  } catch {
    return c.json({ error: "Cuerpo JSON inválido" }, 400);
  }

  const parsed = createIntentSchema.safeParse(json);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const { customerEmail, customerFullName, serviceId, scheduledFor, notes } =
    parsed.data;

  try {
    const serviceRepository = getServiceRepository();
    const service = await serviceRepository.findById(serviceId);

    if (!service || !service.active) {
      return c.json(
        { error: "El servicio seleccionado no está disponible" },
        404,
      );
    }

    const amountInCents = Math.max(
      50,
      Math.round(Number.parseFloat(String(service.basePrice)) * 100),
    );

    const metadata: Record<string, string> = {
      serviceId: service.id,
      serviceName: service.name,
    };

    if (scheduledFor) {
      metadata.scheduledFor = scheduledFor;
    }
    if (customerEmail) {
      metadata.customerEmail = customerEmail;
    }
    if (customerFullName) {
      metadata.customerFullName = customerFullName;
    }
    if (notes) {
      metadata.notes = notes;
    }

    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: amountInCents,
      currency: stripeDefaultCurrency,
      description: `Brisa Cubana – ${service.name}`,
      receipt_email: customerEmail,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    logger.info(
      {
        paymentIntentId: paymentIntent.id,
        serviceId: service.id,
        currency: stripeDefaultCurrency,
        amountInCents,
      },
      "PaymentIntent de Stripe creado para checkout público",
    );

    if (!paymentIntent.client_secret) {
      return c.json(
        { error: "No se obtuvo client_secret del PaymentIntent" },
        500,
      );
    }

    return c.json({
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: amountInCents,
        currency: stripeDefaultCurrency,
      },
    });
  } catch (error) {
    logger.error(
      { err: error, serviceId, customerEmail },
      "Error creando PaymentIntent de Stripe",
    );
    return c.json({ error: "No fue posible iniciar el pago con Stripe" }, 500);
  }
});

export default router;

export const __testing = {
  stripeClient,
};
