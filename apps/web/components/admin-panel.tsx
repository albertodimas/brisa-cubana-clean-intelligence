"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import type { Session } from "next-auth";
import type {
  Booking,
  Customer,
  Property,
  Service,
  User,
  PaginatedResult,
} from "@/lib/api";
import { usePaginatedResource } from "@/hooks/use-paginated-resource";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Chip } from "./ui/chip";
import { Skeleton } from "./ui/skeleton";
import { useToast } from "./ui/toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { BookingsManager } from "./bookings-manager";
import { ServicesManager } from "./services-manager";
import { PropertiesManager } from "./properties-manager";
import { CustomersManager } from "./customers-manager";

type ActionResult = {
  success?: string;
  error?: string;
};

const USER_ROLES = ["ADMIN", "COORDINATOR", "STAFF", "CLIENT"] as const;

type BookingFilterState = {
  status: string;
  from: string;
  to: string;
};

type AdminPanelProps = {
  currentUser: Session["user"] | null;
  services: PaginatedResult<Service>;
  properties: PaginatedResult<Property>;
  bookings: PaginatedResult<Booking>;
  customers: PaginatedResult<Customer>;
  initialBookingFilters: {
    status: string;
    from?: string;
    to?: string;
  };
  createService: (formData: FormData) => Promise<ActionResult>;
  createProperty: (formData: FormData) => Promise<ActionResult>;
  createBooking: (formData: FormData) => Promise<ActionResult>;
  toggleService: (serviceId: string, active: boolean) => Promise<ActionResult>;
  updateService: (
    serviceId: string,
    formData: FormData,
  ) => Promise<ActionResult>;
  updateProperty: (
    propertyId: string,
    formData: FormData,
  ) => Promise<ActionResult>;
  updateBooking: (
    bookingId: string,
    formData: FormData,
  ) => Promise<ActionResult>;
  users: User[];
  updateUser: (userId: string, formData: FormData) => Promise<ActionResult>;
  toggleUserActive: (userId: string, active: boolean) => Promise<ActionResult>;
  logout: () => Promise<ActionResult>;
  isLoading?: boolean;
};

export function AdminPanel({
  currentUser,
  services,
  properties,
  bookings,
  customers,
  initialBookingFilters,
  createService,
  createProperty,
  createBooking,
  toggleService,
  updateService,
  updateProperty,
  updateBooking,
  users,
  updateUser,
  toggleUserActive,
  logout,
  isLoading = false,
}: AdminPanelProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const {
    items: serviceItems,
    pageInfo: servicePageInfo,
    isLoading: isServicesRefreshing,
    isLoadingMore: isLoadingMoreServices,
    loadMore: loadMoreServices,
    refresh: refreshServices,
  } = usePaginatedResource<Service>({
    initial: services,
    endpoint: "/api/services",
    initialQuery: { limit: services.pageInfo.limit },
  });

  const {
    items: propertyItems,
    pageInfo: propertyPageInfo,
    isLoading: isPropertiesRefreshing,
    isLoadingMore: isLoadingMoreProperties,
    loadMore: loadMoreProperties,
    refresh: refreshProperties,
  } = usePaginatedResource<Property>({
    initial: properties,
    endpoint: "/api/properties",
    initialQuery: { limit: properties.pageInfo.limit },
  });

  const {
    items: customerItems,
    pageInfo: customerPageInfo,
    isLoading: isCustomersRefreshing,
    isLoadingMore: isLoadingMoreCustomers,
    loadMore: loadMoreCustomers,
    refresh: refreshCustomers,
  } = usePaginatedResource<Customer>({
    initial: customers,
    endpoint: "/api/customers",
    initialQuery: { limit: customers.pageInfo.limit },
  });

  const BOOKINGS_PAGE_SIZE = 10;

  const buildBookingQuery = useCallback(
    (filters: BookingFilterState) => ({
      limit: BOOKINGS_PAGE_SIZE,
      status: filters.status !== "ALL" ? filters.status : "",
      from: filters.from || "",
      to: filters.to || "",
    }),
    [BOOKINGS_PAGE_SIZE],
  );

  const initialBookingFormFilters: BookingFilterState = useMemo(
    () => ({
      status: initialBookingFilters.status ?? "ALL",
      from: initialBookingFilters.from
        ? initialBookingFilters.from.slice(0, 10)
        : "",
      to: initialBookingFilters.to ? initialBookingFilters.to.slice(0, 10) : "",
    }),
    [initialBookingFilters],
  );

  const [bookingUpdatingId, setBookingUpdatingId] = useState<string | null>(
    null,
  );
  const [userUpdatingId, setUserUpdatingId] = useState<string | null>(null);
  const [bookingFilters, setBookingFilters] = useState<BookingFilterState>(
    initialBookingFormFilters,
  );
  const [isLoggingOut, setLoggingOut] = useState(false);
  const [isBookingPending, startBookingAction] = useTransition();

  const {
    items: bookingItems,
    pageInfo: bookingPageInfo,
    isLoading: isBookingsRefreshing,
    isLoadingMore: isLoadingMoreBookings,
    loadMore: loadMoreBookings,
    setQuery: setBookingQuery,
  } = usePaginatedResource<Booking>({
    initial: bookings,
    endpoint: "/api/bookings",
    initialQuery: buildBookingQuery(initialBookingFormFilters),
  });

  const applyBookingFilters = useCallback(
    async (next: Partial<BookingFilterState>) => {
      const merged: BookingFilterState = {
        ...bookingFilters,
        ...next,
      };
      setBookingFilters(merged);
      await setBookingQuery(buildBookingQuery(merged));
    },
    [bookingFilters, buildBookingQuery, setBookingQuery],
  );

  if (isLoading) {
    return (
      <section className="ui-stack ui-stack--lg mt-12">
        <Card
          title="Panel operativo"
          description="Gestiona servicios, propiedades, reservas y usuarios desde un mismo panel."
        >
          <div className="ui-stack">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-10 w-40" />
          </div>
        </Card>

        <Card
          title="Crear servicio"
          description="Define nuevas ofertas con precio base y duración estandarizada."
        >
          <div className="grid gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
        </Card>

        <div className="grid gap-4">
          <Skeleton className="h-8 w-56" />
          <div className="flex flex-wrap gap-4">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-40" />
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="ui-panel-surface">
              <Skeleton className="h-6 w-48" />
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-10 w-40" />
            </div>
          ))}
        </div>

        <div className="grid gap-3">
          <Skeleton className="h-8 w-48" />
          {[1, 2].map((i) => (
            <div key={i} className="ui-panel-surface">
              <Skeleton className="h-5 w-40 mb-2" />
              <Skeleton className="h-4 w-56" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  async function handleBookingUpdate(bookingId: string, formData: FormData) {
    setBookingUpdatingId(bookingId);
    const result = await updateBooking(bookingId, formData);
    setBookingUpdatingId(null);
    if (result.error) {
      showToast(result.error, "error");
    } else if (result.success) {
      showToast(result.success, "success");
      await setBookingQuery(buildBookingQuery(bookingFilters));
    }
  }

  async function handleUserUpdate(userId: string, formData: FormData) {
    setUserUpdatingId(userId);
    const result = await updateUser(userId, formData);
    setUserUpdatingId(null);
    if (result.error) {
      showToast(result.error, "error");
    } else if (result.success) {
      showToast(result.success, "success");
    }
  }

  return (
    <section className="ui-stack ui-stack--lg mt-12">
      <Card
        title="Panel operativo"
        description="Gestiona servicios, propiedades, reservas y usuarios desde un mismo panel."
      >
        <div className="ui-stack">
          {currentUser ? (
            <Chip>
              Sesión: {currentUser.email ?? "usuario sin correo"}
              {currentUser.role ? ` · Rol ${currentUser.role}` : null}
            </Chip>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            isLoading={isLoggingOut}
            onClick={async () => {
              setLoggingOut(true);
              const result = await logout();
              setLoggingOut(false);
              if (result.error) {
                showToast(result.error, "error");
              } else if (result.success) {
                showToast(result.success, "success");
                router.replace("/login");
                router.refresh();
              }
            }}
            className="max-w-fit"
          >
            Cerrar sesión
          </Button>
        </div>
      </Card>

      <ServicesManager
        services={serviceItems}
        createService={createService}
        updateService={updateService}
        toggleService={toggleService}
        onToast={showToast}
        pageInfo={servicePageInfo}
        isLoading={isServicesRefreshing}
        isLoadingMore={isLoadingMoreServices}
        onLoadMore={loadMoreServices}
        onRefresh={refreshServices}
      />

      <BookingsManager
        filters={bookingFilters}
        onFiltersChange={applyBookingFilters}
        bookings={bookingItems}
        pageInfo={bookingPageInfo}
        isLoading={isBookingsRefreshing}
        isLoadingMore={isLoadingMoreBookings}
        onLoadMore={loadMoreBookings}
        onUpdate={handleBookingUpdate}
        updatingId={bookingUpdatingId}
        services={serviceItems}
        properties={propertyItems}
        formatDateTime={formatDateTimeLocal}
      />
      <CustomersManager
        customers={customerItems}
        pageInfo={customerPageInfo}
        isLoading={isCustomersRefreshing}
        isLoadingMore={isLoadingMoreCustomers}
        onLoadMore={loadMoreCustomers}
      />

      <PropertiesManager
        properties={propertyItems}
        customers={customerItems}
        createProperty={createProperty}
        updateProperty={updateProperty}
        onToast={showToast}
        pageInfo={propertyPageInfo}
        isLoading={isPropertiesRefreshing}
        isLoadingMore={isLoadingMoreProperties}
        onLoadMore={loadMoreProperties}
        onRefresh={refreshProperties}
      />

      {currentUser?.role === "ADMIN" ? (
        <Card
          title="Gestión de usuarios"
          description="Actualiza roles operativos y rota contraseñas de manera segura."
        >
          <div className="ui-stack">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Usuario</TableHeader>
                  <TableHeader>Nombre</TableHeader>
                  <TableHeader>Rol</TableHeader>
                  <TableHeader>Estado</TableHeader>
                  <TableHeader>Última actualización</TableHeader>
                  <TableHeader align="right">Acciones</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.fullName ?? "Sin nombre"}</TableCell>
                    <TableCell>
                      <Chip>{user.role}</Chip>
                    </TableCell>
                    <TableCell>
                      <Chip
                        className={
                          user.isActive
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                            : "bg-red-500/20 text-red-300 border-red-500/30"
                        }
                      >
                        {user.isActive ? "Activo" : "Inactivo"}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      {new Date(user.updatedAt).toLocaleString("es-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </TableCell>
                    <TableCell align="right">
                      <form
                        action={async (formData) => {
                          await handleUserUpdate(user.id, formData);
                        }}
                        className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 items-center"
                      >
                        <select
                          name="userRole"
                          defaultValue={user.role}
                          className="ui-input"
                          aria-label={`Rol de ${user.email}`}
                        >
                          {USER_ROLES.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                        <input
                          name="userFullName"
                          type="text"
                          defaultValue={user.fullName ?? ""}
                          placeholder="Nombre completo"
                          className="ui-input"
                        />
                        <input
                          name="userPassword"
                          type="password"
                          placeholder="Nueva contraseña (opcional)"
                          className="ui-input"
                        />
                        <label
                          className={`flex items-center gap-2 rounded-lg border border-brisa-600/20 bg-brisa-800/40 px-3 py-2 ${
                            user.id === currentUser?.id
                              ? "opacity-50 cursor-not-allowed"
                              : "cursor-pointer"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={user.isActive}
                            onChange={async (e) => {
                              if (user.id === currentUser?.id) {
                                alert("No puedes desactivar tu propia cuenta");
                                e.target.checked = user.isActive;
                                return;
                              }
                              const result = await toggleUserActive(
                                user.id,
                                e.target.checked,
                              );
                              if (result.error) {
                                showToast(
                                  result.error ??
                                    "No se pudo actualizar el estado",
                                  "error",
                                );
                                e.target.checked = user.isActive;
                              } else if (result.success) {
                                showToast(
                                  result.success ?? "Estado actualizado",
                                  "success",
                                );
                              }
                            }}
                            disabled={user.id === currentUser?.id}
                          />
                          <span className="ui-field__label">Activo</span>
                        </label>
                        <Button
                          type="submit"
                          variant="ghost"
                          size="sm"
                          className="max-w-fit"
                          isLoading={userUpdatingId === user.id}
                        >
                          {userUpdatingId === user.id
                            ? "Guardando..."
                            : "Actualizar"}
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      ) : null}

      <form
        className="ui-panel-surface ui-panel-surface--muted grid gap-4"
        action={(formData) =>
          startBookingAction(async () => {
            const result = await createBooking(formData);
            if (result.error) {
              showToast(result.error, "error");
            } else if (result.success) {
              showToast(result.success, "success");
            }
          })
        }
      >
        <h3 className="ui-section-title">Crear reserva</h3>
        <div className="ui-grid-responsive">
          <label className="ui-field">
            <span className="ui-field__label">Servicio</span>
            <select name="bookingService" required className="ui-input">
              <option value="">Selecciona servicio</option>
              {serviceItems.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </label>
          <label className="ui-field">
            <span className="ui-field__label">Propiedad</span>
            <select name="bookingProperty" required className="ui-input">
              <option value="">Selecciona propiedad</option>
              {propertyItems.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.label} ({property.city})
                </option>
              ))}
            </select>
          </label>
          <label className="ui-field">
            <span className="ui-field__label">Cliente</span>
            <select name="bookingCustomer" required className="ui-input">
              <option value="">Selecciona cliente</option>
              {customerItems.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.fullName ?? customer.email}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="ui-field">
          <span className="ui-field__label">Fecha y hora</span>
          <input
            name="bookingScheduledAt"
            type="datetime-local"
            required
            className="ui-input"
          />
        </label>
        <label className="ui-field">
          <span className="ui-field__label">Duración (min, opcional)</span>
          <input
            name="bookingDuration"
            type="number"
            min="30"
            step="15"
            className="ui-input"
          />
        </label>
        <label className="ui-field">
          <span className="ui-field__label">Notas</span>
          <textarea
            name="bookingNotes"
            rows={3}
            placeholder="Instrucciones especiales"
            className="ui-input ui-input--textarea"
          />
        </label>
        <Button
          type="submit"
          variant="secondary"
          size="sm"
          className="max-w-fit"
          isLoading={isBookingPending}
        >
          {isBookingPending ? "Creando reserva..." : "Guardar reserva"}
        </Button>
      </form>
    </section>
  );
}

function formatDateTimeLocal(date: string): string {
  const dt = new Date(date);
  const offset = dt.getTimezoneOffset();
  const local = new Date(dt.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}
