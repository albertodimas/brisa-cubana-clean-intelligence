"use client";

import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import type { Booking, PaginationInfo, Property, Service } from "@/lib/api";

type BookingFilterInput = {
  status: string;
  from: string;
  to: string;
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

  return (
    <section className="ui-stack ui-stack--lg">
      <h3 className="ui-section-title">Reservas programadas</h3>
      <div className="flex flex-wrap gap-4">
        <label className="ui-field">
          <span className="ui-field__label">Estado</span>
          <select
            data-testid="booking-status-filter"
            value={filters.status}
            onChange={(event) =>
              onFiltersChange({ status: event.target.value })
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
            value={filters.from}
            onChange={(event) => onFiltersChange({ from: event.target.value })}
            className="ui-input"
          />
        </label>

        <label className="ui-field">
          <span className="ui-field__label">Hasta</span>
          <input
            type="date"
            value={filters.to}
            onChange={(event) => onFiltersChange({ to: event.target.value })}
            className="ui-input"
          />
        </label>
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
          No hay reservas que coincidan con los filtros seleccionados.
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
        </div>
      )}

      {pageInfo.hasMore ? (
        <Button
          type="button"
          variant="ghost"
          className="max-w-fit"
          isLoading={isLoadingMore}
          disabled={isLoadingMore}
          onClick={() => onLoadMore()}
        >
          Cargar más reservas
        </Button>
      ) : null}
    </section>
  );
}
