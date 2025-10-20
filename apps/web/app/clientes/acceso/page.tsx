"use client";

import { useState } from "react";
import { recordPortalEvent } from "@/lib/portal-telemetry";

export default function PortalAccessRequestPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [debugToken, setDebugToken] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");
    setMessage(null);
    setDebugToken(null);

    try {
      const response = await fetch("/api/portal/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = (await response.json()) as {
        message?: string;
        debugToken?: string;
        expiresAt?: string;
        error?: unknown;
      };

      if (!response.ok) {
        setStatus("error");
        setMessage(
          typeof data.error === "string"
            ? data.error
            : "No pudimos generar el enlace. Intenta nuevamente.",
        );
        recordPortalEvent("portal.link.requested", {
          email,
          status: "error",
          reason: typeof data.error === "string" ? data.error : "unknown-error",
        });
        return;
      }

      setStatus("success");
      setMessage(
        data.message ??
          "Si tu cuenta existe, recibirás un enlace en tu correo en los próximos minutos.",
      );
      if (data.debugToken) {
        setDebugToken(data.debugToken);
      }
      recordPortalEvent("portal.link.requested", {
        email,
        status: "success",
        expiresAt: data.expiresAt ?? null,
      });
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Ocurrió un error inesperado. Intenta nuevamente.",
      );
      recordPortalEvent("portal.link.requested", {
        email,
        status: "error",
        reason: error instanceof Error ? error.message : "exception",
      });
    }
  };

  const isLoading = status === "loading";

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-white via-brisa-50 to-brisa-100 px-4 py-16 text-gray-900 dark:from-brisa-950 dark:via-brisa-900 dark:to-brisa-950 dark:text-white sm:px-6 md:px-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top,rgba(39,137,255,0.25),transparent_60%)] dark:bg-[radial-gradient(circle_at_top,rgba(39,137,255,0.35),transparent_65%)]" />
      <div className="relative mx-auto grid max-w-3xl gap-10">
        <header className="rounded-3xl border border-white/60 bg-white/90 p-8 shadow-lg backdrop-blur-md dark:border-brisa-700/50 dark:bg-brisa-900/80">
          <span className="inline-flex items-center gap-2 rounded-full border border-brisa-300/60 bg-brisa-50/80 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-brisa-600 dark:border-brisa-500/40 dark:bg-brisa-800/70 dark:text-brisa-200">
            Acceso portal cliente
          </span>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
            Recibe un enlace mágico en tu correo
          </h1>
          <p className="mt-3 max-w-xl text-sm text-gray-600 dark:text-brisa-200 sm:text-base">
            Ingresa el correo registrado con Brisa Cubana. Enviaremos un enlace
            válido por 15 minutos para que puedas acceder a tus reservas sin
            recordar contraseñas.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          aria-busy={isLoading}
          className="rounded-3xl border border-white/70 bg-white/90 p-8 shadow-xl backdrop-blur-md dark:border-brisa-700/50 dark:bg-brisa-900/80"
        >
          <label className="grid gap-2 text-sm">
            <span className="font-medium text-gray-900 dark:text-white">
              Correo electrónico
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="cliente@brisacubanacleanintelligence.com"
              className="rounded-full border border-gray-300 px-4 py-3 text-sm focus:border-brisa-500 focus:outline-none focus:ring-2 focus:ring-brisa-400 dark:border-brisa-600 dark:bg-brisa-900 dark:text-white"
            />
          </label>

          <button
            type="submit"
            disabled={isLoading}
            aria-disabled={isLoading}
            className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-brisa-600 px-6 py-3 text-sm font-semibold tracking-wide text-white shadow-lg shadow-brisa-300/40 transition-transform hover:-translate-y-0.5 hover:bg-brisa-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-brisa-400 dark:text-brisa-900 dark:shadow-brisa-900/30 dark:hover:bg-brisa-300"
          >
            {isLoading ? "Enviando enlace…" : "Enviar enlace de acceso"}
          </button>

          {message ? (
            <p
              className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
                status === "error"
                  ? "border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200"
                  : "border-brisa-200 bg-brisa-50 text-brisa-700 dark:border-brisa-600 dark:bg-brisa-900/50 dark:text-brisa-200"
              }`}
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              {message}
            </p>
          ) : null}

          {debugToken ? (
            <div className="mt-4 rounded-2xl border border-dashed border-brisa-300/60 bg-brisa-50/70 p-4 text-xs text-brisa-700 dark:border-brisa-700/40 dark:bg-brisa-800/40 dark:text-brisa-200">
              <p className="font-semibold">Token de prueba</p>
              <p className="mt-2 break-all font-mono">{debugToken}</p>
              <p className="mt-2 italic">
                Úsalo en la URL de verificación junto al correo para completar
                el flujo durante la beta.
              </p>
            </div>
          ) : null}
        </form>

        <p className="text-xs text-gray-500 dark:text-brisa-400">
          ¿No sabes qué correo tienes registrado? Contacta a operaciones para
          validar tu acceso al portal cliente.
        </p>
      </div>
    </main>
  );
}
