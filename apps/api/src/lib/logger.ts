import pino from "pino";
import { env } from "../config/env";

const isProduction = env.nodeEnv === "production";
const isDevelopment = env.nodeEnv === "development";
const isTest = env.nodeEnv === "test";

// Create the logger instance
export const logger = pino({
  level: env.logLevel ?? (isProduction ? "info" : "debug"),

  // Pretty print in development, JSON in production
  // Only use pino-pretty if explicitly in development mode (not just non-production)
  transport:
    isDevelopment && (env.logger.usePretty ?? true)
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
    env: env.nodeEnv,
    service: "brisa-api",
  },

  // Silence logs in test environment unless explicitly enabled
  enabled: !isTest || env.logger.enableTestLogs === true,

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
