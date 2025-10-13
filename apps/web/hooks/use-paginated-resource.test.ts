import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PaginatedResult, PaginationInfo } from "@/lib/api";
import { usePaginatedResource } from "./use-paginated-resource";

const initialPageInfo: PaginationInfo = {
  limit: 2,
  cursor: null,
  nextCursor: "cursor-1",
  hasMore: true,
};

const initialResult: PaginatedResult<{ id: string }> = {
  items: [{ id: "a" }, { id: "b" }],
  pageInfo: initialPageInfo,
};

const endpoint = "/api/resources";

function mockFetchResponse<T>(data: T[], pagination?: Partial<PaginationInfo>) {
  return Promise.resolve({
    ok: true,
    json: async () => ({
      data,
      pagination: pagination ?? {
        limit: data.length,
        cursor: null,
        nextCursor: null,
        hasMore: false,
      },
    }),
  }) as Promise<Response>;
}

describe("usePaginatedResource", () => {
  const originalFetch = global.fetch;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    global.fetch = originalFetch;
    consoleErrorSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it("initializes with provided items and pagination", () => {
    const { result } = renderHook(() =>
      usePaginatedResource({
        initial: initialResult,
        endpoint,
      }),
    );

    expect(result.current.items).toHaveLength(2);
    expect(result.current.pageInfo).toMatchObject({
      hasMore: true,
      nextCursor: "cursor-1",
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isLoadingMore).toBe(false);
  });

  it("refreshes data with optional query params", async () => {
    const fetchMock = vi
      .fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>()
      .mockImplementation(() =>
        mockFetchResponse([{ id: "c" }], {
          limit: 1,
          cursor: "cursor-1",
          nextCursor: "cursor-2",
          hasMore: true,
        }),
      );
    global.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(() =>
      usePaginatedResource({
        initial: initialResult,
        endpoint,
      }),
    );

    await act(async () => {
      await result.current.refresh({ status: "PENDING" });
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/resources?status=PENDING",
      expect.objectContaining({ credentials: "include" }),
    );
    expect(result.current.items).toEqual([{ id: "c" }]);
    expect(result.current.pageInfo.nextCursor).toBe("cursor-2");
    expect(result.current.isLoading).toBe(false);
  });

  it("updates current query via setQuery and appends on loadMore", async () => {
    const fetchMock = vi
      .fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>()
      .mockImplementationOnce(() =>
        mockFetchResponse([{ id: "d" }], {
          limit: 1,
          cursor: "cursor-2",
          nextCursor: "cursor-3",
          hasMore: true,
        }),
      )
      .mockImplementationOnce(() =>
        mockFetchResponse([{ id: "e" }], {
          limit: 1,
          cursor: "cursor-3",
          nextCursor: null,
          hasMore: false,
        }),
      );
    global.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(() =>
      usePaginatedResource({
        initial: initialResult,
        endpoint,
        initialQuery: { status: "ALL" },
      }),
    );

    await act(async () => {
      await result.current.setQuery({ status: "CONFIRMED" });
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/resources?status=CONFIRMED",
      expect.any(Object),
    );
    expect(result.current.items).toEqual([{ id: "d" }]);
    expect(result.current.pageInfo.hasMore).toBe(true);

    await act(async () => {
      await result.current.loadMore();
    });

    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/resources?status=CONFIRMED&cursor=cursor-3",
      expect.any(Object),
    );
    expect(result.current.items).toEqual([{ id: "d" }, { id: "e" }]);
    expect(result.current.pageInfo.hasMore).toBe(false);
  });

  it("avoids loadMore when there are no more pages", async () => {
    const fetchMock =
      vi.fn<
        (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
      >();
    global.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(() =>
      usePaginatedResource({
        initial: {
          ...initialResult,
          pageInfo: { ...initialResult.pageInfo, hasMore: false },
        },
        endpoint,
      }),
    );

    await act(async () => {
      await result.current.loadMore();
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("logs an error when the request fails", async () => {
    const fetchMock = vi
      .fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>()
      .mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: "nope" }),
      } as unknown as Response);
    global.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(() =>
      usePaginatedResource({
        initial: initialResult,
        endpoint,
      }),
    );

    await act(async () => {
      await result.current.refresh();
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(result.current.items).toEqual(initialResult.items);
  });
});
