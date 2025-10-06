"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge, Button, Card } from "@brisa/ui";
import type { CleanScoreReport } from "./page";

type StatusFilter = "all" | "draft" | "published";

interface CleanScoreDashboardProps {
  initialReports: CleanScoreReport[];
  apiBase: string;
}

interface DetailState {
  loading: boolean;
  report?: CleanScoreReport;
  error?: string;
}

export default function CleanScoreDashboard({
  initialReports,
  apiBase,
}: CleanScoreDashboardProps) {
  const [reports, setReports] = useState(initialReports);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [detail, setDetail] = useState<DetailState>({ loading: false });
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setReports(initialReports);
  }, [initialReports]);

  const publishedCount = useMemo(
    () => reports.filter((report) => report.status === "PUBLISHED").length,
    [reports],
  );

  const draftCount = reports.length - publishedCount;

  const filteredReports = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return reports.filter((report) => {
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "draft" && report.status === "DRAFT") ||
        (statusFilter === "published" && report.status === "PUBLISHED");

      if (!matchesStatus) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const haystack = [
        report.bookingId,
        report.booking?.property?.name,
        report.booking?.service?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [reports, searchTerm, statusFilter]);

  async function refreshReports() {
    try {
      const response = await fetch(
        `${apiBase}/api/reports/cleanscore?limit=50`,
        {
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error("No se pudo refrescar el listado");
      }

      const data = (await response.json()) as { reports?: CleanScoreReport[] };
      setReports(data.reports ?? []);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Error al refrescar los reportes CleanScore",
      );
    }
  }

  async function publishReport(bookingId: string) {
    setLoadingId(bookingId);
    setError(null);
    try {
      const response = await fetch(
        `${apiBase}/api/reports/cleanscore/${bookingId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ sendEmail: true }),
        },
      );

      if (!response.ok) {
        throw new Error("No se pudo publicar el reporte");
      }

      const result = (await response.json()) as {
        success?: boolean;
        status?: string;
        emailSent?: boolean;
      };

      if (result.success) {
        await refreshReports();
        if (result.emailSent) {
          alert("Reporte publicado y enviado al cliente");
        } else {
          alert(
            "Reporte actualizado, pero el envío por correo falló. Revisa los logs.",
          );
        }
      } else {
        throw new Error("Hubo un problema al publicar el reporte");
      }
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Error al publicar el reporte",
      );
    } finally {
      setLoadingId(null);
    }
  }

  async function viewReport(bookingId: string) {
    setDetail({ loading: true });
    try {
      const response = await fetch(
        `${apiBase}/api/reports/cleanscore/${bookingId}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error("No se pudo obtener el detalle del reporte");
      }

      const report = (await response.json()) as CleanScoreReport;
      setDetail({ loading: false, report });
    } catch (err) {
      console.error(err);
      setDetail({
        loading: false,
        error:
          err instanceof Error
            ? err.message
            : "Error al cargar el detalle del reporte",
      });
    }
  }

  function formatDate(timestamp: string) {
    return new Date(timestamp).toLocaleString("es-US");
  }

  function summarizeBooking(report: CleanScoreReport): string {
    if (!report.booking) {
      return "Reporte generado a partir del staff app";
    }

    const propertyName = report.booking.property?.name ?? "";
    const serviceName = report.booking.service?.name ?? "";

    if (propertyName && serviceName) {
      return `${propertyName} · ${serviceName}`;
    }

    if (propertyName) {
      return propertyName;
    }

    if (serviceName) {
      return serviceName;
    }

    return "Reporte generado a partir del staff app";
  }

  return (
    <div className="flex flex-col gap-6 py-12">
      <header className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">CleanScore™</h1>
          <p className="text-sm text-neutral-400">
            Monitorea las auditorías de calidad con IA, publica resultados y
            envía reportes a los clientes.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Badge tone="teal">Publicados: {publishedCount}</Badge>
          <Badge tone="neutral">Borradores: {draftCount}</Badge>
          <Link href="/staff" className="ml-auto">
            <Button intent="primary">Ir a App Staff para captura</Button>
          </Link>
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-sm text-neutral-200">
          <label className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-[0.2em] text-neutral-500">
              Estado
            </span>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
              name="status-filter"
              data-testid="status-filter"
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white focus:border-teal-400 focus:outline-none"
            >
              <option value="all">Todos</option>
              <option value="draft">Borradores</option>
              <option value="published">Publicados</option>
            </select>
          </label>
          <label className="flex min-w-[200px] flex-1 items-center gap-2">
            <span className="text-xs uppercase tracking-[0.2em] text-neutral-500">
              Buscar
            </span>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Booking, propiedad o servicio"
              name="cleanscore-search"
              data-testid="cleanscore-search"
              className="w-full rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white focus:border-teal-400 focus:outline-none"
            />
          </label>
        </div>
      </header>

      {error ? (
        <Card title="Error" className="border-rose-400/40 bg-rose-500/10">
          <p className="text-sm text-neutral-200">{error}</p>
        </Card>
      ) : null}

      <section className="grid gap-4">
        {filteredReports.map((report) => (
          <Card key={report.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Booking {report.bookingId}
                </h3>
                <p className="text-sm text-neutral-300">
                  {summarizeBooking(report)}
                </p>
              </div>
              <Badge tone={report.status === "PUBLISHED" ? "teal" : "neutral"}>
                {report.status === "PUBLISHED" ? "Publicado" : "Borrador"}
              </Badge>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-neutral-300">
              <span>CleanScore™: {Math.round(report.score)}/100</span>
              <span>Actualizado: {formatDate(report.updatedAt)}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                intent="secondary"
                onClick={() => viewReport(report.bookingId)}
                disabled={
                  detail.loading &&
                  detail.report?.bookingId === report.bookingId
                }
              >
                Ver detalle
              </Button>
              {report.status !== "PUBLISHED" ? (
                <Button
                  intent="primary"
                  onClick={() => publishReport(report.bookingId)}
                  disabled={loadingId === report.bookingId}
                >
                  {loadingId === report.bookingId
                    ? "Publicando..."
                    : "Publicar y enviar"}
                </Button>
              ) : null}
            </div>
          </Card>
        ))}

        {reports.length === 0 ? (
          <Card title="Sin reportes CleanScore™ todavía">
            <p className="text-sm text-neutral-300">
              Genera una nueva inspección desde la App Staff o desde el panel de
              bookings completados.
            </p>
          </Card>
        ) : null}

        {reports.length > 0 && filteredReports.length === 0 ? (
          <Card title="No encontramos reportes con esos filtros">
            <p className="text-sm text-neutral-300">
              Ajusta el estado o la búsqueda para ver otras auditorías.
            </p>
          </Card>
        ) : null}
      </section>

      {detail.report ? (
        <Card
          title={`Detalle CleanScore™ · ${detail.report.booking?.property?.name ?? detail.report.bookingId}`}
          description={`Estado: ${detail.report.status}`}
        >
          <div className="grid gap-2 text-sm text-neutral-200">
            <span>Score: {Math.round(detail.report.score)}/100</span>
            <span>Equipo: {detail.report.teamMembers.join(", ")}</span>
            <span>Observaciones: {detail.report.observations}</span>
          </div>
          <div className="mt-3 grid gap-1 text-xs text-neutral-400">
            <span>Métricas:</span>
            <span>
              • Limpieza General:{" "}
              {detail.report.metrics.generalCleanliness.toFixed(1)} / 5
            </span>
            <span>
              • Cocina: {detail.report.metrics.kitchen.toFixed(1)} / 5
            </span>
            <span>
              • Baños: {detail.report.metrics.bathrooms.toFixed(1)} / 5
            </span>
            <span>
              • Detalles Premium:{" "}
              {detail.report.metrics.premiumDetails.toFixed(1)} / 5
            </span>
            <span>
              • Ambientación: {detail.report.metrics.ambiance.toFixed(1)} / 5
            </span>
            <span>
              • Puntualidad: {detail.report.metrics.timeCompliance.toFixed(1)} /
              5
            </span>
          </div>
          {detail.report.recommendations.length > 0 ? (
            <div className="mt-3">
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                Recomendaciones
              </p>
              <ul className="mt-2 list-disc pl-5 text-sm text-neutral-200">
                {detail.report.recommendations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {detail.report.videos.length > 0 ? (
            <div className="mt-3">
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                Videos
              </p>
              <ul className="mt-2 list-disc pl-5 text-sm text-neutral-200">
                {detail.report.videos.map((video) => (
                  <li key={video}>{video}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </Card>
      ) : null}

      {detail.loading ? (
        <Card
          title="Cargando detalle"
          className="border-teal-400/40 bg-teal-500/10"
        >
          <p className="text-sm text-neutral-200">
            Obteniendo información del reporte seleccionado…
          </p>
        </Card>
      ) : null}

      {detail.error ? (
        <Card
          title="No se pudo cargar el detalle"
          className="border-rose-400/40 bg-rose-500/10"
        >
          <p className="text-sm text-neutral-200">{detail.error}</p>
        </Card>
      ) : null}
    </div>
  );
}
