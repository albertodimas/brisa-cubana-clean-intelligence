import React from "react";
import Link from "next/link";
import { AdminPanel } from "@/components/admin-panel";
import { createServiceAction, toggleServiceActiveAction } from "@/app/actions";
import { fetchServices, fetchUpcomingBookings } from "@/lib/api";

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
  const [services, bookings] = await Promise.all([
    fetchServices(),
    fetchUpcomingBookings(),
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
      </section>

      <AdminPanel
        services={services}
        createService={createServiceAction}
        toggleService={toggleServiceActiveAction}
      />
    </main>
  );
}
