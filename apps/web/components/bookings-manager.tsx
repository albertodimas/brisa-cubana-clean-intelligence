"use client";

import { useEffect, useMemo, useState } from "react";
import type { QueryParams } from "@/hooks/use-paginated-resource";
import { Button } from "./ui/button";
import { FilterChips, type FilterChip } from "./ui/filter-chips";
import { Pagination } from "./ui/pagination";
import { SearchBar } from "./ui/search-bar";
import { Skeleton } from "./ui/skeleton";
import type { Booking, PaginationInfo, Property, Service } from "@/lib/api";

type ActionResult = {
  success?: string;
  error?: string;
};

type StatusFilter =
  | "ALL"
  | "PENDING"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

type BookingsManagerProps = {
  bookings: Booking[];
  pageInfo: PaginationInfo;
  isLoading: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => Promise<void> | void;
  onUpdate: (bookingId: string, formData: FormData) => Promise<ActionResult>;
  services: Service[];
  properties: Property[];
  formatDateTime: (iso: string) => string;
  currentQuery: QueryParams;
  setQuery: (query: QueryParams) => Promise<void>;
  resetQuery: () => Promise<void>;
  refresh: () => Promise<void>;
  onToast: (message: string, type: "success" | "error") => void;
};

export function BookingsManager({
  bookings,
  pageInfo,
  isLoading,
  isLoadingMore,
  onLoadMore,
  onUpdate,
  services,
  properties,
  formatDateTime,
  currentQuery,
  setQuery,
  resetQuery,
  refresh,
  onToast,
}: BookingsManagerProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>(
    typeof currentQuery.search === "string" ? String(currentQuery.search) : "",
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    typeof currentQuery.status === "string" &&
      [
        "PENDING",
        "CONFIRMED",
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELLED",
      ].includes(currentQuery.status)
      ? (currentQuery.status as StatusFilter)
      : "ALL",
  );
  const [fromDate, setFromDate] = useState<string>(
    typeof currentQuery.from === "string" ? String(currentQuery.from) : "",
  );
  const [toDate, setToDate] = useState<string>(
    typeof currentQuery.to === "string" ? String(currentQuery.to) : "",
  );

  // Sync internal state with currentQuery
  useEffect(() => {
    const nextSearch =
      typeof currentQuery.search === "string"
        ? String(currentQuery.search)
        : "";
    setSearchTerm((prev) => (prev === nextSearch ? prev : nextSearch));
  }, [currentQuery.search]);

  useEffect(() => {
    const nextStatus =
      typeof currentQuery.status === "string" &&
      [
        "PENDING",
        "CONFIRMED",
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELLED",
      ].includes(currentQuery.status)
        ? (currentQuery.status as StatusFilter)
        : "ALL";
    setStatusFilter((prev) => (prev === nextStatus ? prev : nextStatus));
  }, [currentQuery.status]);

  useEffect(() => {
    const nextFrom =
      typeof currentQuery.from === "string" ? String(currentQuery.from) : "";
    setFromDate((prev) => (prev === nextFrom ? prev : nextFrom));
  }, [currentQuery.from]);

  useEffect(() => {
    const nextTo =
      typeof currentQuery.to === "string" ? String(currentQuery.to) : "";
    setToDate((prev) => (prev === nextTo ? prev : nextTo));
  }, [currentQuery.to]);

  // Update query when filters change
  useEffect(() => {
    const query: QueryParams = {};
    if (searchTerm.trim()) {
      query.search = searchTerm.trim();
    }
    if (statusFilter !== "ALL") {
      query.status = statusFilter;
    }
    if (fromDate) {
      query.from = fromDate;
    }
    if (toDate) {
      query.to = toDate;
    }
    void setQuery(query);
  }, [searchTerm, statusFilter, fromDate, toDate, setQuery]);

  const hasBookings = bookings.length > 0;

  const filterChips = useMemo<FilterChip[]>(() => {
    const chips: FilterChip[] = [];

    if (searchTerm.trim()) {
      chips.push({
        key: "search",
        label: "Búsqueda",
        value: searchTerm.trim(),
      });
    }
    if (statusFilter !== "ALL") {
      chips.push({
        key: "status",
        label: "Estado",
        value: statusFilter,
      });
    }
    if (fromDate) {
      chips.push({ key: "from", label: "Desde", value: fromDate });
    }
    if (toDate) {
      chips.push({ key: "to", label: "Hasta", value: toDate });
    }
    return chips;
  }, [searchTerm, statusFilter, fromDate, toDate]);

  const handleRemoveFilter = (key: string) => {
    if (key === "search") {
      setSearchTerm("");
    } else if (key === "status") {
      setStatusFilter("ALL");
    } else if (key === "from") {
      setFromDate("");
    } else if (key === "to") {
      setToDate("");
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
    setFromDate("");
    setToDate("");
    void resetQuery();
  };

  async function handleBookingUpdate(bookingId: string, formData: FormData) {
    setUpdatingId(bookingId);
    const result = await onUpdate(bookingId, formData);
    setUpdatingId(null);
    if (result.error) {
      onToast(result.error, "error");
    } else if (result.success) {
      onToast(result.success, "success");
      await refresh();
    }
  }

  return (
    <section className="ui-stack ui-stack--lg">
      <h3 className="ui-section-title">Reservas programadas</h3>
      <div className="flex flex-col gap-3">
        <div className="w-full sm:max-w-xs">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar por código, cliente o propiedad..."
            isLoading={isLoading}
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <label className="ui-field">
            <span className="ui-field__label">Estado</span>
            <select
              data-testid="booking-status-filter"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
              className="ui-input"
            >
              <option value="ALL">Todos</option>
              <option value="PENDING">Pendiente</option>
              <option value="CONFIRMED">Confirmada</option>
              <option value="IN_PROGRESS">En curso</option>
              <option value="COMPLETED">Completada</option>
              <option value="CANCELLED">Cancelada</option>
            </select>
          </label>

          <label className="ui-field">
            <span className="ui-field__label">Desde</span>
            <input
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              className="ui-input"
            />
          </label>

          <label className="ui-field">
            <span className="ui-field__label">Hasta</span>
            <input
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              className="ui-input"
            />
          </label>
        </div>
        <FilterChips
          filters={filterChips}
          onRemove={handleRemoveFilter}
          onClearAll={filterChips.length > 1 ? handleClearFilters : undefined}
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="ui-panel-surface">
              <Skeleton className="h-5 w-48 mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      ) : !hasBookings ? (
        <p className="ui-helper-text">
          {filterChips.length > 0
            ? "No hay reservas que coincidan con los filtros seleccionados."
            : "No hay reservas disponibles."}
        </p>
      ) : (
        <div className="grid gap-4">
          {bookings.map((booking) => (
            <form
              key={booking.id}
              data-testid="booking-card"
              className="ui-panel-surface ui-panel-surface--muted grid gap-4"
              action={async (formData) => {
                await handleBookingUpdate(booking.id, formData);
              }}
            >
              <div className="flex flex-wrap justify-between gap-3">
                <strong>
                  {booking.code} · {booking.service.name}
                </strong>
                <span className="text-sm text-brisa-200">
                  Cliente:{" "}
                  {booking.customer?.fullName ??
                    booking.customer?.email ??
                    "N/A"}
                </span>
              </div>

              <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                <label className="ui-field">
                  <span className="ui-field__label">Fecha y hora</span>
                  <input
                    name="bookingScheduledAt"
                    type="datetime-local"
                    defaultValue={formatDateTime(booking.scheduledAt)}
                    className="ui-input"
                  />
                </label>
                <label className="ui-field">
                  <span className="ui-field__label">Duración (min)</span>
                  <input
                    name="bookingDuration"
                    type="number"
                    min="30"
                    step="15"
                    defaultValue={booking.durationMin}
                    className="ui-input"
                  />
                </label>
                <label className="ui-field">
                  <span className="ui-field__label">Estado</span>
                  <select
                    name="bookingStatus"
                    defaultValue={booking.status}
                    className="ui-input"
                  >
                    <option value="PENDING">Pendiente</option>
                    <option value="CONFIRMED">Confirmada</option>
                    <option value="IN_PROGRESS">En curso</option>
                    <option value="COMPLETED">Completada</option>
                    <option value="CANCELLED">Cancelada</option>
                  </select>
                </label>
                <label className="ui-field">
                  <span className="ui-field__label">Servicio</span>
                  <select
                    name="bookingService"
                    defaultValue={booking.service.id}
                    className="ui-input"
                  >
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="ui-field">
                  <span className="ui-field__label">Propiedad</span>
                  <select
                    name="bookingProperty"
                    defaultValue={booking.property.id}
                    className="ui-input"
                  >
                    {properties.map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="ui-field">
                <span className="ui-field__label">Notas</span>
                <textarea
                  name="bookingNotes"
                  rows={3}
                  defaultValue={booking.notes ?? ""}
                  className="ui-input ui-input--textarea"
                />
              </label>

              <Button
                type="submit"
                variant="ghost"
                className="max-w-fit"
                isLoading={updatingId === booking.id}
                disabled={updatingId === booking.id}
              >
                {updatingId === booking.id
                  ? "Guardando..."
                  : "Actualizar reserva"}
              </Button>
            </form>
          ))}
          <Pagination
            count={bookings.length}
            hasMore={pageInfo.hasMore}
            isLoading={isLoadingMore}
            onLoadMore={onLoadMore}
            label="reservas"
          />
        </div>
      )}
    </section>
  );
}
