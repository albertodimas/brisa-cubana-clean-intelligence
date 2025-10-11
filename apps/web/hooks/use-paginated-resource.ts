"use client";

import { useState, useCallback, useMemo } from "react";
import type { PaginatedResult, PaginationInfo } from "@/lib/api";

type QueryValue = string | number | null | undefined;
type QueryParams = Record<string, QueryValue>;

type UsePaginatedResourceOptions<T> = {
  initial: PaginatedResult<T>;
  endpoint: string;
  initialQuery?: QueryParams;
};

type PaginatedActions<T> = {
  items: T[];
  pageInfo: PaginationInfo;
  isLoading: boolean;
  isLoadingMore: boolean;
  refresh: (query?: QueryParams) => Promise<void>;
  loadMore: () => Promise<void>;
  setQuery: (query: QueryParams) => Promise<void>;
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

export function usePaginatedResource<T>({
  initial,
  endpoint,
  initialQuery = {},
}: UsePaginatedResourceOptions<T>): PaginatedActions<T> {
  const [items, setItems] = useState<T[]>(initial.items);
  const [pageInfo, setPageInfo] = useState<PaginationInfo>(
    normalizePagination(initial.pageInfo),
  );
  const [currentQuery, setCurrentQuery] = useState<QueryParams>(initialQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

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
      const qs = buildQueryString(query, cursor ?? undefined);
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

        setItems((prev) => (append ? [...prev, ...json.data] : json.data));
        setPageInfo(pagination);
        setCurrentQuery(query);
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
      await refresh(query);
    },
    [refresh],
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

  return useMemo(
    () => ({
      items,
      pageInfo,
      isLoading,
      isLoadingMore,
      refresh,
      loadMore,
      setQuery,
    }),
    [items, pageInfo, isLoading, isLoadingMore, refresh, loadMore, setQuery],
  );
}
