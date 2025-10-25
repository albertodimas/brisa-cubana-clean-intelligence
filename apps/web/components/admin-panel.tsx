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
  Notification,
  PaginatedResult,
} from "@/lib/api";
import { usePaginatedResource } from "@/hooks/use-paginated-resource";
import { Button } from "./ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./ui/card";
import { Chip } from "./ui/chip";
import { Skeleton } from "./ui/skeleton";
import { useToast } from "./ui/toast";
import { NotificationBell } from "./notifications/notification-bell";
import { BookingsManager } from "./bookings-manager";
import { ServicesManager } from "./services-manager";
import { PropertiesManager } from "./properties-manager";
import { CustomersManager } from "./customers-manager";
import { UsersManager } from "./users-manager";

type ActionResult = {
  success?: string;
  error?: string;
};

type AdminPanelProps = {
  currentUser: Session["user"] | null;
  services: PaginatedResult<Service>;
  properties: PaginatedResult<Property>;
  bookings: PaginatedResult<Booking>;
  customers: PaginatedResult<Customer>;
  initialBookingFilters: {
    status?: string;
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
  users: PaginatedResult<User>;
  notifications: PaginatedResult<Notification>;
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
  notifications,
  updateUser,
  toggleUserActive,
  logout,
  isLoading = false,
}: AdminPanelProps) {
  const router = useRouter();
  const { showToast } = useToast();

  // Adapter para compatibilidad con la API vieja de toast en child components
  const handleToast = (message: string, type: "success" | "error") => {
    showToast(message, { type });
  };

  const {
    items: serviceItems,
    pageInfo: servicePageInfo,
    isLoading: isServicesRefreshing,
    isLoadingMore: isLoadingMoreServices,
    loadMore: loadMoreServices,
    refresh: refreshServices,
    currentQuery: serviceQuery,
    setQuery: setServiceQuery,
    resetQuery: resetServiceQuery,
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
    currentQuery: propertyQuery,
    setQuery: setPropertyQuery,
    resetQuery: resetPropertyQuery,
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
    currentQuery: customerQuery,
    setQuery: setCustomerQuery,
    resetQuery: resetCustomerQuery,
  } = usePaginatedResource<Customer>({
    initial: customers,
    endpoint: "/api/customers",
    initialQuery: { limit: customers.pageInfo.limit },
  });

  const BOOKINGS_PAGE_SIZE = 10;

  const initialBookingQuery = useMemo(() => {
    const query: Record<string, string | number> = {
      limit: BOOKINGS_PAGE_SIZE,
    };
    if (initialBookingFilters.status) {
      query.status = initialBookingFilters.status;
    }
    if (initialBookingFilters.from) {
      query.from = initialBookingFilters.from.slice(0, 10);
    }
    if (initialBookingFilters.to) {
      query.to = initialBookingFilters.to.slice(0, 10);
    }
    return query;
  }, [initialBookingFilters]);

  const [isLoggingOut, setLoggingOut] = useState(false);
  const [isBookingPending, startBookingAction] = useTransition();

  const {
    items: bookingItems,
    pageInfo: bookingPageInfo,
    isLoading: isBookingsRefreshing,
    isLoadingMore: isLoadingMoreBookings,
    loadMore: loadMoreBookings,
    refresh: refreshBookings,
    currentQuery: bookingQuery,
    setQuery: setBookingQuery,
    resetQuery: resetBookingQuery,
  } = usePaginatedResource<Booking>({
    initial: bookings,
    endpoint: "/api/bookings",
    initialQuery: initialBookingQuery,
  });

  const {
    items: userItems,
    pageInfo: userPageInfo,
    isLoading: isUsersRefreshing,
    isLoadingMore: isLoadingMoreUsers,
    loadMore: loadMoreUsers,
    refresh: refreshUsers,
    currentQuery: userQuery,
    setQuery: setUserQuery,
    resetQuery: resetUserQuery,
  } = usePaginatedResource<User>({
    initial: users,
    endpoint: "/api/users",
    initialQuery: { limit: users.pageInfo.limit },
  });

  if (isLoading) {
    const sessionEmail = currentUser?.email ?? "cargando...";
    const sessionRole = currentUser?.role ? ` · Rol ${currentUser.role}` : "";

    return (
      <section className="ui-stack ui-stack--lg mt-12" data-testid="panel-root">
        <Card>
          <CardHeader>
            <CardTitle>Panel operativo</CardTitle>
            <CardDescription>
              Gestiona servicios, propiedades, reservas y usuarios desde un
              mismo panel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="ui-stack">
              <div
                className="flex flex-wrap items-center justify-between gap-3"
                data-testid="panel-session"
              >
                <Chip>
                  Sesión: {sessionEmail}
                  {sessionRole}
                </Chip>
                <Skeleton className="h-10 w-28" />
              </div>
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-10 w-40" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Crear servicio</CardTitle>
            <CardDescription>
              Define nuevas ofertas con precio base y duración estandarizada.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-10 w-32" />
            </div>
          </CardContent>
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

  return (
    <section className="ui-stack ui-stack--lg mt-12" data-testid="panel-root">
      <Card>
        <CardHeader>
          <CardTitle>Panel operativo</CardTitle>
          <CardDescription>
            Gestiona servicios, propiedades, reservas y usuarios desde un mismo
            panel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {currentUser ? (
              <div
                className="flex flex-wrap items-center justify-between gap-3"
                data-testid="panel-session"
              >
                <Chip>
                  Sesión: {currentUser.email ?? "usuario sin correo"}
                  {currentUser.role ? ` · Rol ${currentUser.role}` : null}
                </Chip>
                <div className="flex items-center gap-3">
                  <NotificationBell initialNotifications={notifications} />
                  <Button
                    type="button"
                    variant="ghost"
                    isLoading={isLoggingOut}
                    onClick={async () => {
                      setLoggingOut(true);
                      const result = await logout();
                      setLoggingOut(false);
                      if (result.error) {
                        showToast(result.error, { type: "error" });
                      } else if (result.success) {
                        showToast(result.success, { type: "success" });
                        router.replace("/login");
                        router.refresh();
                      }
                    }}
                    className="max-w-fit"
                  >
                    Cerrar sesión
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex justify-end" data-testid="panel-session">
                <Button
                  type="button"
                  variant="ghost"
                  isLoading={isLoggingOut}
                  onClick={async () => {
                    setLoggingOut(true);
                    const result = await logout();
                    setLoggingOut(false);
                    if (result.error) {
                      showToast(result.error, { type: "error" });
                    } else if (result.success) {
                      showToast(result.success, { type: "success" });
                      router.replace("/login");
                      router.refresh();
                    }
                  }}
                  className="max-w-fit"
                >
                  Cerrar sesión
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <ServicesManager
        services={serviceItems}
        createService={createService}
        updateService={updateService}
        toggleService={toggleService}
        onToast={handleToast}
        pageInfo={servicePageInfo}
        isLoading={isServicesRefreshing}
        isLoadingMore={isLoadingMoreServices}
        onLoadMore={loadMoreServices}
        onRefresh={refreshServices}
        currentQuery={serviceQuery}
        setQuery={setServiceQuery}
        resetQuery={resetServiceQuery}
      />

      <BookingsManager
        bookings={bookingItems}
        pageInfo={bookingPageInfo}
        isLoading={isBookingsRefreshing}
        isLoadingMore={isLoadingMoreBookings}
        onLoadMore={loadMoreBookings}
        onUpdate={updateBooking}
        services={serviceItems}
        properties={propertyItems}
        formatDateTime={formatDateTimeLocal}
        currentQuery={bookingQuery}
        setQuery={setBookingQuery}
        resetQuery={resetBookingQuery}
        refresh={refreshBookings}
        onToast={handleToast}
      />
      <CustomersManager
        customers={customerItems}
        pageInfo={customerPageInfo}
        isLoading={isCustomersRefreshing}
        isLoadingMore={isLoadingMoreCustomers}
        onLoadMore={loadMoreCustomers}
        currentQuery={customerQuery}
        setQuery={setCustomerQuery}
        resetQuery={resetCustomerQuery}
      />

      <PropertiesManager
        properties={propertyItems}
        customers={customerItems}
        createProperty={createProperty}
        updateProperty={updateProperty}
        onToast={handleToast}
        pageInfo={propertyPageInfo}
        isLoading={isPropertiesRefreshing}
        isLoadingMore={isLoadingMoreProperties}
        onLoadMore={loadMoreProperties}
        onRefresh={refreshProperties}
        currentQuery={propertyQuery}
        setQuery={setPropertyQuery}
        resetQuery={resetPropertyQuery}
      />

      {currentUser?.role === "ADMIN" ? (
        <UsersManager
          users={userItems}
          pageInfo={userPageInfo}
          isLoading={isUsersRefreshing}
          isLoadingMore={isLoadingMoreUsers}
          onLoadMore={loadMoreUsers}
          currentQuery={userQuery}
          setQuery={setUserQuery}
          resetQuery={resetUserQuery}
          refresh={refreshUsers}
          onUpdate={updateUser}
          onToggleActive={toggleUserActive}
          currentUserId={currentUser?.id ?? null}
          onToast={handleToast}
        />
      ) : null}

      <form
        className="ui-panel-surface ui-panel-surface--muted grid gap-4"
        action={(formData) =>
          startBookingAction(async () => {
            const result = await createBooking(formData);
            if (result.error) {
              showToast(result.error, { type: "error" });
            } else if (result.success) {
              showToast(result.success, { type: "success" });
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
