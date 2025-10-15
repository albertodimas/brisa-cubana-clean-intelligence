"use client";

import { Button } from "./ui/button";
import { FilterChips, type FilterChip } from "./ui/filter-chips";
import { Pagination } from "./ui/pagination";
import { SearchBar } from "./ui/search-bar";
import { Skeleton } from "./ui/skeleton";
import type { Booking, PaginationInfo, Property, Service } from "@/lib/api";

type BookingFilterInput = {
  status: string;
  from: string;
  to: string;
  search: string;
};

type BookingsManagerProps = {
  filters: BookingFilterInput;
  onFiltersChange: (next: Partial<BookingFilterInput>) => Promise<void> | void;
  bookings: Booking[];
  pageInfo: PaginationInfo;
  isLoading: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => Promise<void> | void;
  onUpdate: (bookingId: string, formData: FormData) => Promise<void>;
  updatingId: string | null;
  services: Service[];
  properties: Property[];
  formatDateTime: (iso: string) => string;
};

export function BookingsManager({
  filters,
  onFiltersChange,
  bookings,
  pageInfo,
  isLoading,
  isLoadingMore,
  onLoadMore,
  onUpdate,
  updatingId,
  services,
  properties,
  formatDateTime,
}: BookingsManagerProps) {
  const hasBookings = bookings.length > 0;
  const filterChips: FilterChip[] = [];

  if (filters.search.trim()) {
    filterChips.push({
      key: "search",
      label: "Búsqueda",
      value: filters.search.trim(),
    });
  }
  if (filters.status !== "ALL") {
    filterChips.push({
      key: "status",
      label: "Estado",
      value: filters.status,
    });
  }
  if (filters.from) {
    filterChips.push({ key: "from", label: "Desde", value: filters.from });
  }
  if (filters.to) {
    filterChips.push({ key: "to", label: "Hasta", value: filters.to });
  }

  return (
    <section className="ui-stack ui-stack--lg">
      <h3 className="ui-section-title">Reservas programadas</h3>
      <div className="flex flex-col gap-3">
        <div className="w-full sm:max-w-xs">
          <SearchBar
            value={filters.search}
            onChange={async (value) => {
              await onFiltersChange({ search: value });
            }}
            placeholder="Buscar por código, cliente o propiedad..."
            isLoading={isLoading}
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <label className="ui-field">
            <span className="ui-field__label">Estado</span>
            <select
              data-testid="booking-status-filter"
              value={filters.status}
              onChange={async (event) => {
                await onFiltersChange({ status: event.target.value });
              }}
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
              value={filters.from}
              onChange={async (event) => {
                await onFiltersChange({ from: event.target.value });
              }}
              className="ui-input"
            />
          </label>

          <label className="ui-field">
            <span className="ui-field__label">Hasta</span>
            <input
              type="date"
              value={filters.to}
              onChange={async (event) => {
                await onFiltersChange({ to: event.target.value });
              }}
              className="ui-input"
            />
          </label>
        </div>
        <FilterChips
          filters={filterChips}
          onRemove={async (key) => {
            const next: Partial<BookingFilterInput> = {};
            if (key === "search") next.search = "";
            if (key === "status") next.status = "ALL";
            if (key === "from") next.from = "";
            if (key === "to") next.to = "";
            await onFiltersChange(next);
          }}
          onClearAll={
            filterChips.length > 1
              ? async () => {
                  await onFiltersChange({
                    search: "",
                    status: "ALL",
                    from: "",
                    to: "",
                  });
                }
              : undefined
          }
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
                await onUpdate(booking.id, formData);
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
