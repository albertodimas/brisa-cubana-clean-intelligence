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

const searchParamSchema = z
  .string()
  .optional()
  .transform((value) => {
    if (!value) {
      return undefined;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  });

const searchableQueryBaseSchema = paginationQuerySchema.extend({
  search: searchParamSchema,
});

export type SearchableQuery<
  T extends z.ZodObject<any> | undefined = undefined,
> = PaginationQuery & {
  search?: string;
} & (T extends z.ZodObject<any> ? z.infer<T> : Record<string, never>);

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
 * Parse pagination + search query parameters from request
 * @param c - Hono context
 * @param filterSchema - Optional Zod schema for additional filters
 * @returns Parsed searchable query or error response
 */
export function parseSearchableQuery<T extends z.ZodObject<any>>(
  c: Context,
  filterSchema?: T,
):
  | {
      success: true;
      data: SearchableQuery<T>;
    }
  | { success: false; response: Response } {
  const url = new URL(c.req.url, "http://localhost");
  const entries = Object.fromEntries(url.searchParams.entries());

  const schema = filterSchema
    ? searchableQueryBaseSchema.merge(filterSchema)
    : searchableQueryBaseSchema;

  const parsed = schema.safeParse(entries);

  if (!parsed.success) {
    return {
      success: false,
      response: c.json({ error: parsed.error.flatten() }, 400),
    };
  }

  return {
    success: true,
    data: parsed.data as SearchableQuery<T>,
  };
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
