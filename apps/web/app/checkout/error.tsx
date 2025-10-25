"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const MAX_RESET_ATTEMPTS = 3;
const RESET_ATTEMPT_WINDOW_MS = 10_000;

function prettyPrintDigest(digest?: string) {
  if (!digest) return "No disponible";
  if (digest.length <= 12) return digest;
  return `${digest.slice(0, 6)}…${digest.slice(-4)}`;
}

type ErrorBoundaryProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function CheckoutErrorBoundary({
  error,
  reset,
}: ErrorBoundaryProps) {
  const [resetAttempts, setResetAttempts] = useState(0);
  const [resetDisabled, setResetDisabled] = useState(false);
  const resetTimestampsRef = useRef<number[]>([]);
  const sentryModuleRef = useRef<typeof import("@sentry/nextjs") | null>(null);
  const hasLoggedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    hasLoggedRef.current = false;

    const logError = async () => {
      let sentry: typeof import("@sentry/nextjs") | null = null;

      try {
        const mod = await import("@sentry/nextjs");
        if (!cancelled) {
          sentryModuleRef.current = mod;
          sentry = mod;
        }
      } catch {
        // Sentry opcional
      }

      if (cancelled || hasLoggedRef.current) {
        return;
      }

      hasLoggedRef.current = true;

      if (sentry) {
        sentry.captureException(error, {
          tags: {
            component: "checkout",
            boundary: "checkout-error-boundary",
          },
          contexts: {
            checkout: {
              resetAttempts,
              errorDigest: error.digest,
            },
          },
        });
      }

      try {
        const { recordCheckoutEvent } = await import(
          "@/lib/marketing-telemetry"
        );
        if (!cancelled) {
          recordCheckoutEvent("checkout_error_boundary_triggered", {
            errorMessage: error.message,
            errorDigest: error.digest,
            errorStack: error.stack?.slice(0, 500),
            resetAttempts,
          });
        }
      } catch {
        // PostHog opcional
      }
    };

    void logError();

    return () => {
      cancelled = true;
    };
  }, [error, resetAttempts]);

  const handleReset = () => {
    const now = Date.now();
    const recent = resetTimestampsRef.current.filter(
      (timestamp) => now - timestamp < RESET_ATTEMPT_WINDOW_MS,
    );

    if (recent.length >= MAX_RESET_ATTEMPTS) {
      setResetDisabled(true);
      return;
    }

    resetTimestampsRef.current = [...recent, now];
    setResetAttempts((attempts) => attempts + 1);
    void import("@/lib/marketing-telemetry")
      .then(({ recordCheckoutEvent }) => {
        recordCheckoutEvent("checkout_error_boundary_retry", {
          attempts: recent.length + 1,
          errorDigest: error.digest,
        });
      })
      .catch(() => {
        // PostHog opcional
      });
    reset();
  };

  return (
    <main className="min-h-screen bg-white px-4 py-16 text-gray-900 dark:bg-brisa-950 dark:text-white">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 rounded-2xl border border-gray-200 bg-white p-8 shadow-lg dark:border-brisa-800/60 dark:bg-brisa-950">
        <div className="space-y-3">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-brisa-500 dark:text-brisa-300">
            Checkout
          </span>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
            Tuvimos un problema cargando el formulario de pago
          </h1>
          <p className="text-sm text-gray-600 dark:text-brisa-200">
            No pudimos inicializar Stripe o recuperar la información de pago.
            Revisa tu conexión e inténtalo de nuevo. Si el problema persiste,
            contacta a nuestro equipo para ayudarte a completar la reserva.
          </p>
        </div>

        <section className="space-y-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-700 dark:border-brisa-600/40 dark:bg-brisa-900/40 dark:text-brisa-200">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-white">
            Detalles técnicos
          </h2>
          <details className="space-y-2">
            <summary className="cursor-pointer text-sm text-brisa-600 underline-offset-4 hover:underline dark:text-brisa-300">
              Mostrar detalles del error
            </summary>
            <dl className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <dt className="w-32 uppercase text-gray-500 dark:text-brisa-400">
                  Mensaje
                </dt>
                <dd className="break-words text-gray-800 dark:text-brisa-200">
                  {error.message}
                </dd>
              </div>
              <div className="flex items-center gap-2">
                <dt className="w-32 uppercase text-gray-500 dark:text-brisa-400">
                  Digest
                </dt>
                <dd className="font-mono text-gray-800 dark:text-brisa-200">
                  {prettyPrintDigest(error.digest)}
                </dd>
              </div>
              {error.stack ? (
                <div>
                  <dt className="w-32 uppercase text-gray-500 dark:text-brisa-400">
                    Stack
                  </dt>
                  <dd className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-gray-900/90 p-3 font-mono text-[11px] leading-relaxed text-emerald-200 dark:bg-brisa-950">
                    {error.stack}
                  </dd>
                </div>
              ) : null}
            </dl>
          </details>
        </section>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleReset}
            disabled={resetDisabled}
            className="inline-flex items-center justify-center rounded-lg bg-brisa-600 px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {resetDisabled
              ? "Límite de reintentos alcanzado"
              : "Reintentar carga"}
          </button>
          <Link
            href="mailto:operaciones@brisacubanacleanintelligence.com?subject=Soporte%20checkout"
            className="inline-flex items-center rounded-lg border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-brisa-600 dark:text-brisa-200 dark:hover:bg-brisa-900/60"
          >
            Contactar soporte
          </Link>
          <Link
            href="tel:+13055550123"
            className="inline-flex items-center rounded-lg border border-transparent px-5 py-3 text-sm font-medium text-brisa-600 hover:underline dark:text-brisa-300"
          >
            Llamar al equipo (+1 305 555 0123)
          </Link>
        </div>

        <p className="text-xs text-gray-500 dark:text-brisa-400">
          Seguimos monitoreando esta pantalla con alertas automáticas. Incluye
          el identificador del error en tu mensaje:{" "}
          <span className="font-mono">{prettyPrintDigest(error.digest)}</span>
        </p>
      </div>
    </main>
  );
}
