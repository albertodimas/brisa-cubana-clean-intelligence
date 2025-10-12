/**
 * Pagination utilities for cursor-based pagination
 */

import type { Context } from "hono";
import { z } from "zod";

/**
 * Standard pagination query schema
 */
export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  cursor: z.string().cuid().optional(),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

/**
 * Pagination result structure
 */
export type PaginationInfo = {
  limit: number;
  cursor: string | null;
  nextCursor: string | null;
  hasMore: boolean;
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: PaginationInfo;
};

/**
 * Parse pagination query parameters from request
 * @param c - Hono context
 * @returns Parsed pagination query or error response
 */
export function parsePaginationQuery(
  c: Context,
):
  | { success: true; data: PaginationQuery }
  | { success: false; response: Response } {
  const url = new URL(c.req.url, "http://localhost");
  const parsed = paginationQuerySchema.safeParse(
    Object.fromEntries(url.searchParams.entries()),
  );

  if (!parsed.success) {
    return {
      success: false,
      response: c.json({ error: parsed.error.flatten() }, 400),
    };
  }

  return { success: true, data: parsed.data };
}

/**
 * Build paginated response from items
 * @param items - Array of items (should contain limit + 1 items)
 * @param limit - Page size limit
 * @param cursor - Current cursor
 * @returns Paginated response
 */
export function buildPaginatedResponse<T extends { id: string }>(
  items: T[],
  limit: number,
  cursor: string | null | undefined,
): PaginatedResponse<T> {
  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? data[data.length - 1]?.id : null;

  return {
    data,
    pagination: {
      limit,
      cursor: cursor ?? null,
      nextCursor,
      hasMore,
    },
  };
}
