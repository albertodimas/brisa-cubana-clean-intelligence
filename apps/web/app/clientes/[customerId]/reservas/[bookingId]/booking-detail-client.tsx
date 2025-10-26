"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Booking, PortalBookingDetail } from "@/lib/api";
import { PortalCallout } from "@/components/portal/callout";
import { PortalTimelineItem } from "@/components/portal/timeline-item";
import {
  cancelPortalBooking,
  reschedulePortalBooking,
} from "@/lib/portal-actions";
import {
  formatPortalSessionRemaining,
  getPortalSessionRemaining,
  parsePortalSessionExpiresAt,
} from "@/lib/portal-session";
import { recordPortalEvent } from "@/lib/portal-telemetry";
import { Skeleton } from "@/components/ui/skeleton";
import { toPortalDatetimeLocalValue } from "@/lib/portal-utils";
import { ScrollReveal } from "@/components/ui";

type PortalBookingDetailClientProps = PortalBookingDetail & {
  sessionExpiresAt?: string | null;
};

type ActionState =
  | { type: "cancel"; booking: Booking; reason: string }
  | { type: "reschedule"; booking: Booking; scheduledAt: string; notes: string }
  | null;

export function PortalBookingDetailClient({
  booking,
  customer,
  sessionExpiresAt,
}: PortalBookingDetailClientProps) {
  const router = useRouter();
  const [actionState, setActionState] = useState<ActionState>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [sessionRemainingMs, setSessionRemainingMs] = useState(() =>
    getPortalSessionRemaining(
      parsePortalSessionExpiresAt(sessionExpiresAt ?? null),
    ),
  );

  useEffect(() => {
    const expiresAt = parsePortalSessionExpiresAt(sessionExpiresAt ?? null);
    if (!expiresAt) {
      return;
    }
    const interval = window.setInterval(() => {
      setSessionRemainingMs(getPortalSessionRemaining(expiresAt));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [sessionExpiresAt]);

  const sessionCountdown = formatPortalSessionRemaining(sessionRemainingMs);
  const hasKnownSession = Boolean(sessionExpiresAt);
  const isSessionExpired = sessionRemainingMs <= 0;
  const sessionStatusLabel = !hasKnownSession
    ? "Sesión sin tiempo disponible"
    : isSessionExpired
      ? "Tu sesión de portal expiró"
      : `Sesión vence en ${sessionCountdown}`;

  const minRescheduleValue = useMemo(
    () => toPortalDatetimeLocalValue(new Date(Date.now() + 30 * 60 * 1000)),
    [],
  );

  const openCancel = () => {
    setActionError(null);
    setActionSuccess(null);
    setActionState({ type: "cancel", booking, reason: "" });
  };

  const openReschedule = () => {
    setActionError(null);
    setActionSuccess(null);
    setActionState({
      type: "reschedule",
      booking,
      scheduledAt: toPortalDatetimeLocalValue(new Date(booking.scheduledAt)),
      notes: "",
    });
  };

  const closeModal = () => {
    setActionState(null);
  };

  const handleSubmit = () => {
    if (!actionState) return;
    startTransition(async () => {
      try {
        if (actionState.type === "cancel") {
          await cancelPortalBooking({
            bookingId: actionState.booking.id,
            reason: actionState.reason.trim() || undefined,
          });
          recordPortalEvent("portal.booking.cancelled", {
            bookingId: booking.id,
            customerId: customer.id,
          });
          setActionSuccess(
            "Tu solicitud de cancelación fue registrada. Nuestro equipo confirmará el cambio por correo.",
          );
        } else {
          await reschedulePortalBooking({
            bookingId: actionState.booking.id,
            scheduledAt: new Date(actionState.scheduledAt).toISOString(),
            notes: actionState.notes.trim() || undefined,
          });
          recordPortalEvent("portal.booking.rescheduled", {
            bookingId: booking.id,
            customerId: customer.id,
          });
          setActionSuccess(
            "Tu solicitud de reagendado fue enviada. Recibirás confirmación una vez que operaciones la procese.",
          );
        }
        closeModal();
        setActionError(null);
        router.refresh();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "No pudimos procesar tu solicitud.";
        setActionError(message);
        recordPortalEvent("portal.booking.action.error", {
          bookingId: booking.id,
          type: actionState.type,
          message,
        });
      }
    });
  };

  const timelineItems = useMemo(() => {
    const items = [
      {
        status: booking.status,
        title: booking.service.name,
        meta: new Date(booking.scheduledAt).toLocaleString(),
      },
    ];
    if (booking.notes) {
      items.push({
        status: "NOTES",
        title: "Notas del servicio",
        meta: booking.notes,
      });
    }
    return items;
  }, [booking]);

  const supportEmail = "soporte@brisacubanacleanintelligence.com";

  return (
    <div className="space-y-8">
      {actionSuccess ? (
        <ScrollReveal variant="fadeDown" delay={0.1}>
          <PortalCallout
            title="Solicitud enviada"
            description={<p>{actionSuccess}</p>}
            action={
              <button
                type="button"
                onClick={() => setActionSuccess(null)}
                className="rounded-full border border-brisa-500/60 px-4 py-2 text-sm font-semibold text-brisa-600 transition-colors hover:bg-brisa-100 dark:border-brisa-400/60 dark:text-brisa-200 dark:hover:bg-brisa-800/60"
              >
                Ocultar mensaje
              </button>
            }
          />
        </ScrollReveal>
      ) : null}

      <ScrollReveal variant="fadeUp" delay={0.2}>
        <section className="rounded-3xl border border-white/60 bg-white/90 p-8 shadow-xl dark:border-brisa-700/50 dark:bg-brisa-900/80">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-brisa-300/60 bg-brisa-50/80 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-brisa-600 dark:border-brisa-500/40 dark:bg-brisa-800/70 dark:text-brisa-200">
                Reserva {booking.code}
              </span>
              <h1 className="mt-4 text-3xl font-semibold text-gray-900 dark:text-white">
                {booking.service.name} en {booking.property.label}
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-brisa-300">
                Programado para {new Date(booking.scheduledAt).toLocaleString()}{" "}
                · Duración estimada {booking.durationMin} minutos.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2 text-right text-xs text-gray-500 dark:text-brisa-400">
              <span>
                Estado actual:
                <span className="ml-1 rounded-full border border-brisa-200/60 px-3 py-1 text-xs font-semibold text-brisa-600 dark:border-brisa-500/40 dark:text-brisa-200">
                  {booking.status}
                </span>
              </span>
              <span>{sessionStatusLabel}</span>
            </div>
          </header>

          <dl className="mt-6 grid gap-4 text-sm text-gray-700 dark:text-brisa-200 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase text-gray-500 dark:text-brisa-400">
                Dirección
              </dt>
              <dd>
                {booking.property.label} · {booking.property.city}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-gray-500 dark:text-brisa-400">
                Cliente
              </dt>
              <dd>{customer.fullName ?? customer.email}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-gray-500 dark:text-brisa-400">
                Monto estimado
              </dt>
              <dd>${booking.totalAmount.toFixed(2)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-gray-500 dark:text-brisa-400">
                Código
              </dt>
              <dd>{booking.code}</dd>
            </div>
          </dl>

          {booking.notes ? (
            <div className="mt-6 rounded-2xl border border-brisa-200/60 bg-brisa-50/70 p-4 text-sm text-gray-700 dark:border-brisa-700/40 dark:bg-brisa-900/60 dark:text-brisa-200">
              {booking.notes}
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={openReschedule}
              disabled={isPending || isSessionExpired}
              className="inline-flex items-center rounded-full border border-brisa-500/60 px-4 py-2 text-xs font-semibold text-brisa-600 transition-colors hover:bg-brisa-100 disabled:opacity-60 dark:border-brisa-400/60 dark:text-brisa-200 dark:hover:bg-brisa-800/60"
            >
              Reagendar
            </button>
            <button
              type="button"
              onClick={openCancel}
              disabled={isPending || isSessionExpired}
              className="inline-flex items-center rounded-full border border-red-400/60 px-4 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60 dark:border-red-500/60 dark:text-red-200 dark:hover:bg-red-900/40"
            >
              Cancelar
            </button>
            <Link
              href={`/clientes/${customer.id}`}
              className="inline-flex items-center rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-100 dark:border-brisa-700 dark:text-brisa-300 dark:hover:bg-brisa-800/50"
            >
              Volver al dashboard
            </Link>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal variant="fadeUp" delay={0.25}>
        <section className="space-y-4 rounded-3xl border border-white/70 bg-white/90 p-8 shadow-xl backdrop-blur-md dark:border-brisa-700/40 dark:bg-brisa-900/80">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Timeline de la reserva
          </h2>
          <ol className="space-y-4 border-l border-dashed border-brisa-300/60 pl-5 dark:border-brisa-700/50">
            {timelineItems.map((item, index) => (
              <PortalTimelineItem
                key={`${item.status}-${index}`}
                status={item.status}
                title={item.title}
                meta={item.meta}
              />
            ))}
          </ol>
        </section>
      </ScrollReveal>

      <ScrollReveal variant="fadeIn" delay={0.3}>
        <PortalCallout
          title="¿Necesitas ayuda?"
          description={
            <p>
              Ponte en contacto con operaciones para coordinar cambios
              adicionales, dudas o servicios especiales. Recuerda incluir el
              código {booking.code} en tu mensaje.
            </p>
          }
          action={
            <Link
              href={`mailto:${supportEmail}?subject=Soporte%20reserva%20${booking.code}`}
              className="inline-flex items-center justify-center rounded-full border border-brisa-500/60 px-5 py-2.5 text-sm font-semibold tracking-wide text-brisa-600 transition-colors hover:bg-brisa-100 dark:border-brisa-400/60 dark:text-brisa-200 dark:hover:bg-brisa-800/60"
            >
              Escribir a soporte →
            </Link>
          }
        />
      </ScrollReveal>

      {!hasKnownSession ? (
        <ScrollReveal variant="fadeIn" delay={0.35}>
          <PortalCallout
            title="No pudimos validar tu sesión"
            description={
              <p>
                Si pierdes el acceso, solicita un nuevo enlace mágico desde la
                página principal del portal para continuar gestionando tus
                reservas.
              </p>
            }
            action={
              <Link
                href="/clientes/acceso"
                className="inline-flex items-center justify-center rounded-full border border-brisa-500/60 px-5 py-2.5 text-sm font-semibold tracking-wide text-brisa-600 transition-colors hover:bg-brisa-100 dark:border-brisa-400/60 dark:text-brisa-200 dark:hover:bg-brisa-800/60"
              >
                Solicitar nuevo enlace →
              </Link>
            }
          />
        </ScrollReveal>
      ) : null}

      {actionError ? (
        <ScrollReveal variant="fadeIn" delay={0.4}>
          <PortalCallout
            title="No pudimos completar tu solicitud"
            description={<p>{actionError}</p>}
            action={
              <button
                type="button"
                onClick={() => setActionError(null)}
                className="rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-100 dark:border-brisa-700 dark:text-brisa-300 dark:hover:bg-brisa-800/60"
              >
                Entendido
              </button>
            }
          />
        </ScrollReveal>
      ) : null}

      {actionState ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-3xl border border-white/70 bg-white/95 p-6 shadow-2xl backdrop-blur-md dark:border-brisa-700/60 dark:bg-brisa-900/90">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {actionState.type === "cancel"
                    ? "Cancelar reserva"
                    : "Reagendar reserva"}
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-brisa-300">
                  {actionState.type === "cancel"
                    ? "Confirma que deseas cancelar esta reserva. Nuestro equipo revisará la solicitud."
                    : "Selecciona una nueva fecha y deja comentarios para operaciones."}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-500 transition-colors hover:bg-gray-100 dark:border-brisa-700 dark:text-brisa-300 dark:hover:bg-brisa-800/60"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-4 space-y-4 text-sm">
              {actionState.type === "cancel" ? (
                <div className="space-y-2">
                  <label
                    htmlFor="portal-detail-cancel-reason"
                    className="text-xs uppercase text-gray-500 dark:text-brisa-400"
                  >
                    Motivo (opcional)
                  </label>
                  <textarea
                    id="portal-detail-cancel-reason"
                    rows={4}
                    maxLength={500}
                    value={actionState.reason}
                    onChange={(event) =>
                      setActionState((current) =>
                        current && current.type === "cancel"
                          ? { ...current, reason: event.target.value }
                          : current,
                      )
                    }
                    className="w-full rounded-2xl border border-brisa-200/60 bg-white/80 p-3 text-sm text-gray-900 shadow-sm focus:border-brisa-500 focus:outline-none focus:ring-2 focus:ring-brisa-200 dark:border-brisa-700/50 dark:bg-brisa-900/60 dark:text-brisa-100"
                    placeholder="Comparte el motivo para ayudar al equipo a priorizar."
                  />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label
                      htmlFor="portal-detail-reschedule-date"
                      className="text-xs uppercase text-gray-500 dark:text-brisa-400"
                    >
                      Nueva fecha
                    </label>
                    <input
                      id="portal-detail-reschedule-date"
                      type="datetime-local"
                      min={minRescheduleValue}
                      value={actionState.scheduledAt}
                      onChange={(event) =>
                        setActionState((current) =>
                          current && current.type === "reschedule"
                            ? { ...current, scheduledAt: event.target.value }
                            : current,
                        )
                      }
                      className="w-full rounded-2xl border border-brisa-200/60 bg-white/80 p-3 text-sm text-gray-900 shadow-sm focus:border-brisa-500 focus:outline-none focus:ring-2 focus:ring-brisa-200 dark:border-brisa-700/50 dark:bg-brisa-900/60 dark:text-brisa-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="portal-detail-reschedule-notes"
                      className="text-xs uppercase text-gray-500 dark:text-brisa-400"
                    >
                      Comentarios (opcional)
                    </label>
                    <textarea
                      id="portal-detail-reschedule-notes"
                      rows={4}
                      maxLength={500}
                      value={actionState.notes}
                      onChange={(event) =>
                        setActionState((current) =>
                          current && current.type === "reschedule"
                            ? { ...current, notes: event.target.value }
                            : current,
                        )
                      }
                      className="w-full rounded-2xl border border-brisa-200/60 bg-white/80 p-3 text-sm text-gray-900 shadow-sm focus:border-brisa-500 focus:outline-none focus:ring-2 focus:ring-brisa-200 dark:border-brisa-700/50 dark:bg-brisa-900/60 dark:text-brisa-100"
                      placeholder="Indica horarios preferidos o instrucciones especiales."
                    />
                  </div>
                </>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-100 dark:border-brisa-700 dark:text-brisa-300 dark:hover:bg-brisa-800/60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isPending}
                className="inline-flex items-center rounded-full border border-brisa-500/60 bg-brisa-600 px-5 py-2 text-xs font-semibold text-white transition-colors hover:bg-brisa-700 disabled:opacity-60 dark:border-brisa-400/60 dark:bg-brisa-500 dark:hover:bg-brisa-400"
              >
                {isPending ? "Enviando…" : "Enviar solicitud"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isPending ? (
        <div className="fixed inset-x-0 bottom-4 mx-auto flex max-w-sm items-center gap-3 rounded-full border border-brisa-200/60 bg-white/90 px-4 py-3 text-xs text-gray-600 shadow-lg backdrop-blur-md dark:border-brisa-700/50 dark:bg-brisa-900/80 dark:text-brisa-200">
          <Skeleton className="h-4 w-4 rounded-full" />
          Procesando solicitud…
        </div>
      ) : null}
    </div>
  );
}
