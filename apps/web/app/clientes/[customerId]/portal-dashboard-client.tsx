"use client";

import Link from "next/link";
import useSWR from "swr";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import type { Booking, PortalBookingsResult } from "@/lib/api";
import { PortalStatCard } from "@/components/portal/stat-card";
import { PortalBookingCard } from "@/components/portal/booking-card";
import { PortalTimelineItem } from "@/components/portal/timeline-item";
import { PortalCallout } from "@/components/portal/callout";
import {
  ArrowPathIcon,
  ArrowRightOnRectangleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { recordPortalEvent } from "@/lib/portal-telemetry";
import {
  formatPortalSessionRemaining,
  getPortalSessionRemaining,
  parsePortalSessionExpiresAt,
} from "@/lib/portal-session";
import {
  cancelPortalBooking,
  reschedulePortalBooking,
} from "@/lib/portal-actions";
import { Skeleton } from "@/components/ui/skeleton";
import { toPortalDatetimeLocalValue } from "@/lib/portal-utils";
import { ScrollReveal } from "@/components/ui";

const fetcher = async (url: string) => {
  const res = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}`);
  }

  return (await res.json()) as PortalBookingsResult;
};

function splitBookings(bookings: Booking[]) {
  const now = Date.now();
  const upcoming: Booking[] = [];
  const history: Booking[] = [];

  bookings.forEach((booking) => {
    const scheduled = new Date(booking.scheduledAt).getTime();
    if (scheduled >= now) {
      upcoming.push(booking);
    } else {
      history.push(booking);
    }
  });

  return { upcoming, history };
}

function formatMeta(dateIso: string) {
  try {
    return new Date(dateIso).toLocaleString();
  } catch {
    return dateIso;
  }
}

type Props = {
  initialData: PortalBookingsResult;
};

type PortalActionState =
  | {
      type: "cancel";
      booking: Booking;
      reason: string;
    }
  | {
      type: "reschedule";
      booking: Booking;
      scheduledAt: string;
      notes: string;
    }
  | null;

function PortalBookingsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <ul className="grid gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <li
          key={index}
          className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-lg dark:border-brisa-700/40 dark:bg-brisa-900/60"
        >
          <Skeleton className="h-6 w-48 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3 mb-2" />
          <Skeleton className="h-4 w-1/3" />
        </li>
      ))}
    </ul>
  );
}

export function PortalDashboardClient({ initialData }: Props) {
  const router = useRouter();
  const [isLoggingOut, startLogout] = useTransition();
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [actionState, setActionState] = useState<PortalActionState>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isActionPending, startActionTransition] = useTransition();

  const { data, isValidating, mutate, error } = useSWR<PortalBookingsResult>(
    "/api/portal/bookings?limit=50",
    fetcher,
    {
      fallbackData: initialData,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    },
  );

  const customer = data?.customer ?? initialData.customer;
  const sessionExpiresAtIso =
    data?.session?.expiresAt ?? initialData.session?.expiresAt ?? null;
  const sessionExpiresAt = useMemo(
    () => parsePortalSessionExpiresAt(sessionExpiresAtIso),
    [sessionExpiresAtIso],
  );
  const [sessionRemainingMs, setSessionRemainingMs] = useState(() =>
    getPortalSessionRemaining(sessionExpiresAt),
  );
  useEffect(() => {
    setSessionRemainingMs(getPortalSessionRemaining(sessionExpiresAt));
    if (!sessionExpiresAt) {
      return;
    }
    const interval = window.setInterval(() => {
      const remaining = getPortalSessionRemaining(sessionExpiresAt);
      setSessionRemainingMs(remaining);
      if (remaining <= 0) {
        window.clearInterval(interval);
      }
    }, 1000);
    return () => window.clearInterval(interval);
  }, [sessionExpiresAt]);
  const sessionCountdown = formatPortalSessionRemaining(sessionRemainingMs);
  const hasKnownSession = Boolean(sessionExpiresAt);
  const isSessionExpired = hasKnownSession && sessionRemainingMs <= 0;
  const sessionExpiringSoon =
    hasKnownSession &&
    sessionRemainingMs > 0 &&
    sessionRemainingMs <= 5 * 60 * 1000;
  const sessionStatusTitle = !hasKnownSession
    ? "No pudimos validar la expiración de tu sesión"
    : isSessionExpired
      ? "Tu sesión de portal expiró"
      : sessionExpiringSoon
        ? "Tu sesión vence pronto"
        : "Tu sesión de portal está activa";
  const bookings = data?.items ?? initialData.items;
  const { upcoming, history } = useMemo(
    () => splitBookings(bookings),
    [bookings],
  );

  const totals = useMemo(
    () => ({
      upcoming: upcoming.length,
      history: history.length,
      confirmed: bookings.filter((booking) => booking.status === "CONFIRMED")
        .length,
    }),
    [bookings, upcoming.length, history.length],
  );

  const handleRefresh = async () => {
    try {
      await mutate();
      recordPortalEvent("portal.dashboard.refresh", {
        customerId: customer.id,
      });
    } catch (err) {
      console.warn("[portal] refresh failed", err);
    }
  };

  const openCancelModal = (booking: Booking) => {
    setActionError(null);
    setActionSuccess(null);
    setActionState({
      type: "cancel",
      booking,
      reason: "",
    });
  };

  const openRescheduleModal = (booking: Booking) => {
    setActionError(null);
    setActionSuccess(null);
    const currentDate = new Date(booking.scheduledAt);
    setActionState({
      type: "reschedule",
      booking,
      scheduledAt: toPortalDatetimeLocalValue(currentDate),
      notes: "",
    });
  };

  const closeActionModal = () => {
    setActionState(null);
  };

  const handleSubmitAction = () => {
    if (!actionState) {
      return;
    }
    startActionTransition(async () => {
      try {
        if (actionState.type === "cancel") {
          await cancelPortalBooking({
            bookingId: actionState.booking.id,
            reason: actionState.reason?.trim()
              ? actionState.reason.trim()
              : undefined,
          });
          recordPortalEvent("portal.booking.cancelled", {
            bookingId: actionState.booking.id,
            customerId: customer.id,
          });
          setActionSuccess(
            "Tu solicitud de cancelación fue registrada. Nuestro equipo confirmará el cambio por correo.",
          );
        } else {
          await reschedulePortalBooking({
            bookingId: actionState.booking.id,
            scheduledAt: new Date(actionState.scheduledAt).toISOString(),
            notes: actionState.notes?.trim()
              ? actionState.notes.trim()
              : undefined,
          });
          recordPortalEvent("portal.booking.rescheduled", {
            bookingId: actionState.booking.id,
            customerId: customer.id,
          });
          setActionSuccess(
            "Tu solicitud de reagendado fue enviada. Recibirás confirmación una vez que operaciones la procese.",
          );
        }
        await mutate();
        closeActionModal();
        setActionError(null);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Acción no disponible.";
        setActionError(message);
        recordPortalEvent("portal.booking.action.error", {
          bookingId: actionState.booking.id,
          type: actionState.type,
          message,
        });
      }
    });
  };

  const handleLogout = () => {
    startLogout(async () => {
      setLogoutError(null);
      try {
        const response = await fetch("/api/portal/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const json = (await response.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(json.error ?? "No se pudo cerrar sesión");
        }

        recordPortalEvent("portal.logout", { customerId: customer.id });
        router.replace("/clientes/acceso");
        router.refresh();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "No se pudo cerrar sesión";
        setLogoutError(message);
        recordPortalEvent("portal.logout", {
          customerId: customer.id,
          status: "error",
          message,
        });
      }
    });
  };

  const displayName = customer.fullName ?? customer.email ?? "cliente";
  const isActionsDisabled = isActionPending || isLoggingOut || isSessionExpired;
  const minRescheduleValue = toPortalDatetimeLocalValue(
    new Date(Date.now() + 30 * 60 * 1000),
  );
  const showRefreshingSkeleton = isValidating && bookings.length === 0;

  return (
    <div className="relative mx-auto grid max-w-5xl gap-12">
      <ScrollReveal variant="fadeDown" delay={0.1}>
        <header className="flex flex-col gap-6 rounded-3xl border border-white/60 bg-white/90 p-8 shadow-lg backdrop-blur-md dark:border-brisa-700/50 dark:bg-brisa-900/80">
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-brisa-300/60 bg-brisa-50/80 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-brisa-600 dark:border-brisa-500/40 dark:bg-brisa-800/70 dark:text-brisa-200">
              Portal cliente
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-brisa-200 bg-white px-3 py-1 text-xs font-semibold text-brisa-500 shadow-sm dark:border-brisa-600 dark:bg-brisa-900 dark:text-brisa-100">
              ID {customer.id.slice(0, 6).toUpperCase()}
            </span>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                ¡Hola {displayName}! Estas son tus reservas con Brisa Cubana
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-gray-600 dark:text-brisa-200 sm:text-base">
                Revisa detalles, estados y acciones disponibles. La versión beta
                se actualiza automáticamente y pronto integrará formularios de
                cambios y descargas de comprobantes.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:items-end">
              <button
                type="button"
                onClick={handleRefresh}
                className="inline-flex items-center gap-2 rounded-full border border-brisa-500/40 px-4 py-2 text-xs font-semibold text-brisa-600 transition-colors hover:bg-brisa-100 dark:border-brisa-400/40 dark:text-brisa-200 dark:hover:bg-brisa-800/60"
              >
                <ArrowPathIcon
                  className={`h-4 w-4 ${isValidating ? "animate-spin" : ""}`}
                  aria-hidden="true"
                />
                Actualizar
              </button>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="inline-flex items-center gap-2 rounded-full border border-red-400/60 px-4 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-70 dark:border-red-500/50 dark:text-red-200 dark:hover:bg-red-900/30"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4" />
                {isLoggingOut ? "Cerrando sesión…" : "Cerrar sesión"}
              </button>
              {logoutError ? (
                <p className="text-xs text-red-500">{logoutError}</p>
              ) : null}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <PortalStatCard
              title="Próximos servicios"
              value={totals.upcoming}
              helper={
                isValidating ? "Actualizando…" : "Confirmados en el calendario"
              }
              variant="primary"
            />
            <PortalStatCard
              title="Historial"
              value={totals.history}
              helper="Servicios completados"
            />
            <PortalStatCard
              title="Confirmados"
              value={totals.confirmed}
              helper="Listos para ejecutarse"
            />
          </div>
        </header>
      </ScrollReveal>

      {actionSuccess ? (
        <PortalCallout
          title="Solicitud enviada"
          description={<p>{actionSuccess}</p>}
          icon={<ArrowPathIcon className="h-10 w-10 rotate-45" />}
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
      ) : null}

      {actionError ? (
        <PortalCallout
          title="No pudimos completar tu solicitud"
          description={<p>{actionError}</p>}
          icon={
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-red-400/70 text-sm font-semibold text-red-500 dark:border-red-500/60 dark:text-red-200">
              !
            </span>
          }
          action={
            <button
              type="button"
              onClick={() => setActionError(null)}
              className="rounded-full border border-red-400/60 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 dark:border-red-500/60 dark:text-red-200 dark:hover:bg-red-900/40"
            >
              Entendido
            </button>
          }
        />
      ) : null}

      <ScrollReveal variant="fadeUp" delay={0.2}>
        <section className="space-y-5 rounded-3xl border border-white/60 bg-white/90 p-8 shadow-xl backdrop-blur-md dark:border-brisa-700/40 dark:bg-brisa-900/80">
          <header className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Próximas reservas
              </h2>
              <p className="text-sm text-gray-600 dark:text-brisa-300">
                Visualiza tus servicios confirmados y en progreso.
              </p>
            </div>
            <Link
              href="/checkout"
              prefetch={false}
              className="inline-flex items-center gap-2 text-sm text-brisa-600 underline-offset-4 transition-colors hover:underline dark:text-brisa-300"
            >
              Solicitar un nuevo servicio →
            </Link>
          </header>

          {upcoming.length === 0 ? (
            showRefreshingSkeleton ? (
              <PortalBookingsSkeleton />
            ) : (
              <div className="space-y-3 rounded-xl border border-dashed border-brisa-300/60 bg-brisa-50/70 p-5 text-sm text-gray-700 dark:border-brisa-700/40 dark:bg-brisa-800/40 dark:text-brisa-100">
                <p>No encontramos reservas próximas en tu cuenta.</p>
                <p>
                  Si necesitas agendar un servicio urgente, escribe a{" "}
                  <a
                    className="font-semibold underline underline-offset-4"
                    href="mailto:soporte@brisacubanacleanintelligence.com"
                  >
                    soporte@brisacubanacleanintelligence.com
                  </a>{" "}
                  o utiliza el checkout público.
                </p>
              </div>
            )
          ) : (
            <ul className="grid gap-4">
              {upcoming.map((booking) => {
                const isImmutable =
                  booking.status === "IN_PROGRESS" ||
                  booking.status === "COMPLETED" ||
                  booking.status === "CANCELLED";
                return (
                  <PortalBookingCard
                    key={booking.id}
                    booking={booking}
                    scheduledLabel={formatMeta(booking.scheduledAt)}
                    actions={
                      isImmutable ? null : (
                        <>
                          <button
                            type="button"
                            disabled={isActionsDisabled}
                            onClick={() => openRescheduleModal(booking)}
                            className="inline-flex items-center rounded-full border border-brisa-500/60 px-4 py-2 text-xs font-semibold text-brisa-600 transition-colors hover:bg-brisa-100 disabled:opacity-60 dark:border-brisa-400/60 dark:text-brisa-200 dark:hover:bg-brisa-800/60"
                          >
                            Reagendar
                          </button>
                          <button
                            type="button"
                            disabled={isActionsDisabled}
                            onClick={() => openCancelModal(booking)}
                            className="inline-flex items-center rounded-full border border-red-400/60 px-4 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60 dark:border-red-500/60 dark:text-red-200 dark:hover:bg-red-900/30"
                          >
                            Cancelar
                          </button>
                          <Link
                            href={
                              `/clientes/${customer.id}/reservas/${booking.id}` as Route
                            }
                            className="inline-flex items-center rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-100 dark:border-brisa-700 dark:text-brisa-300 dark:hover:bg-brisa-800/60"
                          >
                            Ver detalle
                          </Link>
                          <a
                            href={`/api/portal/bookings/${booking.id}/pdf`}
                            download
                            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/60 px-4 py-2 text-xs font-semibold text-emerald-600 transition-colors hover:bg-emerald-50 dark:border-emerald-400/60 dark:text-emerald-200 dark:hover:bg-emerald-900/30"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                            Descargar PDF
                          </a>
                        </>
                      )
                    }
                  />
                );
              })}
            </ul>
          )}
        </section>
      </ScrollReveal>

      <ScrollReveal variant="fadeUp" delay={0.25}>
        <section className="space-y-4 rounded-3xl border border-white/70 bg-white/85 p-8 shadow-xl backdrop-blur-md dark:border-brisa-700/50 dark:bg-brisa-900/80">
          <header className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Historial reciente
            </h2>
            <p className="text-sm text-gray-600 dark:text-brisa-300">
              Mantén el registro de limpiezas anteriores y descargas futuras.
            </p>
          </header>
          {history.length === 0 ? (
            showRefreshingSkeleton ? (
              <PortalBookingsSkeleton count={2} />
            ) : (
              <p className="text-sm text-gray-600 dark:text-brisa-300">
                Aún no hay historial disponible. Aquí verás tus servicios
                completados y podrás descargar comprobantes en futuras
                versiones.
              </p>
            )
          ) : (
            <ol className="space-y-4 border-l border-dashed border-brisa-300/60 pl-5 dark:border-brisa-700/50">
              {history.map((booking) => (
                <PortalTimelineItem
                  key={booking.id}
                  status={booking.status}
                  title={`${booking.service.name} · ${booking.property.label}`}
                  meta={formatMeta(booking.scheduledAt)}
                  bookingId={booking.id}
                />
              ))}
            </ol>
          )}
        </section>
      </ScrollReveal>

      <ScrollReveal variant="fadeIn" delay={0.3}>
        <PortalCallout
          title={sessionStatusTitle}
          description={
            hasKnownSession ? (
              <p>
                {isSessionExpired ? (
                  <>
                    Tu sesión ya expiró. Solicita un nuevo enlace para continuar
                    usando el portal y actualizar esta vista.
                  </>
                ) : (
                  <>
                    Tu sesión vence en{" "}
                    <span className="font-semibold">{sessionCountdown}</span>.
                    Solicita un nuevo enlace si necesitas más tiempo o refresca
                    esta vista después de renovarlo.
                  </>
                )}
              </p>
            ) : (
              <p>
                No pudimos determinar la expiración de tu sesión. Si pierdes el
                acceso, vuelve a solicitar un enlace desde la página de acceso.
              </p>
            )
          }
          icon={<ClockIcon className="h-10 w-10" />}
          action={
            <Link
              className="inline-flex items-center justify-center rounded-full border border-brisa-500/60 px-5 py-2.5 text-sm font-semibold tracking-wide text-brisa-600 transition-colors hover:bg-brisa-100 dark:border-brisa-400/60 dark:text-brisa-200 dark:hover:bg-brisa-800/60"
              href="/clientes/acceso"
            >
              Solicitar nuevo enlace →
            </Link>
          }
        />
      </ScrollReveal>

      <ScrollReveal variant="fadeIn" delay={0.35}>
        <PortalCallout
          title="¿Necesitas ajustar algo?"
          description={
            <p>
              Estamos finalizando el formulario de autoservicio. Mientras tanto,
              puedes solicitar cambios desde la línea de soporte o respondiendo
              los correos de confirmación.
            </p>
          }
          icon={<ArrowPathIcon className="h-10 w-10" />}
          action={
            <Link
              className="inline-flex items-center justify-center rounded-full border border-brisa-500/60 px-5 py-2.5 text-sm font-semibold tracking-wide text-brisa-600 transition-colors hover:bg-brisa-100 dark:border-brisa-400/60 dark:text-brisa-200 dark:hover:bg-brisa-800/60"
              href="mailto:soporte@brisacubanacleanintelligence.com"
            >
              Escribir a soporte →
            </Link>
          }
        />
      </ScrollReveal>

      {error ? (
        <p className="text-xs text-red-500">
          No pudimos actualizar tus reservas automáticamente. Intenta
          manualmente más tarde.
        </p>
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
                    : "Selecciona una nueva fecha y comparte detalles para que nuestro equipo valide la disponibilidad."}
                </p>
              </div>
              <button
                type="button"
                onClick={closeActionModal}
                className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-500 transition-colors hover:bg-gray-100 dark:border-brisa-700 dark:text-brisa-300 dark:hover:bg-brisa-800/60"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-4 space-y-4 text-sm">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {actionState.booking.service.name} ·{" "}
                  {actionState.booking.property.label}
                </p>
                <p className="text-gray-600 dark:text-brisa-300">
                  Programado originalmente para{" "}
                  {formatMeta(actionState.booking.scheduledAt)}
                </p>
              </div>

              {actionState.type === "cancel" ? (
                <div className="space-y-2">
                  <label
                    htmlFor="portal-cancel-reason"
                    className="text-xs uppercase text-gray-500 dark:text-brisa-400"
                  >
                    Motivo (opcional)
                  </label>
                  <textarea
                    id="portal-cancel-reason"
                    maxLength={500}
                    rows={4}
                    value={actionState.reason}
                    onChange={(event) =>
                      setActionState((current) =>
                        current && current.type === "cancel"
                          ? { ...current, reason: event.target.value }
                          : current,
                      )
                    }
                    className="w-full rounded-2xl border border-brisa-200/60 bg-white/80 p-3 text-sm text-gray-900 shadow-sm focus:border-brisa-500 focus:outline-none focus:ring-2 focus:ring-brisa-200 dark:border-brisa-700/50 dark:bg-brisa-900/60 dark:text-brisa-100"
                    placeholder="Cuéntanos brevemente el motivo para agilizar la atención (máx. 500 caracteres)."
                  />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label
                      htmlFor="portal-reschedule-date"
                      className="text-xs uppercase text-gray-500 dark:text-brisa-400"
                    >
                      Nueva fecha
                    </label>
                    <input
                      id="portal-reschedule-date"
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
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="portal-reschedule-notes"
                      className="text-xs uppercase text-gray-500 dark:text-brisa-400"
                    >
                      Comentarios para operaciones (opcional)
                    </label>
                    <textarea
                      id="portal-reschedule-notes"
                      maxLength={500}
                      rows={4}
                      value={actionState.notes}
                      onChange={(event) =>
                        setActionState((current) =>
                          current && current.type === "reschedule"
                            ? { ...current, notes: event.target.value }
                            : current,
                        )
                      }
                      className="w-full rounded-2xl border border-brisa-200/60 bg-white/80 p-3 text-sm text-gray-900 shadow-sm focus:border-brisa-500 focus:outline-none focus:ring-2 focus:ring-brisa-200 dark:border-brisa-700/50 dark:bg-brisa-900/60 dark:text-brisa-100"
                      placeholder="Comparte rango horario preferido, acceso al edificio, etc. (máx. 500 caracteres)."
                    />
                  </div>
                </>
              )}
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={closeActionModal}
                className="rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-100 dark:border-brisa-700 dark:text-brisa-300 dark:hover:bg-brisa-800/60"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isActionPending}
                onClick={handleSubmitAction}
                className="inline-flex items-center gap-2 rounded-full border border-brisa-500/60 bg-brisa-600 px-5 py-2 text-xs font-semibold text-white transition-colors hover:bg-brisa-700 disabled:opacity-60 dark:border-brisa-400/60 dark:bg-brisa-500 dark:hover:bg-brisa-400"
              >
                {isActionPending ? "Enviando…" : "Enviar solicitud"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
