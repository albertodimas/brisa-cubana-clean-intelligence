"use client";

import { useEffect, useState } from "react";
import type { QueryParams } from "@/hooks/use-paginated-resource";
import type { Customer, PaginationInfo } from "@/lib/api";
import { FilterChips } from "./ui/filter-chips";
import { Pagination } from "./ui/pagination";
import { SearchBar } from "./ui/search-bar";
import { Skeleton } from "./ui/skeleton";

type CustomersManagerProps = {
  customers: Customer[];
  pageInfo: PaginationInfo;
  isLoading: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => Promise<void> | void;
  currentQuery: QueryParams;
  setQuery: (query: QueryParams) => Promise<void>;
  resetQuery: () => Promise<void>;
};

export function CustomersManager({
  customers,
  pageInfo,
  isLoading,
  isLoadingMore,
  onLoadMore,
  currentQuery,
  setQuery,
  resetQuery,
}: CustomersManagerProps) {
  const [searchTerm, setSearchTerm] = useState<string>(
    typeof currentQuery.search === "string" ? String(currentQuery.search) : "",
  );

  useEffect(() => {
    const nextSearch =
      typeof currentQuery.search === "string"
        ? String(currentQuery.search)
        : "";
    if (nextSearch !== searchTerm) {
      setSearchTerm(nextSearch);
    }
  }, [currentQuery.search]);

  useEffect(() => {
    const query: QueryParams = {};
    if (searchTerm.trim()) {
      query.search = searchTerm.trim();
    }
    void setQuery(query);
  }, [searchTerm, setQuery]);

  const hasSearch = Boolean(searchTerm.trim());

  return (
    <section className="ui-stack">
      <h3 className="ui-section-title">Clientes registrados</h3>
      <div className="w-full sm:max-w-xs">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Buscar clientes..."
          isLoading={isLoading}
        />
      </div>
      <FilterChips
        filters={
          hasSearch
            ? [{ key: "search", label: "Búsqueda", value: searchTerm.trim() }]
            : []
        }
        onRemove={() => {
          setSearchTerm("");
        }}
        onClearAll={
          hasSearch
            ? () => {
                setSearchTerm("");
                void resetQuery();
              }
            : undefined
        }
      />
      {isLoading ? (
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="ui-panel-surface">
              <Skeleton className="h-5 w-48 mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      ) : customers.length === 0 ? (
        <p className="ui-helper-text">
          {hasSearch
            ? "No se encontraron clientes para la búsqueda aplicada."
            : "No hay clientes disponibles."}
        </p>
      ) : (
        <div className="ui-stack">
          <ul className="ui-panel-list">
            {customers.map((customer) => (
              <li
                key={customer.id}
                className="ui-panel-surface ui-panel-surface--muted flex flex-col gap-2"
              >
                <strong>{customer.fullName ?? "Cliente sin nombre"}</strong>
                <span className="ui-caption">{customer.email}</span>
              </li>
            ))}
          </ul>
          <Pagination
            count={customers.length}
            hasMore={pageInfo.hasMore}
            isLoading={isLoadingMore}
            onLoadMore={onLoadMore}
            label="clientes"
          />
        </div>
      )}
    </section>
  );
}
