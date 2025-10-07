import React from "react";
import { cookies } from "next/headers";
import Link from "next/link";
import { AdminPanel } from "@/components/admin-panel";
import {
  createServiceAction,
  createPropertyAction,
  createBookingAction,
  toggleServiceActiveAction,
  logoutAction,
} from "@/app/actions";
import { fetchServices, fetchUpcomingBookings, fetchProperties, fetchCustomers } from "@/lib/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const currencyFormatter = new Intl.NumberFormat("es-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("es-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function HomePage() {
  const store = await cookies();
  const isAuthenticated = Boolean(store.get("auth_token"));
  const [services, bookings, properties, customers] = await Promise.all([
    fetchServices(),
    fetchUpcomingBookings(),
    fetchProperties(),
    fetchCustomers(),
  ]);

  const activeServices = services.filter((service) => service.active).slice(0, 4);
  const upcomingBookings = bookings.slice(0, 4);

  const sections = [
    {
      title: "Estado",
      body: `Stack reiniciado con API Hono + Prisma y frontend Next.js. Hay ${services.length} servicios configurados y ${bookings.length} reservas sembradas para pruebas end-to-end.`,
    },
    {
      title: "Siguientes pasos",
      body: "Implementar autenticación real, panel operativo y pipelines CI/CD antes de exponer ambientes externos.",
    },
    {
      title: "Contacto",
      body: "hola@brisacubanaclean.com",
    },
  ];

  return (
    <main style={{ padding: "4rem 1.5rem", maxWidth: "960px", margin: "0 auto" }}>
      <header style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <span style={{ fontSize: "0.75rem", letterSpacing: "0.4em", textTransform: "uppercase", color: "#7ee7c4" }}>
          Brisa Cubana Clean Intelligence
        </span>
        <h1 style={{ fontSize: "clamp(2.5rem, 5vw, 3.5rem)", margin: 0 }}>
          Plataforma en construcción con código verificable
        </h1>
        <p style={{ fontSize: "1.1rem", color: "#b8d9d0", maxWidth: "60ch" }}>
          Replanteamos el proyecto para que cada afirmación esté respaldada por implementación real. Este landing refleja el estado actual y enlaza solo a documentación verificada.
        </p>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <Link href="https://github.com/albertodimas/brisa-cubana-clean-intelligence" style={{ color: "#7ee7c4" }}>
            Repositorio en GitHub
          </Link>
          <a
            href="https://albertodimas.github.io/brisa-cubana-clean-intelligence/"
            style={{ color: "#7ee7c4" }}
            rel="noreferrer"
            target="_blank"
          >
            Documentación pública
          </a>
        </div>
      </header>

      <section style={{ marginTop: "3rem", display: "grid", gap: "1.5rem" }}>
        {sections.map((section) => (
          <article
            key={section.title}
            style={{
              background: "rgba(13,25,30,0.6)",
              padding: "1.5rem",
              borderRadius: "1rem",
              border: "1px solid rgba(126,231,196,0.2)",
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: "0.75rem", fontSize: "1.5rem" }}>{section.title}</h2>
            <p style={{ margin: 0, color: "#d5f6eb" }}>{section.body}</p>
          </article>
        ))}
      </section>

      <section style={{ marginTop: "3rem", display: "grid", gap: "1.5rem" }}>
        <article
          style={{
            background: "rgba(11,23,28,0.6)",
            padding: "1.5rem",
            borderRadius: "1rem",
            border: "1px solid rgba(126,231,196,0.2)",
          }}
        >
          <header style={{ marginBottom: "1rem" }}>
            <h2 style={{ margin: 0, fontSize: "1.4rem" }}>Servicios disponibles</h2>
            <p style={{ margin: 0, color: "#a7dcd0" }}>
              Datos en vivo provenientes de la API REST (`/api/services`).
            </p>
          </header>
          {activeServices.length === 0 ? (
            <p style={{ color: "#d5f6eb" }}>Aún no hay servicios configurados en la base de datos.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "1rem" }}>
              {activeServices.map((service) => (
                <li
                  key={service.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.25rem",
                    background: "rgba(18,34,40,0.6)",
                    padding: "1rem",
                    borderRadius: "0.75rem",
                    border: "1px solid rgba(126,231,196,0.15)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "1rem" }}>
                    <strong style={{ fontSize: "1.1rem" }}>{service.name}</strong>
                    <span style={{ color: "#7ee7c4", fontWeight: 500 }}>
                      {currencyFormatter.format(service.basePrice)}
                    </span>
                  </div>
                  {service.description ? (
                    <p style={{ margin: 0, color: "#b8d9d0" }}>{service.description}</p>
                  ) : null}
                  <span style={{ fontSize: "0.85rem", color: "#6fb8a6" }}>
                    Duración estimada: {service.durationMin} min · Última actualización: {dateFormatter.format(new Date(service.updatedAt))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article
          style={{
            background: "rgba(11,23,28,0.6)",
            padding: "1.5rem",
            borderRadius: "1rem",
            border: "1px solid rgba(126,231,196,0.2)",
          }}
        >
          <header style={{ marginBottom: "1rem" }}>
            <h2 style={{ margin: 0, fontSize: "1.4rem" }}>Próximas reservas</h2>
            <p style={{ margin: 0, color: "#a7dcd0" }}>
              Mostrando hasta cuatro reservas futuras desde `/api/bookings`.
            </p>
          </header>
          {upcomingBookings.length === 0 ? (
            <p style={{ color: "#d5f6eb" }}>Aún no hay reservas programadas en la base de datos.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "1rem" }}>
              {upcomingBookings.map((booking) => (
                <li
                  key={booking.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.25rem",
                    background: "rgba(18,34,40,0.6)",
                    padding: "1rem",
                    borderRadius: "0.75rem",
                    border: "1px solid rgba(126,231,196,0.15)",
                  }}
                >
                  <strong style={{ fontSize: "1.05rem" }}>{booking.service.name}</strong>
                  <span style={{ color: "#b8d9d0" }}>
                    {booking.property.label} · {booking.property.city}
                  </span>
                  <span style={{ fontSize: "0.95rem", color: "#7ee7c4" }}>
                    {dateFormatter.format(new Date(booking.scheduledAt))}
                  </span>
                  <span style={{ fontSize: "0.85rem", color: "#6fb8a6" }}>
                    Código {booking.code} · {currencyFormatter.format(booking.totalAmount)} · Estado {booking.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article
          style={{
            background: "rgba(11,23,28,0.6)",
            padding: "1.5rem",
            borderRadius: "1rem",
            border: "1px solid rgba(126,231,196,0.2)",
          }}
        >
          <header style={{ marginBottom: "1rem" }}>
            <h2 style={{ margin: 0, fontSize: "1.4rem" }}>Inventario de propiedades</h2>
            <p style={{ margin: 0, color: "#a7dcd0" }}>
              {properties.length} propiedades activas listas para asignación.
            </p>
          </header>
          {properties.length === 0 ? (
            <p style={{ color: "#d5f6eb" }}>Crea una propiedad desde el panel operativo para iniciar programación.</p>
          ) : (
            <div style={{ display: "grid", gap: "1rem" }}>
              {properties.slice(0, 4).map((property) => (
                <div
                  key={property.id}
                  style={{
                    padding: "1rem",
                    borderRadius: "0.75rem",
                    border: "1px solid rgba(126,231,196,0.15)",
                    background: "rgba(18,34,40,0.6)",
                  }}
                >
                  <strong>{property.label}</strong>
                  <p style={{ margin: "0.35rem 0", color: "#a7dcd0" }}>
                    {property.addressLine}, {property.city}, {property.state} {property.zipCode}
                  </p>
                  <span style={{ fontSize: "0.85rem", color: "#6fb8a6" }}>
                    Propietario: {property.owner?.fullName ?? property.owner?.email ?? "N/A"}
                  </span>
                </div>
              ))}
              {properties.length > 4 ? (
                <span style={{ color: "#7ee7c4", fontSize: "0.9rem" }}>
                  {properties.length - 4} propiedades adicionales no mostradas.
                </span>
              ) : null}
            </div>
          )}
        </article>

        <article
          style={{
            background: "rgba(11,23,28,0.6)",
            padding: "1.5rem",
            borderRadius: "1rem",
            border: "1px solid rgba(126,231,196,0.2)",
          }}
        >
          <header style={{ marginBottom: "1rem" }}>
            <h2 style={{ margin: 0, fontSize: "1.4rem" }}>Clientes activos</h2>
            <p style={{ margin: 0, color: "#a7dcd0" }}>
              {customers.length} clientes con reservas o propiedades registradas.
            </p>
          </header>
          {customers.length === 0 ? (
            <p style={{ color: "#d5f6eb" }}>Registra clientes desde el panel operativo o mediante seed.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "0.75rem" }}>
              {customers.slice(0, 5).map((customer) => (
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
                  <span style={{ color: "#a7dcd0", fontSize: "0.9rem" }}>{customer.email}</span>
                </li>
              ))}
              {customers.length > 5 ? (
                <span style={{ color: "#7ee7c4", fontSize: "0.9rem" }}>
                  {customers.length - 5} clientes adicionales no mostrados.
                </span>
              ) : null}
            </ul>
          )}
        </article>
      </section>

      {isAuthenticated ? (
        <AdminPanel
          services={services}
          properties={properties}
          customers={customers}
          createService={createServiceAction}
          createProperty={createPropertyAction}
          createBooking={createBookingAction}
          toggleService={toggleServiceActiveAction}
          logout={logoutAction}
        />
      ) : (
        <section
          style={{
            marginTop: "3rem",
            padding: "1.5rem",
            borderRadius: "1rem",
            border: "1px solid rgba(126,231,196,0.2)",
            background: "rgba(7,15,18,0.6)",
            display: "grid",
            gap: "0.75rem",
          }}
        >
          <h2 style={{ margin: 0 }}>Acceso restringido</h2>
          <p style={{ margin: 0, color: "#a7dcd0" }}>
            Inicia sesión para crear o gestionar servicios operativos.
          </p>
          <Link href="/login" style={{ color: "#7ee7c4" }}>
            Ir a iniciar sesión
          </Link>
        </section>
      )}
    </main>
  );
}
