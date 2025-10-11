"use client";

import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import type { ReactNode } from "react";
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

type ActionResult = {
  success?: string;
  error?: string;
};

const USER_ROLES = ["ADMIN", "COORDINATOR", "STAFF", "CLIENT"] as const;

function SubmitButton({ children }: { children: ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Enviando..." : children}
    </Button>
  );
}

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

  const serviceList = useMemo(() => services.items, [services.items]);
  const propertyList = useMemo(() => properties.items, [properties.items]);
  const customerList = useMemo(() => customers.items, [customers.items]);

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

  const [serviceUpdatingId, setServiceUpdatingId] = useState<string | null>(
    null,
  );
  const [propertyUpdatingId, setPropertyUpdatingId] = useState<string | null>(
    null,
  );
  const [bookingUpdatingId, setBookingUpdatingId] = useState<string | null>(
    null,
  );
  const [userUpdatingId, setUserUpdatingId] = useState<string | null>(null);
  const [togglingServiceId, setTogglingServiceId] = useState<string | null>(
    null,
  );
  const [bookingFilters, setBookingFilters] = useState<BookingFilterState>(
    initialBookingFormFilters,
  );
  const [isToggling, startToggle] = useTransition();
  const [isLoggingOut, setLoggingOut] = useState(false);
  const [isPropertyPending, startPropertyAction] = useTransition();
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

  async function handleServiceUpdate(serviceId: string, formData: FormData) {
    setServiceUpdatingId(serviceId);
    const result = await updateService(serviceId, formData);
    setServiceUpdatingId(null);
    if (result.error) {
      showToast(result.error, "error");
    } else if (result.success) {
      showToast(result.success, "success");
    }
  }

  async function handlePropertyUpdate(propertyId: string, formData: FormData) {
    setPropertyUpdatingId(propertyId);
    const result = await updateProperty(propertyId, formData);
    setPropertyUpdatingId(null);
    if (result.error) {
      showToast(result.error, "error");
    } else if (result.success) {
      showToast(result.success, "success");
    }
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

      <Card
        title="Crear servicio"
        description="Define nuevas ofertas con precio base y duración estandarizada."
      >
        <form
          data-testid="service-create-form"
          action={async (formData) => {
            const result = await createService(formData);
            if (result.error) {
              showToast(result.error, "error");
            } else if (result.success) {
              showToast(result.success, "success");
            }
          }}
          className="ui-stack"
        >
          <label className="ui-field">
            <span className="ui-field__label">Nombre</span>
            <input
              name="name"
              required
              placeholder="Ej. Turnover rápido"
              className="ui-input"
            />
          </label>
          <label className="ui-field">
            <span className="ui-field__label">Descripción</span>
            <textarea
              name="description"
              rows={3}
              placeholder="Opcional"
              className="ui-input ui-input--textarea"
            />
          </label>
          <div className="ui-grid-responsive">
            <label className="ui-field">
              <span className="ui-field__label">Precio base (USD)</span>
              <input
                name="basePrice"
                type="number"
                required
                min="0"
                step="0.01"
                className="ui-input"
              />
            </label>
            <label className="ui-field">
              <span className="ui-field__label">Duración (min)</span>
              <input
                name="durationMin"
                type="number"
                required
                min="30"
                step="15"
                className="ui-input"
              />
            </label>
          </div>
          <SubmitButton>Guardar</SubmitButton>
        </form>
      </Card>

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
        services={serviceList}
        properties={propertyList}
        formatDateTime={formatDateTimeLocal}
      />
      <section className="ui-stack">
        <h3 className="ui-section-title">Clientes registrados</h3>
        {customerList.length === 0 ? (
          <p className="ui-helper-text">No hay clientes disponibles.</p>
        ) : (
          <ul className="ui-panel-list">
            {customerList.map((customer) => (
              <li
                key={customer.id}
                className="ui-panel-surface ui-panel-surface--muted flex flex-col gap-2"
              >
                <strong>{customer.fullName ?? "Cliente sin nombre"}</strong>
                <span className="ui-caption">{customer.email}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="ui-stack">
        <h3 className="ui-section-title">Gestionar servicios</h3>
        {serviceList.length === 0 ? (
          <p className="ui-helper-text">
            No hay servicios configurados todavía.
          </p>
        ) : (
          <div className="ui-stack">
            {serviceList.map((service) => (
              <form
                key={service.id}
                className="ui-panel-surface ui-panel-surface--muted grid gap-4"
                action={async (formData) => {
                  await handleServiceUpdate(service.id, formData);
                }}
              >
                <div className="ui-flex-between">
                  <div className="flex flex-col gap-1">
                    <strong>{service.name}</strong>
                    <span className="ui-caption text-brisa-300">
                      Última actualización:{" "}
                      {new Date(service.updatedAt).toLocaleString("es-US")}
                    </span>
                  </div>
                  <span
                    className={`ui-caption font-semibold ${service.active ? "text-brisa-300" : "text-red-300"}`}
                  >
                    {service.active ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <div className="ui-grid-responsive">
                  <label className="ui-field">
                    <span className="ui-field__label">Nombre</span>
                    <input
                      name="serviceName"
                      defaultValue={service.name}
                      className="ui-input"
                    />
                  </label>
                  <label className="ui-field">
                    <span className="ui-field__label">Precio base (USD)</span>
                    <input
                      name="serviceBasePrice"
                      type="number"
                      min="0"
                      step="1"
                      defaultValue={service.basePrice}
                      className="ui-input"
                    />
                  </label>
                  <label className="ui-field">
                    <span className="ui-field__label">Duración (min)</span>
                    <input
                      name="serviceDuration"
                      type="number"
                      min="30"
                      step="15"
                      defaultValue={service.durationMin}
                      className="ui-input"
                    />
                  </label>
                  <label className="ui-field">
                    <span className="ui-field__label">Estado</span>
                    <select
                      name="serviceActive"
                      defaultValue={service.active ? "true" : "false"}
                      className="ui-input"
                    >
                      <option value="true">Activo</option>
                      <option value="false">Inactivo</option>
                    </select>
                  </label>
                </div>
                <label className="ui-field">
                  <span className="ui-field__label">Descripción</span>
                  <textarea
                    name="serviceDescription"
                    rows={2}
                    defaultValue={service.description ?? ""}
                    className="ui-input ui-input--textarea"
                  />
                </label>
                <div className="flex flex-wrap gap-3 items-center">
                  <Button
                    type="submit"
                    variant="secondary"
                    size="sm"
                    className="max-w-fit"
                    isLoading={serviceUpdatingId === service.id}
                  >
                    {serviceUpdatingId === service.id
                      ? "Guardando..."
                      : "Actualizar servicio"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="max-w-fit"
                    isLoading={togglingServiceId === service.id && isToggling}
                    disabled={
                      togglingServiceId !== null &&
                      togglingServiceId !== service.id
                    }
                    onClick={() => {
                      startToggle(async () => {
                        setTogglingServiceId(service.id);
                        try {
                          const result = await toggleService(
                            service.id,
                            !service.active,
                          );
                          if (result.error) {
                            showToast(result.error, "error");
                          } else if (result.success) {
                            showToast(result.success, "success");
                          }
                        } finally {
                          setTogglingServiceId(null);
                        }
                      });
                    }}
                  >
                    {service.active ? "Desactivar" : "Activar"}
                  </Button>
                </div>
              </form>
            ))}
          </div>
        )}
      </section>

      <form
        className="ui-panel-surface ui-panel-surface--muted grid gap-4"
        action={(formData) =>
          startPropertyAction(async () => {
            const result = await createProperty(formData);
            if (result.error) {
              showToast(result.error, "error");
            } else if (result.success) {
              showToast(result.success, "success");
            }
          })
        }
      >
        <h3 className="ui-section-title">Registrar propiedad</h3>
        <label className="ui-field">
          <span className="ui-field__label">Nombre interno</span>
          <input
            name="propertyLabel"
            required
            placeholder="Ej. Brickell Loft"
            className="ui-input"
          />
        </label>
        <label className="ui-field">
          <span className="ui-field__label">Dirección</span>
          <input
            name="propertyAddress"
            required
            placeholder="Calle, número"
            className="ui-input"
          />
        </label>
        <div className="ui-grid-responsive-sm">
          <label className="ui-field">
            <span className="ui-field__label">Ciudad</span>
            <input name="propertyCity" required className="ui-input" />
          </label>
          <label className="ui-field">
            <span className="ui-field__label">Estado</span>
            <input
              name="propertyState"
              required
              maxLength={2}
              className="ui-input"
            />
          </label>
          <label className="ui-field">
            <span className="ui-field__label">ZIP</span>
            <input name="propertyZip" required className="ui-input" />
          </label>
        </div>
        <label className="ui-field">
          <span className="ui-field__label">Tipo</span>
          <select name="propertyType" className="ui-input">
            <option value="RESIDENTIAL">Residencial</option>
            <option value="VACATION_RENTAL">Vacation Rental</option>
            <option value="OFFICE">Oficina</option>
          </select>
        </label>
        <label className="ui-field">
          <span className="ui-field__label">Propietario</span>
          <select name="propertyOwner" required className="ui-input">
            <option value="">Selecciona cliente</option>
            {customerList.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.fullName ?? customer.email}
              </option>
            ))}
          </select>
        </label>
        <div className="ui-grid-responsive-sm">
          <label className="ui-field">
            <span className="ui-field__label">Habitaciones</span>
            <input
              name="propertyBedrooms"
              type="number"
              min="0"
              className="ui-input"
            />
          </label>
          <label className="ui-field">
            <span className="ui-field__label">Baños</span>
            <input
              name="propertyBathrooms"
              type="number"
              min="0"
              className="ui-input"
            />
          </label>
          <label className="ui-field">
            <span className="ui-field__label">Metros cuadrados</span>
            <input
              name="propertySqft"
              type="number"
              min="0"
              className="ui-input"
            />
          </label>
        </div>
        <label className="ui-field">
          <span className="ui-field__label">Notas</span>
          <textarea
            name="propertyNotes"
            rows={3}
            placeholder="Notas operativas"
            className="ui-input ui-input--textarea"
          />
        </label>
        <Button
          type="submit"
          variant="secondary"
          size="sm"
          className="max-w-fit"
          isLoading={isPropertyPending}
        >
          {isPropertyPending ? "Registrando..." : "Guardar propiedad"}
        </Button>
      </form>

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

      <section className="ui-stack">
        <h3 className="ui-section-title">Inventario de propiedades</h3>
        {propertyList.length === 0 ? (
          <p className="ui-helper-text">
            Aún no tienes propiedades registradas.
          </p>
        ) : (
          <div className="ui-stack">
            {propertyList.map((property) => (
              <form
                key={property.id}
                className="ui-panel-surface ui-panel-surface--muted grid gap-4"
                action={async (formData) => {
                  await handlePropertyUpdate(property.id, formData);
                }}
              >
                <div className="ui-flex-between">
                  <div className="flex flex-col gap-1">
                    <strong>{property.label}</strong>
                    <span className="ui-caption">
                      {property.addressLine}, {property.city}, {property.state}{" "}
                      {property.zipCode}
                    </span>
                  </div>
                  <span className="ui-caption text-brisa-300">
                    Propietario:{" "}
                    {property.owner?.fullName ?? property.owner?.email ?? "N/A"}
                  </span>
                </div>
                <div className="ui-grid-responsive">
                  <label className="ui-field">
                    <span className="ui-field__label">Nombre interno</span>
                    <input
                      name="propertyLabel"
                      defaultValue={property.label}
                      className="ui-input"
                    />
                  </label>
                  <label className="ui-field">
                    <span className="ui-field__label">Dirección</span>
                    <input
                      name="propertyAddress"
                      defaultValue={property.addressLine}
                      className="ui-input"
                    />
                  </label>
                  <label className="ui-field">
                    <span className="ui-field__label">Ciudad</span>
                    <input
                      name="propertyCity"
                      defaultValue={property.city}
                      className="ui-input"
                    />
                  </label>
                  <label className="ui-field">
                    <span className="ui-field__label">Estado</span>
                    <input
                      name="propertyState"
                      defaultValue={property.state}
                      className="ui-input"
                    />
                  </label>
                  <label className="ui-field">
                    <span className="ui-field__label">ZIP</span>
                    <input
                      name="propertyZip"
                      defaultValue={property.zipCode}
                      className="ui-input"
                    />
                  </label>
                  <label className="ui-field">
                    <span className="ui-field__label">Tipo</span>
                    <select
                      name="propertyType"
                      defaultValue={property.type}
                      className="ui-input"
                    >
                      <option value="RESIDENTIAL">Residencial</option>
                      <option value="VACATION_RENTAL">Vacation Rental</option>
                      <option value="OFFICE">Oficina</option>
                    </select>
                  </label>
                  <label className="ui-field">
                    <span className="ui-field__label">Habitaciones</span>
                    <input
                      name="propertyBedrooms"
                      type="number"
                      min="0"
                      defaultValue={property.bedrooms ?? ""}
                      className="ui-input"
                    />
                  </label>
                  <label className="ui-field">
                    <span className="ui-field__label">Baños</span>
                    <input
                      name="propertyBathrooms"
                      type="number"
                      min="0"
                      defaultValue={property.bathrooms ?? ""}
                      className="ui-input"
                    />
                  </label>
                  <label className="ui-field">
                    <span className="ui-field__label">Metros cuadrados</span>
                    <input
                      name="propertySqft"
                      type="number"
                      min="0"
                      defaultValue={property.sqft ?? ""}
                      className="ui-input"
                    />
                  </label>
                </div>
                <label className="ui-field">
                  <span className="ui-field__label">Notas</span>
                  <textarea
                    name="propertyNotes"
                    rows={2}
                    defaultValue={property.notes ?? ""}
                    className="ui-input ui-input--textarea"
                  />
                </label>
                <label className="ui-field">
                  <span className="ui-field__label">Propietario</span>
                  <select
                    name="propertyOwner"
                    defaultValue={property.ownerId}
                    className="ui-input"
                  >
                    <option value="">Mantener actual</option>
                    {customerList.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.fullName ?? customer.email}
                      </option>
                    ))}
                  </select>
                </label>
                <Button
                  type="submit"
                  variant="secondary"
                  size="sm"
                  className="max-w-fit"
                  isLoading={propertyUpdatingId === property.id}
                >
                  {propertyUpdatingId === property.id
                    ? "Guardando..."
                    : "Actualizar propiedad"}
                </Button>
              </form>
            ))}
          </div>
        )}
      </section>

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
              {serviceList.map((service) => (
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
              {propertyList.map((property) => (
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
              {customerList.map((customer) => (
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
