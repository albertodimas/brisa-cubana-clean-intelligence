import { PrismaClient } from "@prisma/client";
import { ServiceRepository } from "./repositories/service-repository.js";
import { BookingRepository } from "./repositories/booking-repository.js";
import { PropertyRepository } from "./repositories/property-repository.js";
import { UserRepository } from "./repositories/user-repository.js";
import { CustomerRepository } from "./repositories/customer-repository.js";
import { NotificationRepository } from "./repositories/notification-repository.js";
import { MagicLinkTokenRepository } from "./repositories/magic-link-token-repository.js";
import { LeadRepository } from "./repositories/lead-repository.js";
import { StripeWebhookEventRepository } from "./repositories/stripe-webhook-event-repository.js";
import { prisma as prismaClient } from "./lib/prisma.js";
import { env } from "./lib/env.js";

/**
 * Dependency Injection Container
 *
 * Simple IoC container para gestionar dependencias de la aplicación.
 * Sigue el patrón Singleton para servicios compartidos.
 */

class Container {
  private static instance: Container;
  private services: Map<string, unknown> = new Map();

  private constructor() {
    // Constructor privado para Singleton
  }

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  /**
   * Registra un servicio en el contenedor
   */
  register<T>(key: string, factory: () => T): void {
    this.services.set(key, factory());
  }

  /**
   * Obtiene un servicio del contenedor
   */
  resolve<T>(key: string): T {
    const service = this.services.get(key);
    if (!service) {
      throw new Error(`Service '${key}' not found in container`);
    }
    return service as T;
  }

  /**
   * Verifica si un servicio está registrado
   */
  has(key: string): boolean {
    return this.services.has(key);
  }

  /**
   * Limpia todos los servicios (útil para testing)
   */
  clear(): void {
    this.services.clear();
  }
}

// Singleton instance
export const container = Container.getInstance();

// Service Keys (constantes para type safety)
export const ServiceKeys = {
  PRISMA: "prisma",
  DATABASE_URL: "databaseUrl",
  SERVICE_REPOSITORY: "serviceRepository",
  BOOKING_REPOSITORY: "bookingRepository",
  PROPERTY_REPOSITORY: "propertyRepository",
  USER_REPOSITORY: "userRepository",
  CUSTOMER_REPOSITORY: "customerRepository",
  NOTIFICATION_REPOSITORY: "notificationRepository",
  MAGIC_LINK_TOKEN_REPOSITORY: "magicLinkTokenRepository",
  LEAD_REPOSITORY: "leadRepository",
  STRIPE_WEBHOOK_EVENT_REPOSITORY: "stripeWebhookEventRepository",
} as const;

/**
 * Inicializa el contenedor con los servicios por defecto
 */
export function initializeContainer(): void {
  // Registrar PrismaClient (singleton compartido)
  container.register(ServiceKeys.PRISMA, () => prismaClient);

  // Registrar Database URL (para casos edge donde se necesita la URL directa)
  container.register(ServiceKeys.DATABASE_URL, () => env.DATABASE_URL);

  // Registrar Repositorios
  const prisma = container.resolve<PrismaClient>(ServiceKeys.PRISMA);

  container.register(
    ServiceKeys.SERVICE_REPOSITORY,
    () => new ServiceRepository(prisma),
  );

  container.register(
    ServiceKeys.BOOKING_REPOSITORY,
    () => new BookingRepository(prisma),
  );

  container.register(
    ServiceKeys.PROPERTY_REPOSITORY,
    () => new PropertyRepository(prisma),
  );

  container.register(
    ServiceKeys.USER_REPOSITORY,
    () => new UserRepository(prisma),
  );

  container.register(
    ServiceKeys.CUSTOMER_REPOSITORY,
    () => new CustomerRepository(prisma),
  );

  container.register(
    ServiceKeys.NOTIFICATION_REPOSITORY,
    () => new NotificationRepository(prisma),
  );

  container.register(
    ServiceKeys.MAGIC_LINK_TOKEN_REPOSITORY,
    () => new MagicLinkTokenRepository(prisma),
  );

  container.register(
    ServiceKeys.LEAD_REPOSITORY,
    () => new LeadRepository(prisma),
  );

  container.register(
    ServiceKeys.STRIPE_WEBHOOK_EVENT_REPOSITORY,
    () => new StripeWebhookEventRepository(prisma),
  );
}

/**
 * Helper para obtener PrismaClient de forma type-safe
 */
export function getPrisma(): PrismaClient {
  return container.resolve<PrismaClient>(ServiceKeys.PRISMA);
}

/**
 * Helper para obtener ServiceRepository de forma type-safe
 */
export function getServiceRepository(): ServiceRepository {
  return container.resolve<ServiceRepository>(ServiceKeys.SERVICE_REPOSITORY);
}

/**
 * Helper para obtener BookingRepository de forma type-safe
 */
export function getBookingRepository(): BookingRepository {
  return container.resolve<BookingRepository>(ServiceKeys.BOOKING_REPOSITORY);
}

export function getPropertyRepository(): PropertyRepository {
  return container.resolve<PropertyRepository>(ServiceKeys.PROPERTY_REPOSITORY);
}

export function getUserRepository(): UserRepository {
  return container.resolve<UserRepository>(ServiceKeys.USER_REPOSITORY);
}

export function getCustomerRepository(): CustomerRepository {
  return container.resolve<CustomerRepository>(ServiceKeys.CUSTOMER_REPOSITORY);
}

export function getNotificationRepository(): NotificationRepository {
  return container.resolve<NotificationRepository>(
    ServiceKeys.NOTIFICATION_REPOSITORY,
  );
}

export function getMagicLinkTokenRepository(): MagicLinkTokenRepository {
  return container.resolve<MagicLinkTokenRepository>(
    ServiceKeys.MAGIC_LINK_TOKEN_REPOSITORY,
  );
}

export function getLeadRepository(): LeadRepository {
  return container.resolve<LeadRepository>(ServiceKeys.LEAD_REPOSITORY);
}

export function getStripeWebhookEventRepository(): StripeWebhookEventRepository {
  return container.resolve<StripeWebhookEventRepository>(
    ServiceKeys.STRIPE_WEBHOOK_EVENT_REPOSITORY,
  );
}

/**
 * Cierra todas las conexiones de servicios (útil para shutdown graceful)
 */
export async function closeContainer(): Promise<void> {
  try {
    const prisma = container.resolve<PrismaClient>(ServiceKeys.PRISMA);
    await prisma.$disconnect();
  } catch {
    // Si prisma no está registrado, no hacer nada
  }
}
