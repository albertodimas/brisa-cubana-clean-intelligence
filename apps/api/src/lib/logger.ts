import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";
const isDevelopment = process.env.NODE_ENV === "development";

/**
 * Logger estructurado usando Pino
 *
 * En desarrollo: formato pretty con colores
 * En producción: JSON estructurado para parsing
 *
 * Niveles: trace, debug, info, warn, error, fatal
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),

  // En desarrollo, usar pino-pretty para mejor legibilidad
  transport: isDevelopment
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss.l",
          ignore: "pid,hostname",
          singleLine: false,
        },
      }
    : undefined,

  // Configuración base
  base: {
    env: process.env.NODE_ENV || "development",
    service: "brisa-api",
  },

  // Serializers para objetos comunes
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
  },

  // Timestamp ISO8601
  timestamp: pino.stdTimeFunctions.isoTime,

  // Redact de campos sensibles
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "res.headers['set-cookie']",
      "password",
      "passwordHash",
      "token",
      "secret",
      "*.password",
      "*.passwordHash",
      "*.token",
      "*.secret",
    ],
    censor: "[REDACTED]",
  },
});

/**
 * Logger para requests HTTP con Hono
 */
export function createHttpLogger() {
  return {
    /**
     * Log de request incoming
     */
    logRequest: (
      method: string,
      path: string,
      context: Record<string, unknown> = {},
    ) => {
      logger.info(
        {
          type: "http_request",
          method,
          path,
          ...context,
        },
        `${method} ${path}`,
      );
    },

    /**
     * Log de response
     */
    logResponse: (
      method: string,
      path: string,
      status: number,
      durationMs: number,
      context: Record<string, unknown> = {},
    ) => {
      const level = status >= 500 ? "error" : status >= 400 ? "warn" : "info";

      logger[level](
        {
          type: "http_response",
          method,
          path,
          status,
          durationMs,
          ...context,
        },
        `${method} ${path} ${status} ${durationMs}ms`,
      );
    },

    /**
     * Log de error en request
     */
    logError: (
      method: string,
      path: string,
      error: Error,
      context: Record<string, unknown> = {},
    ) => {
      logger.error(
        {
          type: "http_error",
          method,
          path,
          err: error,
          ...context,
        },
        `${method} ${path} - ${error.message}`,
      );
    },
  };
}

/**
 * Logger para operaciones de base de datos
 */
export const dbLogger = logger.child({ component: "database" });

/**
 * Logger para autenticación
 */
export const authLogger = logger.child({ component: "auth" });

/**
 * Logger para rate limiting
 */
export const rateLimitLogger = logger.child({ component: "rate-limit" });

/**
 * Helper para log de inicio de servidor
 */
export function logServerStart(port: number) {
  logger.info(
    {
      type: "server_start",
      port,
      nodeVersion: process.version,
      env: process.env.NODE_ENV,
    },
    `🚀 API server running on http://localhost:${port}`,
  );
}

/**
 * Helper para log de operaciones de negocio
 */
export function logBusinessEvent(
  eventType: string,
  details: Record<string, unknown>,
) {
  logger.info(
    {
      type: "business_event",
      eventType,
      ...details,
    },
    `Business event: ${eventType}`,
  );
}
