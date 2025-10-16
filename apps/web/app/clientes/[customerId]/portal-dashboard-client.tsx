"use client";

import Link from "next/link";
import useSWR from "swr";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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

export function PortalDashboardClient({ initialData }: Props) {
  const router = useRouter();
  const [isLoggingOut, startLogout] = useTransition();
  const [logoutError, setLogoutError] = useState<string | null>(null);

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

  return (
    <div className="relative mx-auto grid max-w-5xl gap-12">
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
          <p className="rounded-xl border border-dashed border-brisa-300/60 bg-brisa-50/70 p-4 text-sm text-gray-700 dark:border-brisa-700/40 dark:bg-brisa-800/40 dark:text-brisa-100">
            No encontramos reservas próximas. Si necesitas agendar una limpieza,
            utiliza el checkout público o contacta a operaciones.
          </p>
        ) : (
          <ul className="grid gap-4">
            {upcoming.map((booking) => (
              <PortalBookingCard
                key={booking.id}
                booking={booking}
                scheduledLabel={formatMeta(booking.scheduledAt)}
              />
            ))}
          </ul>
        )}
      </section>

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
          <p className="text-sm text-gray-600 dark:text-brisa-300">
            Aún no hay historial disponible.
          </p>
        ) : (
          <ol className="space-y-4 border-l border-dashed border-brisa-300/60 pl-5 dark:border-brisa-700/50">
            {history.map((booking) => (
              <PortalTimelineItem
                key={booking.id}
                status={booking.status}
                title={`${booking.service.name} · ${booking.property.label}`}
                meta={formatMeta(booking.scheduledAt)}
              />
            ))}
          </ol>
        )}
      </section>

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
            href="mailto:soporte@brisacubanaclean.com"
          >
            Escribir a soporte →
          </Link>
        }
      />

      {error ? (
        <p className="text-xs text-red-500">
          No pudimos actualizar tus reservas automáticamente. Intenta
          manualmente más tarde.
        </p>
      ) : null}
    </div>
  );
}
