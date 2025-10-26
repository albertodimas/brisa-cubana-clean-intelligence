"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { recordPortalEvent } from "@/lib/portal-telemetry";
import {
  formatPortalSessionRemaining,
  getPortalSessionRemaining,
  parsePortalSessionExpiresAt,
} from "@/lib/portal-session";
import { GradientMesh, ScrollReveal } from "@/components/ui";

type VerifyResponse = {
  data?: {
    portalToken: string;
    email: string;
    customerId: string;
    expiresAt: string;
  };
  error?: string;
};

export default function PortalAccessVerifyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [response, setResponse] = useState<VerifyResponse | null>(null);
  const [countdown, setCountdown] = useState<string>("–");

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
          recordPortalEvent("portal.link.verify", {
            tokenPresent: Boolean(token),
            status: "error",
            reason: data.error ?? `http-${res.status}`,
          });
          return;
        }
        setStatus("success");
        setResponse(data);
        recordPortalEvent("portal.link.verify", {
          tokenPresent: Boolean(token),
          status: "success",
          customerId: data.data?.customerId ?? null,
          email: data.data?.email ?? null,
        });
      } catch (error) {
        setStatus("error");
        setResponse({
          error:
            error instanceof Error
              ? error.message
              : "No pudimos validar el enlace.",
        });
        recordPortalEvent("portal.link.verify", {
          tokenPresent: Boolean(token),
          status: "error",
          reason: error instanceof Error ? error.message : "exception",
        });
      }
    };

    verify().catch(() => {
      setStatus("error");
      setResponse({ error: "No pudimos validar el enlace." });
      recordPortalEvent("portal.link.verify", {
        tokenPresent: Boolean(token),
        status: "error",
        reason: "network-failure",
      });
    });
  }, [token]);

  useEffect(() => {
    if (status !== "success" || !response?.data?.customerId) {
      return;
    }

    const expiresAt = parsePortalSessionExpiresAt(response.data.expiresAt);
    let countdownInterval: number | null = null;

    if (expiresAt) {
      const updateCountdown = () => {
        const remaining = getPortalSessionRemaining(expiresAt);
        setCountdown(formatPortalSessionRemaining(remaining));
      };

      updateCountdown();
      countdownInterval = window.setInterval(updateCountdown, 1000);
    }

    const timeout = window.setTimeout(() => {
      router.replace(`/clientes/${response.data?.customerId}`);
    }, 1500);

    return () => {
      window.clearTimeout(timeout);
      if (countdownInterval) {
        window.clearInterval(countdownInterval);
      }
    };
  }, [response, router, status]);

  const expiresAtLabel = useMemo(() => {
    const parsed = parsePortalSessionExpiresAt(response?.data?.expiresAt);
    return parsed ? parsed.toLocaleString() : null;
  }, [response?.data?.expiresAt]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-white via-brisa-50 to-brisa-100 px-4 py-16 text-gray-900 dark:from-brisa-950 dark:via-brisa-900 dark:to-brisa-950 dark:text-white sm:px-6 md:px-10">
      {/* Gradient Mesh Background - Replace radial gradient */}
      <GradientMesh
        colors={{
          primary: "rgba(39, 137, 255, 0.25)",
          secondary: "rgba(20, 184, 166, 0.2)",
          accent: "rgba(139, 92, 246, 0.2)",
        }}
        opacity={0.3}
        shimmer
      />

      <div className="relative mx-auto grid max-w-3xl gap-10">
        <ScrollReveal variant="fadeDown" delay={0.1}>
          <header className="rounded-3xl border border-white/60 bg-white/90 p-8 shadow-lg backdrop-blur-md dark:border-brisa-700/50 dark:bg-brisa-900/80">
            <span className="inline-flex items-center gap-2 rounded-full border border-brisa-300/60 bg-brisa-50/80 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-brisa-600 dark:border-brisa-500/40 dark:bg-brisa-800/70 dark:text-brisa-200">
              Acceso portal cliente
            </span>
            <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
              Validando tu enlace de acceso
            </h1>
            <p className="mt-3 max-w-xl text-sm text-gray-600 dark:text-brisa-200 sm:text-base">
              Este proceso puede tardar unos segundos. Si el enlace expira,
              puedes solicitar uno nuevo desde la página anterior.
            </p>
          </header>
        </ScrollReveal>

        <ScrollReveal variant="fadeUp" delay={0.2}>
          <section className="rounded-3xl border border-white/70 bg-white/90 p-8 shadow-xl backdrop-blur-md dark:border-brisa-700/50 dark:bg-brisa-900/80">
            {status === "idle" && (
              <p
                className="text-sm text-gray-600 dark:text-brisa-300"
                role="status"
                aria-live="polite"
                aria-atomic="true"
              >
                Proporciona el parámetro{" "}
                <code className="font-mono">token</code> en la URL para validar
                el acceso.
              </p>
            )}
            {status === "loading" && (
              <p
                className="text-sm text-gray-600 dark:text-brisa-300"
                role="status"
                aria-live="polite"
                aria-atomic="true"
              >
                Validando enlace de acceso…
              </p>
            )}
            {status === "success" && response?.data ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-700 dark:text-brisa-200">
                  ¡Listo! Tu enlace se validó correctamente. Tu sesión vencerá
                  en{" "}
                  <span className="font-semibold text-brisa-600 dark:text-brisa-100">
                    {countdown}
                  </span>
                  .
                </p>
                {expiresAtLabel ? (
                  <p className="text-xs text-gray-500 dark:text-brisa-400">
                    Expira el {expiresAtLabel}.
                  </p>
                ) : null}
                <p className="text-xs text-gray-500 dark:text-brisa-400">
                  Estamos redirigiéndote al portal en unos segundos…
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
              <p
                className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200"
                role="alert"
                aria-live="assertive"
              >
                {response?.error ?? "El enlace no es válido o ya se utilizó."}
              </p>
            )}
          </section>
        </ScrollReveal>
      </div>
    </main>
  );
}
