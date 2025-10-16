"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type VerifyResponse = {
  data?: {
    portalToken: string;
    email: string;
  };
  error?: string;
};

export default function PortalAccessVerifyPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [response, setResponse] = useState<VerifyResponse | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }

    const verify = async () => {
      setStatus("loading");
      setResponse(null);
      try {
        const res = await fetch("/api/portal/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });
        const data = (await res.json()) as VerifyResponse;
        if (!res.ok) {
          setStatus("error");
          setResponse(data);
          return;
        }
        setStatus("success");
        setResponse(data);
      } catch (error) {
        setStatus("error");
        setResponse({
          error:
            error instanceof Error
              ? error.message
              : "No pudimos validar el enlace.",
        });
      }
    };

    verify().catch(() => {
      setStatus("error");
      setResponse({ error: "No pudimos validar el enlace." });
    });
  }, [token]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-white via-brisa-50 to-brisa-100 px-4 py-16 text-gray-900 dark:from-brisa-950 dark:via-brisa-900 dark:to-brisa-950 dark:text-white sm:px-6 md:px-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top,rgba(39,137,255,0.25),transparent_60%)] dark:bg-[radial-gradient(circle_at_top,rgba(39,137,255,0.35),transparent_65%)]" />
      <div className="relative mx-auto grid max-w-3xl gap-10">
        <header className="rounded-3xl border border-white/60 bg-white/90 p-8 shadow-lg backdrop-blur-md dark:border-brisa-700/50 dark:bg-brisa-900/80">
          <span className="inline-flex items-center gap-2 rounded-full border border-brisa-300/60 bg-brisa-50/80 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-brisa-600 dark:border-brisa-500/40 dark:bg-brisa-800/70 dark:text-brisa-200">
            Acceso portal cliente
          </span>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
            Validando tu enlace de acceso
          </h1>
          <p className="mt-3 max-w-xl text-sm text-gray-600 dark:text-brisa-200 sm:text-base">
            Este proceso puede tardar unos segundos. Si el enlace expira, puedes
            solicitar uno nuevo desde la página anterior.
          </p>
        </header>

        <section className="rounded-3xl border border-white/70 bg-white/90 p-8 shadow-xl backdrop-blur-md dark:border-brisa-700/50 dark:bg-brisa-900/80">
          {status === "idle" && (
            <p className="text-sm text-gray-600 dark:text-brisa-300">
              Proporciona el parámetro <code className="font-mono">token</code>{" "}
              en la URL para validar el acceso.
            </p>
          )}
          {status === "loading" && (
            <p className="text-sm text-gray-600 dark:text-brisa-300">
              Validando enlace de acceso…
            </p>
          )}
          {status === "success" && response?.data ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-700 dark:text-brisa-200">
                ¡Listo! Tu enlace se validó correctamente. Este token es válido
                por una hora.
              </p>
              <div className="rounded-2xl border border-brisa-300/60 bg-brisa-50/70 p-4 text-xs text-brisa-700 dark:border-brisa-700/40 dark:bg-brisa-800/40 dark:text-brisa-200">
                <p className="font-semibold">Portal token (beta)</p>
                <p className="mt-2 break-all font-mono">
                  {response.data.portalToken}
                </p>
              </div>
            </div>
          ) : null}
          {status === "error" && (
            <p className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">
              {response?.error ?? "El enlace no es válido o ya se utilizó."}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
