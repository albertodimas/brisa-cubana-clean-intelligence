import { PrismaClient } from "@prisma/client";
import { ServiceRepository } from "./repositories/service-repository.js";
import { BookingRepository } from "./repositories/booking-repository.js";

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
} as const;

/**
 * Inicializa el contenedor con los servicios por defecto
 */
export function initializeContainer(): void {
  // Registrar PrismaClient
  container.register(ServiceKeys.PRISMA, () => {
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "error", "warn"]
          : ["error"],
    });

    return prisma;
  });

  // Registrar Database URL (para casos edge donde se necesita la URL directa)
  container.register(ServiceKeys.DATABASE_URL, () => process.env.DATABASE_URL);

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
