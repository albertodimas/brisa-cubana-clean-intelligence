import { type Context, type Next } from "hono";
import { createHttpLogger } from "../lib/logger.js";

const httpLogger = createHttpLogger();

/**
 * Middleware de logging HTTP estructurado
 *
 * Loguea:
 * - Request incoming con método y path
 * - Response con status, duración y método
 * - Errores con stack trace
 */
export async function loggingMiddleware(c: Context, next: Next) {
  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;

  // Log request incoming (solo en modo debug para no saturar)
  const userId = c.get("userId") as string | undefined;
  const context: Record<string, unknown> = {};

  if (userId) {
    context.userId = userId;
  }

  try {
    await next();

    // Log response
    const duration = Date.now() - start;
    const status = c.res.status;

    httpLogger.logResponse(method, path, status, duration, context);
  } catch (error) {
    // Log error
    const duration = Date.now() - start;

    if (error instanceof Error) {
      httpLogger.logError(method, path, error, {
        ...context,
        durationMs: duration,
      });
    }

    // Re-throw para que Hono maneje el error
    throw error;
  }
}
