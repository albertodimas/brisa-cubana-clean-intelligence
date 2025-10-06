"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export function SentryErrorBoundary({ children }: ErrorBoundaryProps) {
  useEffect(() => {
    // Initialize Sentry on the client side
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      import("../../sentry.client.config");
    }
  }, []);

  return (
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
            <div className="mb-4 flex items-center justify-center">
              <svg
                className="h-16 w-16 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="mb-2 text-center text-2xl font-bold text-gray-900">
              Algo salió mal
            </h2>
            <p className="mb-6 text-center text-gray-600">
              Lo sentimos, ha ocurrido un error inesperado. Nuestro equipo ha
              sido notificado y estamos trabajando en una solución.
            </p>
            {process.env.NODE_ENV === "development" && (
              <details className="mb-4 rounded border border-red-200 bg-red-50 p-3">
                <summary className="cursor-pointer text-sm font-medium text-red-800">
                  Detalles del error (solo en desarrollo)
                </summary>
                <pre className="mt-2 overflow-auto text-xs text-red-700">
                  {String(error)}
                </pre>
              </details>
            )}
            <button
              onClick={resetError}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Intentar nuevamente
            </button>
            <button
              onClick={() => (window.location.href = "/")}
              className="mt-3 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Ir al inicio
            </button>
          </div>
        </div>
      )}
      showDialog={false}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
}
