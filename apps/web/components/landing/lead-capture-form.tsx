"use client";

import {
  useEffect,
  useId,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { recordMarketingEvent } from "@/lib/marketing-telemetry";
import {
  resolveAndStoreUtm,
  loadStoredUtm,
  hasUtm,
  type UtmParams,
} from "@/lib/utm-tracking";

type LeadCaptureFormProps = {
  title?: string;
  subtitle?: string;
};

type LeadPayload = {
  name: string;
  email: string;
  company: string;
  propertyCount: string;
  notes: string;
};

export function LeadCaptureForm({
  title = "¿Listo para recibir tu propuesta?",
  subtitle = "Comparte tus datos y agenda un diagnóstico operativo. Respondemos en menos de 24 horas hábiles.",
}: LeadCaptureFormProps) {
  const formId = useId();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [utmParams, setUtmParams] = useState<UtmParams | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const resolved = resolveAndStoreUtm(window.location.search);
    if (hasUtm(resolved)) {
      setUtmParams(resolved);
    }
  }, []);

  async function submitLead(values: LeadPayload, utm: UtmParams | null) {
    try {
      const body: Record<string, unknown> = { ...values };

      if (utm) {
        if (utm.source) body.utm_source = utm.source;
        if (utm.medium) body.utm_medium = utm.medium;
        if (utm.campaign) body.utm_campaign = utm.campaign;
        if (utm.content) body.utm_content = utm.content;
        if (utm.term) body.utm_term = utm.term;
      }

      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error ?? "No pudimos registrar tu solicitud.");
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No pudimos registrar tu solicitud.";
      throw new Error(message);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("idle");
    setErrorMessage(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

    const payload: LeadPayload = {
      name: (formData.get("name") ?? "").toString().trim(),
      email: (formData.get("email") ?? "").toString().trim(),
      company: (formData.get("company") ?? "").toString().trim(),
      propertyCount: (formData.get("propertyCount") ?? "").toString().trim(),
      notes: (formData.get("notes") ?? "").toString().trim(),
    };

    if (!payload.name || !payload.email || !payload.propertyCount) {
      setStatus("error");
      setErrorMessage("Completa los campos obligatorios.");
      return;
    }

    startTransition(async () => {
      const resolvedUtm = utmParams ?? loadStoredUtm();
      if (!utmParams && hasUtm(resolvedUtm)) {
        setUtmParams(resolvedUtm);
      }

      try {
        await submitLead(payload, resolvedUtm ?? null);
        form.reset();
        setStatus("success");
        recordMarketingEvent("cta_request_proposal", {
          propertyCount: payload.propertyCount,
        });
        recordMarketingEvent("lead_form_submitted", {
          source: "landing_form",
          utmSource: resolvedUtm?.source,
          utmMedium: resolvedUtm?.medium,
          utmCampaign: resolvedUtm?.campaign,
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "No pudimos registrar tu solicitud.";
        setStatus("error");
        setErrorMessage(message);
        recordMarketingEvent("lead_form_failed", {
          reason: message,
          utmSource: resolvedUtm?.source,
          utmMedium: resolvedUtm?.medium,
          utmCampaign: resolvedUtm?.campaign,
        });
      }
    });
  }

  return (
    <section
      className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20"
      data-testid="lead-form-section"
    >
      <div className="rounded-3xl border border-gray-200 dark:border-brisa-800 bg-white dark:bg-brisa-950 shadow-lg shadow-brisa-600/10 p-6 sm:p-10">
        <div className="space-y-3 mb-8 text-center">
          <span className="text-xs tracking-[0.45em] uppercase text-brisa-600 dark:text-brisa-300">
            Contacto
          </span>
          <h2 className="text-3xl sm:text-4xl font-semibold">{title}</h2>
          <p className="text-base sm:text-lg text-gray-600 dark:text-brisa-300 max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>

        <form
          aria-describedby={`${formId}-status`}
          className="grid gap-6"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label
                htmlFor={`${formId}-name`}
                className="text-sm font-medium text-gray-700 dark:text-brisa-200"
              >
                Nombre completo *
              </label>
              <input
                id={`${formId}-name`}
                name="name"
                type="text"
                required
                placeholder="Ej. Laura Méndez"
                className="rounded-xl border border-gray-300 dark:border-brisa-700 bg-white dark:bg-brisa-900 px-4 py-3 text-sm sm:text-base text-gray-900 dark:text-brisa-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brisa-500"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label
                htmlFor={`${formId}-email`}
                className="text-sm font-medium text-gray-700 dark:text-brisa-200"
              >
                Email corporativo *
              </label>
              <input
                id={`${formId}-email`}
                name="email"
                type="email"
                required
                placeholder="nombre@empresa.com"
                className="rounded-xl border border-gray-300 dark:border-brisa-700 bg-white dark:bg-brisa-900 px-4 py-3 text-sm sm:text-base text-gray-900 dark:text-brisa-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brisa-500"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label
                htmlFor={`${formId}-company`}
                className="text-sm font-medium text-gray-700 dark:text-brisa-200"
              >
                Empresa / marca
              </label>
              <input
                id={`${formId}-company`}
                name="company"
                type="text"
                placeholder="Operadora, broker o administradora"
                className="rounded-xl border border-gray-300 dark:border-brisa-700 bg-white dark:bg-brisa-900 px-4 py-3 text-sm sm:text-base text-gray-900 dark:text-brisa-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brisa-500"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label
                htmlFor={`${formId}-propertyCount`}
                className="text-sm font-medium text-gray-700 dark:text-brisa-200"
              >
                Inventario aproximado *
              </label>
              <select
                id={`${formId}-propertyCount`}
                name="propertyCount"
                defaultValue=""
                required
                className="rounded-xl border border-gray-300 dark:border-brisa-700 bg-white dark:bg-brisa-900 px-4 py-3 text-sm sm:text-base text-gray-900 dark:text-brisa-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brisa-500"
              >
                <option value="" disabled>
                  Selecciona una opción
                </option>
                <option value="1-5 unidades">1-5 unidades</option>
                <option value="6-15 unidades">6-15 unidades</option>
                <option value="16-40 unidades">16-40 unidades</option>
                <option value="41+ unidades">41+ unidades</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor={`${formId}-notes`}
              className="text-sm font-medium text-gray-700 dark:text-brisa-200"
            >
              ¿Necesitas algo más?
            </label>
            <textarea
              id={`${formId}-notes`}
              name="notes"
              rows={4}
              placeholder="Indícanos frecuencia, horarios, accesos especiales o integraciones preferidas."
              className="rounded-xl border border-gray-300 dark:border-brisa-700 bg-white dark:bg-brisa-900 px-4 py-3 text-sm sm:text-base text-gray-900 dark:text-brisa-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brisa-500 resize-none"
            />
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-brisa-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-brisa-600/20 hover:bg-brisa-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              disabled={isPending}
            >
              {isPending ? "Enviando…" : "Recibir propuesta personalizada"}
            </button>
            <p className="text-xs text-gray-500 dark:text-brisa-400 text-center">
              Al enviar aceptas que te contactemos por email o teléfono para
              coordinar la primera inspección.
            </p>
            <p
              id={`${formId}-status`}
              role="status"
              className={`text-sm text-center ${
                status === "success"
                  ? "text-green-600 dark:text-green-400"
                  : status === "error"
                    ? "text-red-600 dark:text-red-400"
                    : "text-transparent"
              }`}
            >
              {status === "success"
                ? "Gracias, agenda en proceso. Te escribiremos muy pronto."
                : status === "error"
                  ? (errorMessage ?? "Completa los campos obligatorios.")
                  : " "}
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}
