"use client";

import { useFormStatus } from "react-dom";
import { useState, useTransition } from "react";
import type { ReactNode, CSSProperties } from "react";
import type { Customer, Property, Service } from "@/lib/api";

type ActionResult = {
  success?: string;
  error?: string;
};

function SubmitButton({ children }: { children: ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      style={{
        padding: "0.5rem 1.25rem",
        borderRadius: "999px",
        border: "1px solid rgba(126,231,196,0.3)",
        background: pending ? "rgba(126,231,196,0.2)" : "rgba(11,23,28,0.8)",
        color: "#d5f6eb",
        cursor: pending ? "wait" : "pointer",
      }}
      disabled={pending}
    >
      {pending ? "Enviando..." : children}
    </button>
  );
}

type AdminPanelProps = {
  services: Service[];
  properties: Property[];
  customers: Customer[];
  createService: (formData: FormData) => Promise<ActionResult>;
  createProperty: (formData: FormData) => Promise<ActionResult>;
  createBooking: (formData: FormData) => Promise<ActionResult>;
  toggleService: (serviceId: string, active: boolean) => Promise<ActionResult>;
  logout: () => Promise<ActionResult>;
};

export function AdminPanel({
  services,
  properties,
  customers,
  createService,
  createProperty,
  createBooking,
  toggleService,
  logout,
}: AdminPanelProps) {
  const [serviceMessage, setServiceMessage] = useState<string | null>(null);
  const [propertyMessage, setPropertyMessage] = useState<string | null>(null);
  const [bookingMessage, setBookingMessage] = useState<string | null>(null);
  const [logoutMessage, setLogoutMessage] = useState<string | null>(null);
  const [isToggling, startToggle] = useTransition();
  const [isLoggingOut, setLoggingOut] = useState(false);
  const [isPropertyPending, startPropertyAction] = useTransition();
  const [isBookingPending, startBookingAction] = useTransition();

  return (
    <section
      style={{
        marginTop: "3rem",
        display: "grid",
        gap: "2rem",
        background: "rgba(7,15,18,0.6)",
        padding: "1.5rem",
        borderRadius: "1rem",
        border: "1px solid rgba(126,231,196,0.2)",
      }}
    >
      <header>
        <h2 style={{ margin: 0, fontSize: "1.4rem" }}>Panel operativo</h2>
        <p style={{ margin: 0, color: "#a7dcd0" }}>
          Crea nuevos servicios y activa/desactiva ofertas para pruebas rápidas.
        </p>
        <button
          type="button"
          onClick={async () => {
            setLoggingOut(true);
            const result = await logout();
            setLoggingOut(false);
            setLogoutMessage(result.error ? `Error: ${result.error}` : result.success ?? null);
          }}
          style={{
            marginTop: "0.75rem",
            alignSelf: "flex-start",
            padding: "0.4rem 0.9rem",
            borderRadius: "999px",
            border: "1px solid rgba(126,231,196,0.3)",
            background: "transparent",
            color: "#d5f6eb",
            cursor: isLoggingOut ? "wait" : "pointer",
            opacity: isLoggingOut ? 0.6 : 1,
          }}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
        </button>
        {logoutMessage ? (
          <p style={{ marginTop: "0.75rem", color: logoutMessage.startsWith("Error") ? "#fda4af" : "#7ee7c4" }}>
            {logoutMessage}
          </p>
        ) : null}
      </header>

      <form
        action={async (formData) => {
          const result = await createService(formData);
          setServiceMessage(result.error ? `Error: ${result.error}` : result.success ?? null);
        }}
        style={{
          display: "grid",
          gap: "0.75rem",
          padding: "1rem",
          borderRadius: "0.75rem",
          background: "rgba(18,34,40,0.6)",
          border: "1px solid rgba(126,231,196,0.15)",
        }}
      >
        <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Crear servicio</h3>
        <label style={{ display: "grid", gap: "0.25rem" }}>
          <span>Nombre</span>
          <input name="name" required placeholder="Ej. Turnover rápido" style={inputStyle} />
        </label>
        <label style={{ display: "grid", gap: "0.25rem" }}>
          <span>Descripción</span>
          <textarea name="description" rows={3} placeholder="Opcional" style={{ ...inputStyle, resize: "vertical" }} />
        </label>
        <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
          <label style={{ display: "grid", gap: "0.25rem" }}>
            <span>Precio base (USD)</span>
            <input name="basePrice" type="number" required min="0" step="0.01" style={inputStyle} />
          </label>
          <label style={{ display: "grid", gap: "0.25rem" }}>
            <span>Duración (min)</span>
            <input name="durationMin" type="number" required min="30" step="15" style={inputStyle} />
          </label>
        </div>
        <SubmitButton>Guardar</SubmitButton>
        {serviceMessage ? (
          <p style={{ margin: 0, color: serviceMessage.startsWith("Error") ? "#fda4af" : "#7ee7c4" }}>
            {serviceMessage}
          </p>
        ) : null}
      </form>

      <div style={{ display: "grid", gap: "1rem" }}>
        <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Gestionar servicios</h3>
        {services.length === 0 ? (
          <p style={{ color: "#d5f6eb" }}>No hay servicios configurados todavía.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "1rem" }}>
            {services.map((service) => (
              <li
                key={service.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                  padding: "1rem",
                  borderRadius: "0.75rem",
                  border: "1px solid rgba(126,231,196,0.15)",
                  background: "rgba(11,23,28,0.6)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "1rem" }}>
                  <strong>{service.name}</strong>
                  <span style={{ color: service.active ? "#7ee7c4" : "#fda4af" }}>
                    {service.active ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    startToggle(async () => {
                      const result = await toggleService(service.id, !service.active);
                      setServiceMessage(result.error ? `Error: ${result.error}` : result.success ?? null);
                    });
                  }}
                  style={{
                    alignSelf: "flex-start",
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
              </li>
            ))}
          </ul>
        )}
      </div>

      <form
        action={(formData) =>
          startPropertyAction(async () => {
            const result = await createProperty(formData);
            setPropertyMessage(result.error ? `Error: ${result.error}` : result.success ?? null);
          })}
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
          <input name="propertyLabel" required placeholder="Ej. Brickell Loft" style={inputStyle} />
        </label>
        <label style={{ display: "grid", gap: "0.25rem" }}>
          <span>Dirección</span>
          <input name="propertyAddress" required placeholder="Calle, número" style={inputStyle} />
        </label>
        <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
          <label style={{ display: "grid", gap: "0.25rem" }}>
            <span>Ciudad</span>
            <input name="propertyCity" required style={inputStyle} />
          </label>
          <label style={{ display: "grid", gap: "0.25rem" }}>
            <span>Estado</span>
            <input name="propertyState" required maxLength={2} style={inputStyle} />
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
        <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
          <label style={{ display: "grid", gap: "0.25rem" }}>
            <span>Habitaciones</span>
            <input name="propertyBedrooms" type="number" min="0" style={inputStyle} />
          </label>
          <label style={{ display: "grid", gap: "0.25rem" }}>
            <span>Baños</span>
            <input name="propertyBathrooms" type="number" min="0" style={inputStyle} />
          </label>
          <label style={{ display: "grid", gap: "0.25rem" }}>
            <span>Metros cuadrados</span>
            <input name="propertySqft" type="number" min="0" style={inputStyle} />
          </label>
        </div>
        <label style={{ display: "grid", gap: "0.25rem" }}>
          <span>Notas</span>
          <textarea name="propertyNotes" rows={3} placeholder="Notas operativas" style={{ ...inputStyle, resize: "vertical" }} />
        </label>
        <button
          type="submit"
          style={{
            padding: "0.5rem 1.25rem",
            borderRadius: "999px",
            border: "1px solid rgba(126,231,196,0.3)",
            background: isPropertyPending ? "rgba(126,231,196,0.2)" : "rgba(11,23,28,0.8)",
            color: "#d5f6eb",
            cursor: isPropertyPending ? "wait" : "pointer",
          }}
          disabled={isPropertyPending}
        >
          {isPropertyPending ? "Registrando..." : "Guardar propiedad"}
        </button>
        {propertyMessage ? (
          <p style={{ margin: 0, color: propertyMessage.startsWith("Error") ? "#fda4af" : "#7ee7c4" }}>
            {propertyMessage}
          </p>
        ) : null}
      </form>

      <form
        action={(formData) =>
          startBookingAction(async () => {
            const result = await createBooking(formData);
            setBookingMessage(result.error ? `Error: ${result.error}` : result.success ?? null);
          })}
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
        <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
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
          <input name="bookingScheduledAt" type="datetime-local" required style={inputStyle} />
        </label>
        <label style={{ display: "grid", gap: "0.25rem" }}>
          <span>Duración (min, opcional)</span>
          <input name="bookingDuration" type="number" min="30" step="15" style={inputStyle} />
        </label>
        <label style={{ display: "grid", gap: "0.25rem" }}>
          <span>Notas</span>
          <textarea name="bookingNotes" rows={3} placeholder="Instrucciones especiales" style={{ ...inputStyle, resize: "vertical" }} />
        </label>
        <button
          type="submit"
          style={{
            padding: "0.5rem 1.25rem",
            borderRadius: "999px",
            border: "1px solid rgba(126,231,196,0.3)",
            background: isBookingPending ? "rgba(126,231,196,0.2)" : "rgba(11,23,28,0.8)",
            color: "#d5f6eb",
            cursor: isBookingPending ? "wait" : "pointer",
          }}
          disabled={isBookingPending}
        >
          {isBookingPending ? "Creando reserva..." : "Guardar reserva"}
        </button>
        {bookingMessage ? (
          <p style={{ margin: 0, color: bookingMessage.startsWith("Error") ? "#fda4af" : "#7ee7c4" }}>
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
