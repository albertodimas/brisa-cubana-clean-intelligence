"use client";

import Link from "next/link";
import { useEffect } from "react";
import { loadSentry } from "../lib/sentry/lazy";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    void loadSentry()
      .then((sentry) => {
        if (typeof sentry.captureException === "function") {
          sentry.captureException(error);
        }
      })
      .catch(() => {
        // Sentry opcional
      });
  }, [error]);

  return (
    <html lang="es">
      <body className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-slate-100">
        <main className="max-w-lg px-6 text-center">
          <h1 className="text-2xl font-semibold">
            Ocurrió un error inesperado
          </h1>
          <p className="mt-4 text-sm text-slate-300">
            Registramos el incidente para el equipo técnico. Puedes intentar
            recargar la página o regresar al panel principal.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
            >
              Reintentar
            </button>
            <Link
              href="/"
              className="rounded-md border border-slate-700 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500"
            >
              Ir al inicio
            </Link>
          </div>
          {error.digest ? (
            <p className="mt-6 text-xs text-slate-500">
              Código de referencia: {error.digest}
            </p>
          ) : null}
        </main>
      </body>
    </html>
  );
}
