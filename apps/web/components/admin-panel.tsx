"use client";

import { useFormStatus } from "react-dom";
import { useState, useTransition } from "react";
import type { ReactNode, CSSProperties } from "react";
import type { Service } from "@/lib/api";

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
  createService: (formData: FormData) => Promise<ActionResult>;
  toggleService: (serviceId: string, active: boolean) => Promise<ActionResult>;
};

export function AdminPanel({ services, createService, toggleService }: AdminPanelProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isToggling, startToggle] = useTransition();

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
        {message ? (
          <p style={{ marginTop: "0.75rem", color: message.startsWith("Error") ? "#fda4af" : "#7ee7c4" }}>
            {message}
          </p>
        ) : null}
      </header>

      <form
        action={async (formData) => {
          const result = await createService(formData);
          setMessage(result.error ? `Error: ${result.error}` : result.success ?? null);
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
                      setMessage(result.error ? `Error: ${result.error}` : result.success ?? null);
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
