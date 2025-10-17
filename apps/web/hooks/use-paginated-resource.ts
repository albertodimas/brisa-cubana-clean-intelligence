"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import type { PaginatedResult, PaginationInfo } from "@/lib/api";

type QueryValue = string | number | boolean | null | undefined;
export type QueryParams = Record<string, QueryValue>;

type UsePaginatedResourceOptions<T> = {
  initial: PaginatedResult<T>;
  endpoint: string;
  initialQuery?: QueryParams;
  debounceMs?: number;
};

type PaginatedActions<T> = {
  items: T[];
  pageInfo: PaginationInfo;
  isLoading: boolean;
  isLoadingMore: boolean;
  currentQuery: QueryParams;
  refresh: (query?: QueryParams) => Promise<void>;
  loadMore: () => Promise<void>;
  setQuery: (query: QueryParams) => Promise<void>;
  resetQuery: () => Promise<void>;
};

function buildQueryString(params: QueryParams, cursor?: string | null): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, String(value));
    }
  });
  if (cursor) {
    searchParams.set("cursor", cursor);
  }
  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
}

function normalizePagination(pagination?: PaginationInfo): PaginationInfo {
  return {
    limit: pagination?.limit ?? 0,
    cursor: pagination?.cursor ?? null,
    nextCursor: pagination?.nextCursor ?? null,
    hasMore: pagination?.hasMore ?? false,
  };
}

function normalizeQuery(query: QueryParams = {}): QueryParams {
  const normalized: QueryParams = {};
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }
    normalized[key] = value;
  });
  return normalized;
}

function queriesAreEqual(a: QueryParams, b: QueryParams): boolean {
  const normalizeAndSort = (query: QueryParams) =>
    Object.entries(normalizeQuery(query))
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([key, value]) => [key, value]);

  const aEntries = normalizeAndSort(a);
  const bEntries = normalizeAndSort(b);
  return JSON.stringify(aEntries) === JSON.stringify(bEntries);
}

export function usePaginatedResource<T>({
  initial,
  endpoint,
  initialQuery = {},
}: UsePaginatedResourceOptions<T>): PaginatedActions<T> {
  const [items, setItems] = useState<T[]>(initial.items);
  const [pageInfo, setPageInfo] = useState<PaginationInfo>(
    normalizePagination(initial.pageInfo),
  );
  const [currentQuery, setCurrentQuery] = useState<QueryParams>(
    normalizeQuery(initialQuery),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const requestTokenRef = useRef(0);

  const fetchPage = useCallback(
    async ({
      query = currentQuery,
      cursor,
      append = false,
    }: {
      query?: QueryParams;
      cursor?: string | null;
      append?: boolean;
    }) => {
      const requestToken = requestTokenRef.current + 1;
      requestTokenRef.current = requestToken;
      const normalizedQuery = normalizeQuery(query ?? {});
      const qs = buildQueryString(normalizedQuery, cursor ?? undefined);
      try {
        const response = await fetch(`${endpoint}${qs}`, {
          credentials: "include",
        });
        if (!response.ok) {
          console.error(
            `[usePaginatedResource] Request to ${endpoint}${qs} failed with status ${response.status}`,
          );
          return;
        }
        const json = (await response.json()) as {
          data: T[];
          pagination?: PaginationInfo;
        };
        const parsedPagination = normalizePagination(json.pagination);
        const pagination: PaginationInfo = {
          ...parsedPagination,
          limit: parsedPagination.limit || json.data.length,
        };

        if (requestToken !== requestTokenRef.current) {
          return;
        }

        setItems((prev) => (append ? [...prev, ...json.data] : json.data));
        setPageInfo(pagination);
        setCurrentQuery(normalizedQuery);
      } catch (error) {
        console.error(
          `[usePaginatedResource] Request to ${endpoint}${qs} threw`,
          error,
        );
      }
    },
    [currentQuery, endpoint],
  );

  const refresh = useCallback(
    async (query?: QueryParams) => {
      setIsLoading(true);
      try {
        await fetchPage({ query, append: false });
      } finally {
        setIsLoading(false);
      }
    },
    [fetchPage],
  );

  const setQuery = useCallback(
    async (query: QueryParams) => {
      const normalized = normalizeQuery(query);
      const shouldResetCursor = !queriesAreEqual(normalized, currentQuery);
      if (!shouldResetCursor) {
        return;
      }
      await fetchPage({ query: normalized, cursor: null, append: false });
    },
    [currentQuery, fetchPage, normalizeQuery, queriesAreEqual],
  );

  const loadMore = useCallback(async () => {
    if (!pageInfo.hasMore || isLoadingMore) {
      return;
    }
    setIsLoadingMore(true);
    try {
      await fetchPage({
        cursor: pageInfo.nextCursor,
        append: true,
      });
    } finally {
      setIsLoadingMore(false);
    }
  }, [fetchPage, isLoadingMore, pageInfo.hasMore, pageInfo.nextCursor]);

  const resetQuery = useCallback(async () => {
    await fetchPage({
      query: normalizeQuery(initialQuery),
      cursor: null,
      append: false,
    });
  }, [fetchPage, initialQuery]);

  return useMemo(
    () => ({
      items,
      pageInfo,
      isLoading,
      isLoadingMore,
      currentQuery,
      refresh,
      loadMore,
      setQuery,
      resetQuery,
    }),
    [
      items,
      pageInfo,
      isLoading,
      isLoadingMore,
      currentQuery,
      refresh,
      loadMore,
      setQuery,
      resetQuery,
    ],
  );
}
