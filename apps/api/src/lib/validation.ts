/**
 * Validation utilities for Zod schemas
 */

import type { Context } from "hono";
import type { z } from "zod";

/**
 * Validate request data against a Zod schema
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @param c - Hono context
 * @returns Validation result with parsed data or error response
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  c: Context,
): { success: true; data: T } | { success: false; response: Response } {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      response: c.json({ error: parsed.error.flatten() }, 400),
    };
  }
  return { success: true, data: parsed.data };
}
