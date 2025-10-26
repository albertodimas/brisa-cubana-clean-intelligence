"use client";

import {
  useEffect,
  useId,
  useMemo,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { useSearchParams } from "next/navigation";
import { recordMarketingEvent } from "@/lib/marketing-telemetry";
import {
  hasUtm,
  loadStoredUtm,
  resolveAndStoreUtm,
  type UtmParams,
} from "@/lib/utm-tracking";

type LeadCaptureFormProps = {
  title?: string;
  subtitle?: string;
  id?: string;
};

type LeadPayload = {
  name: string;
  email: string;
  company: string;
  propertyCount: string;
  notes: string;
  serviceInterest?: string;
};

type PlanId = "turnover" | "deep-clean" | "post-construction";

function isPlanId(value: string): value is PlanId {
  return (
    value === "turnover" ||
    value === "deep-clean" ||
    value === "post-construction"
  );
}

export function LeadCaptureForm({
  title = "¿Listo para recibir tu propuesta?",
  subtitle = "Comparte tus datos y agenda un diagnóstico operativo. Respondemos en menos de 24 horas hábiles.",
  id = "contacto",
}: LeadCaptureFormProps) {
  const formId = useId();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [serviceInterest, setServiceInterest] = useState<string>("");
  const [utmParams, setUtmParams] = useState<UtmParams | null>(null);
  const searchParams = useSearchParams();

  const planInterestMap = useMemo<Record<PlanId, string>>(
    () => ({
      turnover: "Interés en Turnover Premium Airbnb",
      "deep-clean": "Interés en Deep Clean Brickell Collection",
      "post-construction": "Interés en Post-Construcción Boutique",
    }),
    [],
  );

  useEffect(() => {
    const planFromQuery = searchParams?.get("plan");
    if (!planFromQuery) {
      setServiceInterest("");
      return;
    }
    if (isPlanId(planFromQuery)) {
      setServiceInterest(planInterestMap[planFromQuery]);
    } else {
      setServiceInterest(`Interés en ${planFromQuery}`);
    }
  }, [planInterestMap, searchParams]);

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

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const res = await fetch(`${apiUrl}/api/leads`, {
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
      serviceInterest: serviceInterest.trim() || undefined,
    };

    if (!payload.name || !payload.email || !payload.propertyCount) {
      setStatus("error");
      setErrorMessage("Completa los campos obligatorios.");
      return;
    }

    startTransition(async () => {
      const resolvedUtm = utmParams ?? loadStoredUtm();

      try {
        await submitLead(payload, resolvedUtm ?? null);
        form.reset();
        setStatus("success");
        recordMarketingEvent("cta_request_proposal", {
          propertyCount: payload.propertyCount,
          serviceInterest: payload.serviceInterest,
          utmSource: resolvedUtm?.source,
          utmMedium: resolvedUtm?.medium,
          utmCampaign: resolvedUtm?.campaign,
        });
        recordMarketingEvent("lead_form_submitted", {
          source: "landing_form",
          serviceInterest: payload.serviceInterest,
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
          serviceInterest: payload.serviceInterest,
          utmSource: resolvedUtm?.source,
          utmMedium: resolvedUtm?.medium,
          utmCampaign: resolvedUtm?.campaign,
        });
      }
    });
  }

  return (
    <section
      id={id}
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
          {serviceInterest ? (
            <p className="rounded-2xl border border-brisa-100 bg-brisa-50 px-4 py-3 text-sm text-brisa-700 dark:border-brisa-700/60 dark:bg-brisa-900/40 dark:text-brisa-200">
              Detectamos interés en: <strong>{serviceInterest}</strong>. Puedes
              ajustar la información si necesitas otro servicio.
            </p>
          ) : null}

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
                autoComplete="name"
                className="rounded-xl border border-gray-300 dark:border-brisa-700 bg-white dark:bg-brisa-900 px-4 py-3 text-sm sm:text-base text-gray-900 dark:text-brisa-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brisa-500 invalid:border-red-400 invalid:ring-1 invalid:ring-red-200 invalid:focus-visible:ring-red-400"
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
                autoComplete="email"
                className="rounded-xl border border-gray-300 dark:border-brisa-700 bg-white dark:bg-brisa-900 px-4 py-3 text-sm sm:text-base text-gray-900 dark:text-brisa-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brisa-500 invalid:border-red-400 invalid:ring-1 invalid:ring-red-200 invalid:focus-visible:ring-red-400"
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
                autoComplete="organization"
                className="rounded-xl border border-gray-300 dark:border-brisa-700 bg-white dark:bg-brisa-900 px-4 py-3 text-sm sm:text-base text-gray-900 dark:text-brisa-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brisa-500 invalid:border-red-400 invalid:ring-1 invalid:ring-red-200 invalid:focus-visible:ring-red-400"
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
                className="rounded-xl border border-gray-300 dark:border-brisa-700 bg-white dark:bg-brisa-900 px-4 py-3 text-sm sm:text-base text-gray-900 dark:text-brisa-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brisa-500 invalid:border-red-400 invalid:ring-1 invalid:ring-red-200 invalid:focus-visible:ring-red-400"
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
              className="rounded-xl border border-gray-300 dark:border-brisa-700 bg-white dark:bg-brisa-900 px-4 py-3 text-sm sm:text-base text-gray-900 dark:text-brisa-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brisa-500 invalid:border-red-400 invalid:ring-1 invalid:ring-red-200 invalid:focus-visible:ring-red-400 resize-none"
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
