"use client";

import type { Customer, PaginationInfo } from "@/lib/api";
import { Pagination } from "./ui/pagination";
import { Skeleton } from "./ui/skeleton";

type CustomersManagerProps = {
  customers: Customer[];
  pageInfo: PaginationInfo;
  isLoading: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => Promise<void> | void;
};

export function CustomersManager({
  customers,
  pageInfo,
  isLoading,
  isLoadingMore,
  onLoadMore,
}: CustomersManagerProps) {
  return (
    <section className="ui-stack">
      <h3 className="ui-section-title">Clientes registrados</h3>
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
        <p className="ui-helper-text">No hay clientes disponibles.</p>
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
