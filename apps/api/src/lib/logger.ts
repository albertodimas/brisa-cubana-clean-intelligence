import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";
const isDevelopment = process.env.NODE_ENV === "development";
const isTest = process.env.NODE_ENV === "test";

// Create the logger instance
export const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),

  // Pretty print in development, JSON in production
  transport: isDevelopment
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss Z",
          ignore: "pid,hostname",
          singleLine: false,
        },
      }
    : undefined,

  // Redact sensitive information
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "req.body.password",
      "req.body.passwordHash",
      "res.headers['set-cookie']",
      "*.passwordHash",
      "*.password",
      "*.token",
      "*.accessToken",
      "*.refreshToken",
    ],
    remove: true,
  },

  // Base context for all logs
  base: {
    env: process.env.NODE_ENV,
    service: "brisa-api",
  },

  // Silence logs in test environment unless explicitly enabled
  enabled: !isTest || process.env.ENABLE_TEST_LOGS === "true",

  // Timestamp format
  timestamp: pino.stdTimeFunctions.isoTime,

  // Serializers for common objects
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
  },
});

/**
 * Create a child logger with additional context
 */
export function createChildLogger(context: Record<string, unknown>) {
  return logger.child(context);
}

/**
 * Log levels:
 * - trace: Very detailed debugging
 * - debug: Detailed debugging information
 * - info: General informational messages
 * - warn: Warning messages for potentially harmful situations
 * - error: Error events that might still allow the app to continue
 * - fatal: Very severe errors that will presumably lead to abort
 */

// Export typed logger instance
export type Logger = typeof logger;
