import { Hono } from "hono";
import type { Context } from "hono";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import Stripe from "stripe";
import type { BookingStatus } from "@prisma/client";
import { logger } from "../lib/logger.js";
import {
  getServiceRepository,
  getBookingRepository,
  getUserRepository,
  getPropertyRepository,
  getStripeWebhookEventRepository,
  getNotificationRepository,
} from "../container.js";
import type { BookingCreateInput } from "../repositories/booking-repository.js";
import { NotificationType } from "@prisma/client";
import { createRateLimiter } from "../lib/rate-limiter.js";

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const stripeDefaultCurrency =
  process.env.STRIPE_DEFAULT_CURRENCY?.toLowerCase() ?? "usd";

const stripePackageVersion = (Stripe as unknown as { PACKAGE_VERSION?: string })
  .PACKAGE_VERSION;

// Stripe 19 cambia el literal de versión de API a "2025-09-30.clover". Para evitar
// errores de tipo al compilar con distintas versiones del SDK reutilizamos la versión
// indicada en el entorno o derivamos el valor adecuado según el paquete instalado.
const runtimeStripeApiVersion =
  process.env.STRIPE_API_VERSION ??
  (stripePackageVersion?.startsWith("19.")
    ? "2025-09-30.clover"
    : "2023-10-16");
const stripeApiVersion = runtimeStripeApiVersion as Stripe.LatestApiVersion;

const stripeClient = stripeSecret
  ? new Stripe(stripeSecret, {
      apiVersion: stripeApiVersion,
    })
  : null;

const router = new Hono();

const checkoutIntentRateLimiter = createRateLimiter({
  limit: Number(process.env.CHECKOUT_PAYMENT_RATE_LIMIT ?? "10"),
  windowMs: Number(process.env.CHECKOUT_PAYMENT_WINDOW_MS ?? "60000"),
  errorMessage:
    "Demasiadas solicitudes de pago. Intenta nuevamente en unos minutos.",
  identifier: "checkout-payment-intent",
});

router.use("/stripe/intent", checkoutIntentRateLimiter);

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

  // SECURITY: Prevenir procesamiento duplicado
  const webhookEventRepo = getStripeWebhookEventRepository();
  const wasAlreadyProcessed = await webhookEventRepo.wasProcessed(event.id);

  if (wasAlreadyProcessed) {
    logger.info(
      {
        eventId: event.id,
        type: event.type,
      },
      "Webhook de Stripe ya fue procesado anteriormente (reintento detectado)",
    );
    return c.json({ received: true, status: "already_processed" });
  }

  // Registrar el evento
  await webhookEventRepo.recordEvent(event.id, event.type);

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event);
        break;
      default:
        logger.info(
          { eventId: event.id, type: event.type },
          "Webhook Stripe no manejado explícitamente",
        );
        break;
    }

    // Marcar como procesado exitosamente
    await webhookEventRepo.markAsProcessed(event.id);

    return c.json({ received: true, status: "processed" });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    await webhookEventRepo.markAsError(event.id, errorMessage);
    logger.error(
      {
        eventId: event.id,
        type: event.type,
        err: error,
      },
      "Error procesando webhook de Stripe",
    );
    // Retornar 200 para evitar reintentos de Stripe si el error es de datos
    return c.json({ received: true, status: "error", error: errorMessage });
  }
});

/**
 * Procesa el evento checkout.session.completed de Stripe
 * Crea o actualiza un booking basado en el PaymentIntent metadata
 */
async function handleCheckoutSessionCompleted(
  event: Stripe.Event,
): Promise<void> {
  const session = event.data.object as Stripe.Checkout.Session;

  logger.info(
    {
      eventId: event.id,
      sessionId: session.id,
      paymentStatus: session.payment_status,
      metadata: session.metadata,
    },
    "Procesando checkout.session.completed",
  );

  // Validar que el pago fue exitoso
  if (session.payment_status !== "paid") {
    logger.warn(
      {
        eventId: event.id,
        sessionId: session.id,
        paymentStatus: session.payment_status,
      },
      "Checkout session no tiene payment_status=paid, saltando creación de booking",
    );
    return;
  }

  // Extraer metadata del PaymentIntent
  const paymentIntentId = session.payment_intent as string | null;
  if (!paymentIntentId) {
    logger.error(
      {
        eventId: event.id,
        sessionId: session.id,
      },
      "Checkout session no tiene payment_intent, no se puede crear booking",
    );
    return;
  }

  // Obtener el PaymentIntent para acceder a su metadata
  const stripeClientInstance = stripeClient;
  if (!stripeClientInstance) {
    throw new Error("Stripe client no está configurado");
  }

  const paymentIntent =
    await stripeClientInstance.paymentIntents.retrieve(paymentIntentId);
  const metadata = paymentIntent.metadata;

  logger.info(
    {
      eventId: event.id,
      paymentIntentId,
      metadata,
    },
    "PaymentIntent metadata recuperado",
  );

  // Validar metadata requerido
  const serviceId = metadata.serviceId;
  const customerEmail =
    metadata.customerEmail || session.customer_details?.email;
  const customerFullName =
    metadata.customerFullName || session.customer_details?.name;
  const scheduledFor = metadata.scheduledFor;

  if (!serviceId) {
    logger.error(
      {
        eventId: event.id,
        paymentIntentId,
        metadata,
      },
      "Metadata.serviceId faltante, no se puede crear booking",
    );
    return;
  }

  if (!customerEmail) {
    logger.error(
      {
        eventId: event.id,
        paymentIntentId,
        metadata,
      },
      "customerEmail faltante, no se puede crear booking",
    );
    return;
  }

  // Buscar o crear cliente
  const userRepo = getUserRepository();
  let customer = await userRepo.findByEmail(customerEmail);

  if (!customer) {
    // Crear cliente nuevo
    const bcrypt = await import("bcryptjs");
    const tempPassword = randomUUID();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    customer = await userRepo.create({
      email: customerEmail,
      fullName: customerFullName || customerEmail.split("@")[0] || "Cliente",
      role: "CLIENT",
      passwordHash,
      isActive: true,
    });

    logger.info(
      {
        customerId: customer.id,
        email: customerEmail,
        fullName: customerFullName,
      },
      "Cliente creado automáticamente desde Stripe checkout",
    );
  }

  // Verificar que el servicio existe
  const serviceRepo = getServiceRepository();
  const service = await serviceRepo.findById(serviceId);

  if (!service) {
    logger.error(
      {
        eventId: event.id,
        serviceId,
      },
      "Service no encontrado, no se puede crear booking",
    );
    return;
  }

  // Obtener la primera propiedad del cliente o usar una por defecto
  const propertyRepo = getPropertyRepository();
  const properties = await propertyRepo.findByOwner(customer.id);
  let propertyId = properties[0]?.id;

  // Si el cliente no tiene propiedades, crear una temporal
  if (!propertyId) {
    const tempProperty = await propertyRepo.create({
      label: `Propiedad de ${customer.fullName}`,
      addressLine: "Dirección pendiente",
      city: "Miami",
      state: "FL",
      zipCode: "33101",
      type: "RESIDENTIAL",
      ownerId: customer.id,
    });
    propertyId = tempProperty.id;

    logger.info(
      {
        propertyId: tempProperty.id,
        customerId: customer.id,
      },
      "Propiedad temporal creada para booking de Stripe",
    );
  }

  // Crear el booking
  const bookingRepo = getBookingRepository();
  const scheduledAt = scheduledFor
    ? new Date(scheduledFor)
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default: 1 semana después

  const bookingPayload: BookingCreateInput = {
    code: `BRISA-${randomUUID().slice(0, 8)}`,
    scheduledAt,
    durationMin: service.durationMin,
    status: "CONFIRMED" as BookingStatus,
    totalAmount: Number(service.basePrice),
    serviceId: service.id,
    propertyId,
    customerId: customer.id,
    ...(metadata.notes ? { notes: metadata.notes } : {}),
  };

  const booking = await bookingRepo.create(bookingPayload);

  logger.info(
    {
      bookingId: booking.id,
      bookingCode: booking.code,
      customerId: customer.id,
      propertyId,
      serviceId: service.id,
      paymentIntentId,
    },
    "Booking creado exitosamente desde Stripe checkout",
  );

  // Notificar al equipo de operaciones
  const notificationRepo = getNotificationRepository();
  const coordinators = await userRepo.findActiveByRoles([
    "ADMIN",
    "COORDINATOR",
  ]);

  for (const coordinator of coordinators) {
    await notificationRepo.createNotification({
      userId: coordinator.id,
      type: NotificationType.BOOKING_CREATED,
      message: `Nueva reserva confirmada desde pago Stripe: ${booking.code} - ${service.name} para ${customer.fullName}`,
    });
  }
}

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
