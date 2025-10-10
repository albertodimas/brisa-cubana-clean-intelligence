"use client";

import { useState, useCallback, type ReactNode } from "react";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { Skeleton } from "./skeleton";

type InfiniteListProps<T> = {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  getItemKey: (item: T, index: number) => string;
  pageSize?: number;
  emptyMessage?: string;
  loadingMessage?: string;
  className?: string;
  skeletonCount?: number;
};

export function InfiniteList<T>({
  items,
  renderItem,
  getItemKey,
  pageSize = 10,
  emptyMessage = "No hay elementos para mostrar.",
  loadingMessage = "Cargando más...",
  className = "",
  skeletonCount = 3,
}: InfiniteListProps<T>) {
  const [displayCount, setDisplayCount] = useState(pageSize);

  const hasMore = displayCount < items.length;
  const displayedItems = items.slice(0, displayCount);

  const loadMore = useCallback(() => {
    setDisplayCount((prev) => Math.min(prev + pageSize, items.length));
  }, [items.length, pageSize]);

  const sentinelRef = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore,
    isLoading: false,
    threshold: 0.8,
  });

  if (items.length === 0) {
    return <p className="text-brisa-200 dark:text-brisa-200">{emptyMessage}</p>;
  }

  return (
    <>
      <div className={className}>
        {displayedItems.map((item, index) => (
          <div key={getItemKey(item, index)}>{renderItem(item, index)}</div>
        ))}
      </div>

      {hasMore && (
        <>
          <div ref={sentinelRef} className="h-4" aria-hidden="true" />
          <div className="flex flex-col gap-3 mt-4">
            {Array.from({ length: skeletonCount }).map((_, i) => (
              <div
                key={i}
                className="p-4 rounded-lg bg-white dark:bg-brisa-800/60 border border-gray-200 dark:border-brisa-300/15"
              >
                <Skeleton className="h-5 w-40 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
            <p className="text-center text-sm text-gray-600 dark:text-brisa-400">
              {loadingMessage}
            </p>
          </div>
        </>
      )}
    </>
  );
}
