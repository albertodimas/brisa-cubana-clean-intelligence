"use client";

import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ReactNode, CSSProperties } from "react";
import type { Session } from "next-auth";
import type { Booking, Customer, Property, Service, User } from "@/lib/api";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Chip } from "./ui/chip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

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

type AdminPanelProps = {
  currentUser: Session["user"] | null;
  services: Service[];
  properties: Property[];
  bookings: Booking[];
  customers: Customer[];
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
};

export function AdminPanel({
  currentUser,
  services,
  properties,
  bookings,
  customers,
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
}: AdminPanelProps) {
  const router = useRouter();
  const [serviceMessage, setServiceMessage] = useState<string | null>(null);
  const [propertyMessage, setPropertyMessage] = useState<string | null>(null);
  const [bookingMessage, setBookingMessage] = useState<string | null>(null);
  const [logoutMessage, setLogoutMessage] = useState<string | null>(null);
  const [serviceUpdateMessage, setServiceUpdateMessage] = useState<
    string | null
  >(null);
  const [propertyUpdateMessage, setPropertyUpdateMessage] = useState<
    string | null
  >(null);
  const [bookingUpdateMessage, setBookingUpdateMessage] = useState<
    string | null
  >(null);
  const [serviceUpdatingId, setServiceUpdatingId] = useState<string | null>(
    null,
  );
  const [propertyUpdatingId, setPropertyUpdatingId] = useState<string | null>(
    null,
  );
  const [bookingUpdatingId, setBookingUpdatingId] = useState<string | null>(
    null,
  );
  const [bookingFilters, setBookingFilters] = useState({
    status: "ALL",
    from: "",
    to: "",
  });
  const [isToggling, startToggle] = useTransition();
  const [isLoggingOut, setLoggingOut] = useState(false);
  const [isPropertyPending, startPropertyAction] = useTransition();
  const [isBookingPending, startBookingAction] = useTransition();
  const [userUpdateMessage, setUserUpdateMessage] = useState<string | null>(
    null,
  );
  const [userUpdatingId, setUserUpdatingId] = useState<string | null>(null);

  const filteredBookings = bookings.filter((booking) => {
    const statusMatch =
      bookingFilters.status === "ALL" ||
      booking.status === bookingFilters.status;
    if (!statusMatch) return false;

    const fromDate = bookingFilters.from
      ? new Date(`${bookingFilters.from}T00:00:00`)
      : null;
    const toDate = bookingFilters.to
      ? new Date(`${bookingFilters.to}T23:59:59`)
      : null;
    const scheduled = new Date(booking.scheduledAt);

    if (fromDate && scheduled < fromDate) {
      return false;
    }
    if (toDate && scheduled > toDate) {
      return false;
    }

    return true;
  });

  async function handleServiceUpdate(serviceId: string, formData: FormData) {
    setServiceUpdatingId(serviceId);
    const result = await updateService(serviceId, formData);
    setServiceUpdatingId(null);
    setServiceUpdateMessage(
      result.error ? `Error: ${result.error}` : (result.success ?? null),
    );
  }

  async function handlePropertyUpdate(propertyId: string, formData: FormData) {
    setPropertyUpdatingId(propertyId);
    const result = await updateProperty(propertyId, formData);
    setPropertyUpdatingId(null);
    setPropertyUpdateMessage(
      result.error ? `Error: ${result.error}` : (result.success ?? null),
    );
  }

  async function handleBookingUpdate(bookingId: string, formData: FormData) {
    setBookingUpdatingId(bookingId);
    const result = await updateBooking(bookingId, formData);
    setBookingUpdatingId(null);
    setBookingUpdateMessage(
      result.error ? `Error: ${result.error}` : (result.success ?? null),
    );
  }

  async function handleUserUpdate(userId: string, formData: FormData) {
    setUserUpdatingId(userId);
    const result = await updateUser(userId, formData);
    setUserUpdatingId(null);
    setUserUpdateMessage(
      result.error ? `Error: ${result.error}` : (result.success ?? null),
    );
  }

  return (
    <section className="ui-stack ui-stack--lg" style={{ marginTop: "3rem" }}>
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
            onClick={async () => {
              setLoggingOut(true);
              const result = await logout();
              setLoggingOut(false);
              setLogoutMessage(
                result.error
                  ? `Error: ${result.error}`
                  : (result.success ?? null),
              );
              if (result.success) {
                router.replace("/login");
                router.refresh();
              }
            }}
            disabled={isLoggingOut}
            style={{ maxWidth: "fit-content" }}
          >
            {isLoggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
          </Button>
          {logoutMessage ? (
            <p
              style={{
                margin: 0,
                color: logoutMessage.startsWith("Error")
                  ? "#fda4af"
                  : "#7ee7c4",
              }}
            >
              {logoutMessage}
            </p>
          ) : null}
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
            setServiceMessage(
              result.error
                ? `Error: ${result.error}`
                : (result.success ?? null),
            );
          }}
          className="ui-stack"
        >
          <label style={{ display: "grid", gap: "0.25rem" }}>
            <span>Nombre</span>
            <input
              name="name"
              required
              placeholder="Ej. Turnover rápido"
              style={inputStyle}
            />
          </label>
          <label style={{ display: "grid", gap: "0.25rem" }}>
            <span>Descripción</span>
            <textarea
              name="description"
              rows={3}
              placeholder="Opcional"
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </label>
          <div
            style={{
              display: "grid",
              gap: "0.75rem",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            }}
          >
            <label style={{ display: "grid", gap: "0.25rem" }}>
              <span>Precio base (USD)</span>
              <input
                name="basePrice"
                type="number"
                required
                min="0"
                step="0.01"
                style={inputStyle}
              />
            </label>
            <label style={{ display: "grid", gap: "0.25rem" }}>
              <span>Duración (min)</span>
              <input
                name="durationMin"
                type="number"
                required
                min="30"
                step="15"
                style={inputStyle}
              />
            </label>
          </div>
          <SubmitButton>Guardar</SubmitButton>
          {serviceMessage ? (
            <p
              style={{
                margin: 0,
                color: serviceMessage.startsWith("Error")
                  ? "#fda4af"
                  : "#7ee7c4",
              }}
            >
              {serviceMessage}
            </p>
          ) : null}
        </form>
      </Card>

      <div style={{ display: "grid", gap: "1rem" }}>
        <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Reservas programadas</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
          <label style={{ display: "grid", gap: "0.25rem" }}>
            <span>Estado</span>
            <select
              data-testid="booking-status-filter"
              value={bookingFilters.status}
              onChange={(event) =>
                setBookingFilters((prev) => ({
                  ...prev,
                  status: event.target.value,
                }))
              }
              style={inputStyle}
            >
              <option value="ALL">Todos</option>
              <option value="PENDING">Pendiente</option>
              <option value="CONFIRMED">Confirmada</option>
              <option value="IN_PROGRESS">En curso</option>
              <option value="COMPLETED">Completada</option>
              <option value="CANCELLED">Cancelada</option>
            </select>
          </label>
          <label style={{ display: "grid", gap: "0.25rem" }}>
            <span>Desde</span>
            <input
              type="date"
              value={bookingFilters.from}
              onChange={(event) =>
                setBookingFilters((prev) => ({
                  ...prev,
                  from: event.target.value,
                }))
              }
              style={inputStyle}
            />
          </label>
          <label style={{ display: "grid", gap: "0.25rem" }}>
            <span>Hasta</span>
            <input
              type="date"
              value={bookingFilters.to}
              onChange={(event) =>
                setBookingFilters((prev) => ({
                  ...prev,
                  to: event.target.value,
                }))
              }
              style={inputStyle}
            />
          </label>
        </div>
        {filteredBookings.length === 0 ? (
          <p style={{ color: "#d5f6eb" }}>
            No hay reservas que coincidan con los filtros seleccionados.
          </p>
        ) : (
          <div style={{ display: "grid", gap: "1rem" }}>
            {filteredBookings.map((booking) => (
              <form
                key={booking.id}
                action={async (formData) => {
                  await handleBookingUpdate(booking.id, formData);
                }}
                style={{
                  display: "grid",
                  gap: "0.75rem",
                  padding: "1rem",
                  borderRadius: "0.75rem",
                  border: "1px solid rgba(126,231,196,0.15)",
                  background: "rgba(11,23,28,0.6)",
                }}
                data-testid="booking-card"
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "1rem",
                    flexWrap: "wrap",
                  }}
                >
                  <strong>
                    {booking.code} · {booking.service.name}
                  </strong>
                  <span style={{ color: "#a7dcd0", fontSize: "0.85rem" }}>
                    Cliente:{" "}
                    {booking.customer?.fullName ??
                      booking.customer?.email ??
                      "N/A"}
                  </span>
                </div>
                <div
                  style={{
                    display: "grid",
                    gap: "0.75rem",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  }}
                >
                  <label style={{ display: "grid", gap: "0.25rem" }}>
                    <span>Fecha y hora</span>
                    <input
                      name="bookingScheduledAt"
                      type="datetime-local"
                      defaultValue={formatDateTimeLocal(booking.scheduledAt)}
                      style={inputStyle}
                    />
                  </label>
                  <label style={{ display: "grid", gap: "0.25rem" }}>
                    <span>Duración (min)</span>
                    <input
                      name="bookingDuration"
                      type="number"
                      min="30"
                      step="15"
                      defaultValue={booking.durationMin}
                      style={inputStyle}
                    />
                  </label>
                  <label style={{ display: "grid", gap: "0.25rem" }}>
                    <span>Estado</span>
                    <select
                      name="bookingStatus"
                      defaultValue={booking.status}
                      style={inputStyle}
                    >
                      <option value="PENDING">Pendiente</option>
                      <option value="CONFIRMED">Confirmada</option>
                      <option value="IN_PROGRESS">En curso</option>
                      <option value="COMPLETED">Completada</option>
                      <option value="CANCELLED">Cancelada</option>
                    </select>
                  </label>
                  <label style={{ display: "grid", gap: "0.25rem" }}>
                    <span>Servicio</span>
                    <select
                      name="bookingService"
                      defaultValue={booking.service.id}
                      style={inputStyle}
                    >
                      {services.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label style={{ display: "grid", gap: "0.25rem" }}>
                    <span>Propiedad</span>
                    <select
                      name="bookingProperty"
                      defaultValue={booking.property.id}
                      style={inputStyle}
                    >
                      {properties.map((property) => (
                        <option key={property.id} value={property.id}>
                          {property.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label style={{ display: "grid", gap: "0.25rem" }}>
                  <span>Notas</span>
                  <textarea
                    name="bookingNotes"
                    rows={2}
                    defaultValue={booking.notes ?? ""}
                    style={{ ...inputStyle, resize: "vertical" }}
                  />
                </label>
                <button
                  type="submit"
                  style={{
                    padding: "0.45rem 1.2rem",
                    borderRadius: "999px",
                    border: "1px solid rgba(126,231,196,0.3)",
                    background:
                      bookingUpdatingId === booking.id
                        ? "rgba(126,231,196,0.2)"
                        : "rgba(11,23,28,0.8)",
                    color: "#d5f6eb",
                    cursor:
                      bookingUpdatingId === booking.id ? "wait" : "pointer",
                    alignSelf: "flex-start",
                  }}
                  disabled={bookingUpdatingId === booking.id}
                >
                  {bookingUpdatingId === booking.id
                    ? "Guardando..."
                    : "Actualizar reserva"}
                </button>
              </form>
            ))}
          </div>
        )}
        {bookingUpdateMessage ? (
          <p
            style={{
              margin: 0,
              color: bookingUpdateMessage.startsWith("Error")
                ? "#fda4af"
                : "#7ee7c4",
            }}
          >
            {bookingUpdateMessage}
          </p>
        ) : null}
      </div>

      <div style={{ display: "grid", gap: "0.5rem" }}>
        <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Clientes registrados</h3>
        {customers.length === 0 ? (
          <p style={{ color: "#d5f6eb" }}>No hay clientes disponibles.</p>
        ) : (
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "grid",
              gap: "0.75rem",
            }}
          >
            {customers.map((customer) => (
              <li
                key={customer.id}
                style={{
                  padding: "0.85rem",
                  borderRadius: "0.75rem",
                  border: "1px solid rgba(126,231,196,0.15)",
                  background: "rgba(18,34,40,0.6)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.25rem",
                }}
              >
                <strong>{customer.fullName ?? "Cliente sin nombre"}</strong>
                <span style={{ color: "#a7dcd0", fontSize: "0.9rem" }}>
                  {customer.email}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={{ display: "grid", gap: "1rem" }}>
        <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Gestionar servicios</h3>
        {services.length === 0 ? (
          <p style={{ color: "#d5f6eb" }}>
            No hay servicios configurados todavía.
          </p>
        ) : (
          <div style={{ display: "grid", gap: "1rem" }}>
            {services.map((service) => (
              <form
                key={service.id}
                action={async (formData) => {
                  await handleServiceUpdate(service.id, formData);
                }}
                style={{
                  display: "grid",
                  gap: "0.75rem",
                  padding: "1rem",
                  borderRadius: "0.75rem",
                  border: "1px solid rgba(126,231,196,0.15)",
                  background: "rgba(11,23,28,0.6)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    gap: "1rem",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <strong>{service.name}</strong>
                    <span style={{ color: "#6fb8a6", fontSize: "0.85rem" }}>
                      Última actualización:{" "}
                      {new Date(service.updatedAt).toLocaleString("es-US")}
                    </span>
                  </div>
                  <span
                    style={{
                      color: service.active ? "#7ee7c4" : "#fda4af",
                      fontWeight: 600,
                    }}
                  >
                    {service.active ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <div
                  style={{
                    display: "grid",
                    gap: "0.75rem",
                    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                  }}
                >
                  <label style={{ display: "grid", gap: "0.25rem" }}>
                    <span>Nombre</span>
                    <input
                      name="serviceName"
                      defaultValue={service.name}
                      style={inputStyle}
                    />
                  </label>
                  <label style={{ display: "grid", gap: "0.25rem" }}>
                    <span>Precio base (USD)</span>
                    <input
                      name="serviceBasePrice"
                      type="number"
                      min="0"
                      step="1"
                      defaultValue={service.basePrice}
                      style={inputStyle}
                    />
                  </label>
                  <label style={{ display: "grid", gap: "0.25rem" }}>
                    <span>Duración (min)</span>
                    <input
                      name="serviceDuration"
                      type="number"
                      min="30"
                      step="15"
                      defaultValue={service.durationMin}
                      style={inputStyle}
                    />
                  </label>
                  <label style={{ display: "grid", gap: "0.25rem" }}>
                    <span>Estado</span>
                    <select
                      name="serviceActive"
                      defaultValue={service.active ? "true" : "false"}
                      style={inputStyle}
                    >
                      <option value="true">Activo</option>
                      <option value="false">Inactivo</option>
                    </select>
                  </label>
                </div>
                <label style={{ display: "grid", gap: "0.25rem" }}>
                  <span>Descripción</span>
                  <textarea
                    name="serviceDescription"
                    rows={2}
                    defaultValue={service.description ?? ""}
                    style={{ ...inputStyle, resize: "vertical" }}
                  />
                </label>
                <div
                  style={{
                    display: "flex",
                    gap: "0.75rem",
                    alignItems: "center",
                  }}
                >
                  <button
                    type="submit"
                    style={{
                      padding: "0.45rem 1.2rem",
                      borderRadius: "999px",
                      border: "1px solid rgba(126,231,196,0.3)",
                      background:
                        serviceUpdatingId === service.id
                          ? "rgba(126,231,196,0.2)"
                          : "rgba(11,23,28,0.8)",
                      color: "#d5f6eb",
                      cursor:
                        serviceUpdatingId === service.id ? "wait" : "pointer",
                    }}
                    disabled={serviceUpdatingId === service.id}
                  >
                    {serviceUpdatingId === service.id
                      ? "Guardando..."
                      : "Actualizar servicio"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      startToggle(async () => {
                        const result = await toggleService(
                          service.id,
                          !service.active,
                        );
                        setServiceUpdateMessage(
                          result.error
                            ? `Error: ${result.error}`
                            : (result.success ?? null),
                        );
                      });
                    }}
                    style={{
                      padding: "0.35rem 0.9rem",
                      borderRadius: "999px",
                      border: "1px solid rgba(126,231,196,0.3)",
                      background: "transparent",
                      color: "#d5f6eb",
                      cursor: isToggling ? "wait" : "pointer",
                      opacity: isToggling ? 0.6 : 1,
                    }}
                    disabled={isToggling}
                  >
                    {service.active ? "Desactivar" : "Activar"}
                  </button>
                </div>
              </form>
            ))}
          </div>
        )}
        {serviceUpdateMessage ? (
          <p
            style={{
              margin: 0,
              color: serviceUpdateMessage.startsWith("Error")
                ? "#fda4af"
                : "#7ee7c4",
            }}
          >
            {serviceUpdateMessage}
          </p>
        ) : null}
      </div>

      <form
        action={(formData) =>
          startPropertyAction(async () => {
            const result = await createProperty(formData);
            setPropertyMessage(
              result.error
                ? `Error: ${result.error}`
                : (result.success ?? null),
            );
          })
        }
        style={{
          display: "grid",
          gap: "0.75rem",
          padding: "1rem",
          borderRadius: "0.75rem",
          background: "rgba(18,34,40,0.6)",
          border: "1px solid rgba(126,231,196,0.15)",
        }}
      >
        <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Registrar propiedad</h3>
        <label style={{ display: "grid", gap: "0.25rem" }}>
          <span>Nombre interno</span>
          <input
            name="propertyLabel"
            required
            placeholder="Ej. Brickell Loft"
            style={inputStyle}
          />
        </label>
        <label style={{ display: "grid", gap: "0.25rem" }}>
          <span>Dirección</span>
          <input
            name="propertyAddress"
            required
            placeholder="Calle, número"
            style={inputStyle}
          />
        </label>
        <div
          style={{
            display: "grid",
            gap: "0.75rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          }}
        >
          <label style={{ display: "grid", gap: "0.25rem" }}>
            <span>Ciudad</span>
            <input name="propertyCity" required style={inputStyle} />
          </label>
          <label style={{ display: "grid", gap: "0.25rem" }}>
            <span>Estado</span>
            <input
              name="propertyState"
              required
              maxLength={2}
              style={inputStyle}
            />
          </label>
          <label style={{ display: "grid", gap: "0.25rem" }}>
            <span>ZIP</span>
            <input name="propertyZip" required style={inputStyle} />
          </label>
        </div>
        <label style={{ display: "grid", gap: "0.25rem" }}>
          <span>Tipo</span>
          <select name="propertyType" style={inputStyle}>
            <option value="RESIDENTIAL">Residencial</option>
            <option value="VACATION_RENTAL">Vacation Rental</option>
            <option value="OFFICE">Oficina</option>
          </select>
        </label>
        <label style={{ display: "grid", gap: "0.25rem" }}>
          <span>Propietario</span>
          <select name="propertyOwner" required style={inputStyle}>
            <option value="">Selecciona cliente</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.fullName ?? customer.email}
              </option>
            ))}
          </select>
        </label>
        <div
          style={{
            display: "grid",
            gap: "0.75rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          }}
        >
          <label style={{ display: "grid", gap: "0.25rem" }}>
            <span>Habitaciones</span>
            <input
              name="propertyBedrooms"
              type="number"
              min="0"
              style={inputStyle}
            />
          </label>
          <label style={{ display: "grid", gap: "0.25rem" }}>
            <span>Baños</span>
            <input
              name="propertyBathrooms"
              type="number"
              min="0"
              style={inputStyle}
            />
          </label>
          <label style={{ display: "grid", gap: "0.25rem" }}>
            <span>Metros cuadrados</span>
            <input
              name="propertySqft"
              type="number"
              min="0"
              style={inputStyle}
            />
          </label>
        </div>
        <label style={{ display: "grid", gap: "0.25rem" }}>
          <span>Notas</span>
          <textarea
            name="propertyNotes"
            rows={3}
            placeholder="Notas operativas"
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </label>
        <button
          type="submit"
          style={{
            padding: "0.5rem 1.25rem",
            borderRadius: "999px",
            border: "1px solid rgba(126,231,196,0.3)",
            background: isPropertyPending
              ? "rgba(126,231,196,0.2)"
              : "rgba(11,23,28,0.8)",
            color: "#d5f6eb",
            cursor: isPropertyPending ? "wait" : "pointer",
          }}
          disabled={isPropertyPending}
        >
          {isPropertyPending ? "Registrando..." : "Guardar propiedad"}
        </button>
        {propertyMessage ? (
          <p
            style={{
              margin: 0,
              color: propertyMessage.startsWith("Error")
                ? "#fda4af"
                : "#7ee7c4",
            }}
          >
            {propertyMessage}
          </p>
        ) : null}
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
                      <span
                        className="ui-chip"
                        style={{
                          backgroundColor: user.isActive
                            ? "rgba(34, 197, 94, 0.2)"
                            : "rgba(239, 68, 68, 0.2)",
                          color: user.isActive ? "#22c55e" : "#ef4444",
                        }}
                      >
                        {user.isActive ? "Activo" : "Inactivo"}
                      </span>
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
                        style={{
                          display: "grid",
                          gap: "0.35rem",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(140px, 1fr))",
                          alignItems: "center",
                        }}
                      >
                        <select
                          name="userRole"
                          defaultValue={user.role}
                          style={inputStyle}
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
                          style={inputStyle}
                        />
                        <input
                          name="userPassword"
                          type="password"
                          placeholder="Nueva contraseña (opcional)"
                          style={inputStyle}
                        />
                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            padding: "0.5rem",
                            cursor:
                              user.id === currentUser?.id
                                ? "not-allowed"
                                : "pointer",
                            opacity: user.id === currentUser?.id ? 0.5 : 1,
                          }}
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
                              if (result.success) {
                                setUserUpdateMessage(
                                  result.success ?? "Estado actualizado",
                                );
                                setTimeout(() => {
                                  setUserUpdateMessage("");
                                }, 3000);
                              } else {
                                setUserUpdateMessage(
                                  `Error: ${result.error ?? "No se pudo actualizar el estado"}`,
                                );
                                e.target.checked = user.isActive;
                              }
                            }}
                            disabled={user.id === currentUser?.id}
                            style={{ cursor: "inherit" }}
                          />
                          <span>Activo</span>
                        </label>
                        <Button
                          type="submit"
                          variant="ghost"
                          disabled={userUpdatingId === user.id}
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
            {userUpdateMessage ? (
              <p
                style={{
                  margin: 0,
                  color: userUpdateMessage.startsWith("Error")
                    ? "#fda4af"
                    : "#7ee7c4",
                }}
              >
                {userUpdateMessage}
              </p>
            ) : null}
          </div>
        </Card>
      ) : null}

      <div style={{ display: "grid", gap: "1rem" }}>
        <h3 style={{ margin: 0, fontSize: "1.1rem" }}>
          Inventario de propiedades
        </h3>
        {properties.length === 0 ? (
          <p style={{ color: "#d5f6eb" }}>
            Aún no tienes propiedades registradas.
          </p>
        ) : (
          <div style={{ display: "grid", gap: "1rem" }}>
            {properties.map((property) => (
              <form
                key={property.id}
                action={async (formData) => {
                  await handlePropertyUpdate(property.id, formData);
                }}
                style={{
                  display: "grid",
                  gap: "0.75rem",
                  padding: "1rem",
                  borderRadius: "0.75rem",
                  border: "1px solid rgba(126,231,196,0.15)",
                  background: "rgba(11,23,28,0.6)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "1rem",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <strong>{property.label}</strong>
                    <span style={{ color: "#a7dcd0", fontSize: "0.85rem" }}>
                      {property.addressLine}, {property.city}, {property.state}{" "}
                      {property.zipCode}
                    </span>
                  </div>
                  <span style={{ color: "#6fb8a6", fontSize: "0.85rem" }}>
                    Propietario:{" "}
                    {property.owner?.fullName ?? property.owner?.email ?? "N/A"}
                  </span>
                </div>
                <div
                  style={{
                    display: "grid",
                    gap: "0.75rem",
                    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                  }}
                >
                  <label style={{ display: "grid", gap: "0.25rem" }}>
                    <span>Nombre interno</span>
                    <input
                      name="propertyLabel"
                      defaultValue={property.label}
                      style={inputStyle}
                    />
                  </label>
                  <label style={{ display: "grid", gap: "0.25rem" }}>
                    <span>Dirección</span>
                    <input
                      name="propertyAddress"
                      defaultValue={property.addressLine}
                      style={inputStyle}
                    />
                  </label>
                  <label style={{ display: "grid", gap: "0.25rem" }}>
                    <span>Ciudad</span>
                    <input
                      name="propertyCity"
                      defaultValue={property.city}
                      style={inputStyle}
                    />
                  </label>
                  <label style={{ display: "grid", gap: "0.25rem" }}>
                    <span>Estado</span>
                    <input
                      name="propertyState"
                      defaultValue={property.state}
                      style={inputStyle}
                    />
                  </label>
                  <label style={{ display: "grid", gap: "0.25rem" }}>
                    <span>ZIP</span>
                    <input
                      name="propertyZip"
                      defaultValue={property.zipCode}
                      style={inputStyle}
                    />
                  </label>
                  <label style={{ display: "grid", gap: "0.25rem" }}>
                    <span>Tipo</span>
                    <select
                      name="propertyType"
                      defaultValue={property.type}
                      style={inputStyle}
                    >
                      <option value="RESIDENTIAL">Residencial</option>
                      <option value="VACATION_RENTAL">Vacation Rental</option>
                      <option value="OFFICE">Oficina</option>
                    </select>
                  </label>
                  <label style={{ display: "grid", gap: "0.25rem" }}>
                    <span>Habitaciones</span>
                    <input
                      name="propertyBedrooms"
                      type="number"
                      min="0"
                      defaultValue={property.bedrooms ?? ""}
                      style={inputStyle}
                    />
                  </label>
                  <label style={{ display: "grid", gap: "0.25rem" }}>
                    <span>Baños</span>
                    <input
                      name="propertyBathrooms"
                      type="number"
                      min="0"
                      defaultValue={property.bathrooms ?? ""}
                      style={inputStyle}
                    />
                  </label>
                  <label style={{ display: "grid", gap: "0.25rem" }}>
                    <span>Metros cuadrados</span>
                    <input
                      name="propertySqft"
                      type="number"
                      min="0"
                      defaultValue={property.sqft ?? ""}
                      style={inputStyle}
                    />
                  </label>
                </div>
                <label style={{ display: "grid", gap: "0.25rem" }}>
                  <span>Notas</span>
                  <textarea
                    name="propertyNotes"
                    rows={2}
                    defaultValue={property.notes ?? ""}
                    style={{ ...inputStyle, resize: "vertical" }}
                  />
                </label>
                <label style={{ display: "grid", gap: "0.25rem" }}>
                  <span>Propietario</span>
                  <select
                    name="propertyOwner"
                    defaultValue={property.ownerId}
                    style={inputStyle}
                  >
                    <option value="">Mantener actual</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.fullName ?? customer.email}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="submit"
                  style={{
                    padding: "0.45rem 1.2rem",
                    borderRadius: "999px",
                    border: "1px solid rgba(126,231,196,0.3)",
                    background:
                      propertyUpdatingId === property.id
                        ? "rgba(126,231,196,0.2)"
                        : "rgba(11,23,28,0.8)",
                    color: "#d5f6eb",
                    cursor:
                      propertyUpdatingId === property.id ? "wait" : "pointer",
                    alignSelf: "flex-start",
                  }}
                  disabled={propertyUpdatingId === property.id}
                >
                  {propertyUpdatingId === property.id
                    ? "Guardando..."
                    : "Actualizar propiedad"}
                </button>
              </form>
            ))}
          </div>
        )}
        {propertyUpdateMessage ? (
          <p
            style={{
              margin: 0,
              color: propertyUpdateMessage.startsWith("Error")
                ? "#fda4af"
                : "#7ee7c4",
            }}
          >
            {propertyUpdateMessage}
          </p>
        ) : null}
      </div>

      <form
        action={(formData) =>
          startBookingAction(async () => {
            const result = await createBooking(formData);
            setBookingMessage(
              result.error
                ? `Error: ${result.error}`
                : (result.success ?? null),
            );
          })
        }
        style={{
          display: "grid",
          gap: "0.75rem",
          padding: "1rem",
          borderRadius: "0.75rem",
          background: "rgba(18,34,40,0.6)",
          border: "1px solid rgba(126,231,196,0.15)",
        }}
      >
        <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Crear reserva</h3>
        <div
          style={{
            display: "grid",
            gap: "0.75rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          }}
        >
          <label style={{ display: "grid", gap: "0.25rem" }}>
            <span>Servicio</span>
            <select name="bookingService" required style={inputStyle}>
              <option value="">Selecciona servicio</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </label>
          <label style={{ display: "grid", gap: "0.25rem" }}>
            <span>Propiedad</span>
            <select name="bookingProperty" required style={inputStyle}>
              <option value="">Selecciona propiedad</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.label} ({property.city})
                </option>
              ))}
            </select>
          </label>
          <label style={{ display: "grid", gap: "0.25rem" }}>
            <span>Cliente</span>
            <select name="bookingCustomer" required style={inputStyle}>
              <option value="">Selecciona cliente</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.fullName ?? customer.email}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label style={{ display: "grid", gap: "0.25rem" }}>
          <span>Fecha y hora</span>
          <input
            name="bookingScheduledAt"
            type="datetime-local"
            required
            style={inputStyle}
          />
        </label>
        <label style={{ display: "grid", gap: "0.25rem" }}>
          <span>Duración (min, opcional)</span>
          <input
            name="bookingDuration"
            type="number"
            min="30"
            step="15"
            style={inputStyle}
          />
        </label>
        <label style={{ display: "grid", gap: "0.25rem" }}>
          <span>Notas</span>
          <textarea
            name="bookingNotes"
            rows={3}
            placeholder="Instrucciones especiales"
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </label>
        <button
          type="submit"
          style={{
            padding: "0.5rem 1.25rem",
            borderRadius: "999px",
            border: "1px solid rgba(126,231,196,0.3)",
            background: isBookingPending
              ? "rgba(126,231,196,0.2)"
              : "rgba(11,23,28,0.8)",
            color: "#d5f6eb",
            cursor: isBookingPending ? "wait" : "pointer",
          }}
          disabled={isBookingPending}
        >
          {isBookingPending ? "Creando reserva..." : "Guardar reserva"}
        </button>
        {bookingMessage ? (
          <p
            style={{
              margin: 0,
              color: bookingMessage.startsWith("Error") ? "#fda4af" : "#7ee7c4",
            }}
          >
            {bookingMessage}
          </p>
        ) : null}
      </form>
    </section>
  );
}

const inputStyle: CSSProperties = {
  padding: "0.6rem 0.8rem",
  borderRadius: "0.5rem",
  border: "1px solid rgba(126,231,196,0.2)",
  background: "rgba(5,10,13,0.8)",
  color: "#d5f6eb",
};

function formatDateTimeLocal(date: string): string {
  const dt = new Date(date);
  const offset = dt.getTimezoneOffset();
  const local = new Date(dt.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}
