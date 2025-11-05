import type { PrismaClient, StripeWebhookEvent, Prisma } from "@prisma/client";

/**
 * Repositorio para rastrear eventos de webhook de Stripe procesados
 * Previene procesamiento duplicado de webhooks en caso de reintentos
 */
export class StripeWebhookEventRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Registra un evento de webhook de Stripe
   * Usa upsert para ser idempotente en caso de reintentos
   */
  async recordEvent(
    stripeEventId: string,
    eventType: string,
    metadata?: Prisma.InputJsonValue,
  ): Promise<StripeWebhookEvent> {
    return await this.prisma.stripeWebhookEvent.upsert({
      where: { stripeEventId },
      create: {
        stripeEventId,
        eventType,
        metadata,
        processed: false,
      },
      update: {
        // No actualizar nada si ya existe - mantener el registro original
      },
    });
  }

  /**
   * Marca un evento como procesado exitosamente
   */
  async markAsProcessed(
    stripeEventId: string,
    metadata?: Prisma.InputJsonValue,
  ): Promise<StripeWebhookEvent> {
    return await this.prisma.stripeWebhookEvent.update({
      where: { stripeEventId },
      data: {
        processed: true,
        processedAt: new Date(),
        metadata,
      },
    });
  }

  /**
   * Marca un evento con error
   */
  async markAsError(
    stripeEventId: string,
    errorMessage: string,
  ): Promise<StripeWebhookEvent> {
    return await this.prisma.stripeWebhookEvent.update({
      where: { stripeEventId },
      data: {
        errorMessage,
        processedAt: new Date(),
      },
    });
  }

  /**
   * Verifica si un evento ya fue procesado
   * Retorna true si el evento existe y fue marcado como procesado
   */
  async wasProcessed(stripeEventId: string): Promise<boolean> {
    const event = await this.prisma.stripeWebhookEvent.findUnique({
      where: { stripeEventId },
      select: { processed: true },
    });

    return event?.processed ?? false;
  }

  /**
   * Busca un evento por su ID de Stripe
   */
  async findByStripeEventId(
    stripeEventId: string,
  ): Promise<StripeWebhookEvent | null> {
    return await this.prisma.stripeWebhookEvent.findUnique({
      where: { stripeEventId },
    });
  }
}
