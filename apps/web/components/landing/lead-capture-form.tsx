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
  origin?: string;
  locale?: "es" | "en";
};

type LeadPayload = {
  name: string;
  email: string;
  company: string;
  propertyCount: string;
  notes: string;
  serviceInterest?: string;
  planCode?: string;
  source: string;
};

type PlanId = "turnover" | "deep-clean" | "post-construction";

type LocalePropertyOptions = Record<"es" | "en", readonly string[]>;

const PROPERTY_COUNT_OPTIONS: LocalePropertyOptions = {
  es: ["1-5 unidades", "6-15 unidades", "16-40 unidades", "41+ unidades"],
  en: ["1-5 units", "6-15 units", "16-40 units", "41+ units"],
} as const;

function isPlanId(value: string): value is PlanId {
  return (
    value === "turnover" ||
    value === "deep-clean" ||
    value === "post-construction"
  );
}

export function LeadCaptureForm({
  title,
  subtitle,
  id = "contacto",
  origin = "landing-home",
  locale = "es",
}: LeadCaptureFormProps) {
  const formId = useId();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [serviceInterest, setServiceInterest] = useState<string>("");
  const [planCode, setPlanCode] = useState<string | null>(null);
  const [propertyCount, setPropertyCount] = useState<string>("");
  const [propertySelectTouched, setPropertySelectTouched] =
    useState<boolean>(false);
  const [utmParams, setUtmParams] = useState<UtmParams | null>(null);
  const searchParams = useSearchParams();
  const fallbackEmail =
    process.env.NEXT_PUBLIC_CONTACT_EMAIL ??
    "operaciones@brisacubanacleanintelligence.com";
  const showPropertyCountError = propertySelectTouched && !propertyCount;

  const i18n = useMemo(
    () => ({
      heading:
        title ??
        (locale === "en"
          ? "Ready to receive your proposal?"
          : "¿Listo para recibir tu propuesta?"),
      subheading:
        subtitle ??
        (locale === "en"
          ? "Share your details to schedule an operational assessment. We respond in less than 24 business hours."
          : "Comparte tus datos y agenda un diagnóstico operativo. Respondemos en menos de 24 horas hábiles."),
      badgeLabel: locale === "en" ? "Contact" : "Contacto",
      detectedInterestPrefix:
        locale === "en" ? "Detected interest in" : "Detectamos interés en",
      nameLabel: locale === "en" ? "Full name *" : "Nombre completo *",
      namePlaceholder:
        locale === "en" ? "E.g. Laura Méndez" : "Ej. Laura Méndez",
      emailLabel: locale === "en" ? "Business email *" : "Email corporativo *",
      emailPlaceholder:
        locale === "en" ? "name@company.com" : "nombre@empresa.com",
      companyLabel: locale === "en" ? "Company / brand" : "Empresa / marca",
      companyPlaceholder:
        locale === "en"
          ? "Operator, broker or manager"
          : "Operadora, broker o administradora",
      inventoryLabel:
        locale === "en" ? "Approximate inventory *" : "Inventario aproximado *",
      inventoryPlaceholder:
        locale === "en" ? "Select an option" : "Selecciona una opción",
      inventoryError:
        locale === "en"
          ? "Select the range that best describes your portfolio."
          : "Selecciona el rango que mejor describe tu inventario.",
      notesLabel: locale === "en" ? "Anything else?" : "¿Necesitas algo más?",
      notesPlaceholder:
        locale === "en"
          ? "Tell us about frequency, time windows, access, preferred integrations…"
          : "Indícanos frecuencia, horarios, accesos especiales o integraciones preferidas.",
      submitLabel:
        locale === "en"
          ? "Get my tailored proposal"
          : "Recibir propuesta personalizada",
      submittingLabel: locale === "en" ? "Sending…" : "Enviando…",
      disclaimer:
        locale === "en"
          ? "By submitting you authorize us to reach you by email or phone to coordinate the first inspection."
          : "Al enviar aceptas que te contactemos por email o teléfono para coordinar la primera inspección.",
      successMessage:
        locale === "en"
          ? `Thank you, proposal in progress. We'll write back shortly from ${fallbackEmail}.`
          : `Gracias, agenda en proceso. Te escribiremos muy pronto desde ${fallbackEmail}.`,
      errorMessage:
        locale === "en"
          ? "Complete the required fields."
          : "Completa los campos obligatorios.",
      fallbackCta:
        locale === "en"
          ? "Prefer a direct contact?"
          : "¿Prefieres contactarnos directo?",
      emailCta: locale === "en" ? "Email us" : "Escríbenos por email",
      whatsappCta: locale === "en" ? "Open WhatsApp" : "abre WhatsApp",
      propertyOptions: PROPERTY_COUNT_OPTIONS[locale],
      planInterestMap:
        locale === "en"
          ? {
              turnover: "Interest: Turnover Premium",
              "deep-clean": "Interest: Deep Clean Brickell Collection",
              "post-construction": "Interest: Post-construction Boutique",
            }
          : {
              turnover: "Interés en Turnover Premium Airbnb",
              "deep-clean": "Interés en Deep Clean Brickell Collection",
              "post-construction": "Interés en Post-Construcción Boutique",
            },
      genericPlanInterestPrefix: locale === "en" ? "Interest in" : "Interés en",
      mailtoSubject:
        locale === "en"
          ? "English%20onboarding%20request"
          : "Solicitud%20de%20limpieza",
      whatsappHref:
        locale === "en"
          ? "https://api.whatsapp.com/send/?phone=17864367132&text=Hello%20Brisa%20team,%20I%20want%20to%20schedule%20a%20premium%20cleaning"
          : "https://api.whatsapp.com/send/?phone=17864367132&text=Hola%20Brisa%20Cubana,%20quiero%20coordinar%20limpieza",
      connectorWord: locale === "en" ? "or" : "o",
      defaultSubmissionError:
        locale === "en"
          ? "We couldn't save your request."
          : "No pudimos registrar tu solicitud.",
      formatFailureMessage: (reason: string) =>
        locale === "en"
          ? `${reason} Email us at ${fallbackEmail} or reach us on WhatsApp.`
          : `${reason} Escríbenos a ${fallbackEmail} o agenda por WhatsApp.`,
    }),
    [fallbackEmail, locale, subtitle, title],
  );

  const planInterestMap = i18n.planInterestMap;
  const propertyOptions = i18n.propertyOptions as readonly string[];
  const genericPlanInterestPrefix = i18n.genericPlanInterestPrefix;

  useEffect(() => {
    const planFromQuery = searchParams?.get("plan");
    if (!planFromQuery) {
      setServiceInterest("");
      setPlanCode(null);
      return;
    }
    if (isPlanId(planFromQuery)) {
      setServiceInterest(planInterestMap[planFromQuery]);
    } else {
      setServiceInterest(`${genericPlanInterestPrefix} ${planFromQuery}`);
    }
    setPlanCode(planFromQuery);
  }, [genericPlanInterestPrefix, planInterestMap, searchParams]);

  useEffect(() => {
    const inventoryFromQuery = searchParams?.get("inventory");
    if (!inventoryFromQuery) {
      return;
    }
    const decodedValue = decodeURIComponent(inventoryFromQuery);
    if (propertyOptions.includes(decodedValue)) {
      setPropertyCount(decodedValue);
      setPropertySelectTouched(false);
    }
  }, [propertyOptions, searchParams]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const resolved = resolveAndStoreUtm(window.location.search);
    if (hasUtm(resolved)) {
      setUtmParams(resolved);
    }
  }, []);

  async function submitLead(
    values: LeadPayload,
    utm: UtmParams | null,
  ): Promise<void> {
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
        throw new Error(body?.error ?? i18n.defaultSubmissionError);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : i18n.defaultSubmissionError;
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
      propertyCount: propertyCount.trim(),
      notes: (formData.get("notes") ?? "").toString().trim(),
      serviceInterest: serviceInterest.trim() || undefined,
      planCode: planCode ?? undefined,
      source: origin,
    };

    if (!payload.name || !payload.email || !payload.propertyCount) {
      setPropertySelectTouched(true);
      setStatus("error");
      setErrorMessage(i18n.errorMessage);
      return;
    }

    startTransition(async () => {
      const resolvedUtm = utmParams ?? loadStoredUtm();
      const analyticsMetadata = {
        propertyCount: payload.propertyCount,
        serviceInterest: payload.serviceInterest,
        planCode: payload.planCode ?? undefined,
        leadSource: payload.source,
        originSection: origin,
        formId: id,
        utmSource: resolvedUtm?.source,
        utmMedium: resolvedUtm?.medium,
        utmCampaign: resolvedUtm?.campaign,
        utmContent: resolvedUtm?.content,
        utmTerm: resolvedUtm?.term,
      };

      try {
        await submitLead(payload, resolvedUtm ?? null);
        form.reset();
        setStatus("success");
        setPropertyCount("");
        setPropertySelectTouched(false);
        recordMarketingEvent("cta_request_proposal", analyticsMetadata);
        recordMarketingEvent("lead_form_submitted", {
          ...analyticsMetadata,
          submissionStatus: "success",
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : i18n.defaultSubmissionError;
        setStatus("error");
        setErrorMessage(i18n.formatFailureMessage(message));
        recordMarketingEvent("lead_form_failed", {
          ...analyticsMetadata,
          submissionStatus: "failed",
          reason: message,
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
            {i18n.badgeLabel}
          </span>
          <h2 className="text-3xl sm:text-4xl font-semibold">{i18n.heading}</h2>
          <p className="text-base sm:text-lg text-gray-600 dark:text-brisa-300 max-w-2xl mx-auto">
            {i18n.subheading}
          </p>
        </div>

        <form
          aria-describedby={`${formId}-status`}
          className="grid gap-6"
          onSubmit={handleSubmit}
        >
          {serviceInterest ? (
            <p className="rounded-2xl border border-brisa-100 bg-brisa-50 px-4 py-3 text-sm text-brisa-700 dark:border-brisa-700/60 dark:bg-brisa-900/40 dark:text-brisa-200">
              {i18n.detectedInterestPrefix}: <strong>{serviceInterest}</strong>
            </p>
          ) : null}
          <input type="hidden" name="planCode" value={planCode ?? ""} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label
                htmlFor={`${formId}-name`}
                className="text-sm font-medium text-gray-700 dark:text-brisa-200"
              >
                {i18n.nameLabel}
              </label>
              <input
                id={`${formId}-name`}
                name="name"
                type="text"
                required
                placeholder={i18n.namePlaceholder}
                autoComplete="name"
                className="rounded-xl border border-gray-300 dark:border-brisa-700 bg-white dark:bg-brisa-900 px-4 py-3 text-sm sm:text-base text-gray-900 dark:text-brisa-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brisa-500 invalid:border-red-400 invalid:ring-1 invalid:ring-red-200 invalid:focus-visible:ring-red-400"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label
                htmlFor={`${formId}-email`}
                className="text-sm font-medium text-gray-700 dark:text-brisa-200"
              >
                {i18n.emailLabel}
              </label>
              <input
                id={`${formId}-email`}
                name="email"
                type="email"
                required
                placeholder={i18n.emailPlaceholder}
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
                {i18n.companyLabel}
              </label>
              <input
                id={`${formId}-company`}
                name="company"
                type="text"
                placeholder={i18n.companyPlaceholder}
                autoComplete="organization"
                className="rounded-xl border border-gray-300 dark:border-brisa-700 bg-white dark:bg-brisa-900 px-4 py-3 text-sm sm:text-base text-gray-900 dark:text-brisa-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brisa-500"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label
                htmlFor={`${formId}-propertyCount`}
                className="text-sm font-medium text-gray-700 dark:text-brisa-200"
              >
                {i18n.inventoryLabel}
              </label>
              <select
                id={`${formId}-propertyCount`}
                name="propertyCount"
                required
                value={propertyCount}
                onChange={(event) => {
                  setPropertyCount(event.target.value);
                  setPropertySelectTouched(true);
                }}
                className="rounded-xl border border-gray-300 dark:border-brisa-700 bg-white dark:bg-brisa-900 px-4 py-3 text-sm sm:text-base text-gray-900 dark:text-brisa-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brisa-500"
                aria-invalid={showPropertyCountError}
              >
                <option value="">{i18n.inventoryPlaceholder}</option>
                {propertyOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {showPropertyCountError ? (
                <p className="text-xs text-red-500">{i18n.inventoryError}</p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor={`${formId}-notes`}
              className="text-sm font-medium text-gray-700 dark:text-brisa-200"
            >
              {i18n.notesLabel}
            </label>
            <textarea
              id={`${formId}-notes`}
              name="notes"
              rows={4}
              placeholder={i18n.notesPlaceholder}
              className="rounded-xl border border-gray-300 dark:border-brisa-700 bg-white dark:bg-brisa-900 px-4 py-3 text-sm sm:text-base text-gray-900 dark:text-brisa-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brisa-500"
            />
          </div>

          <div className="flex flex-col gap-3 rounded-2xl bg-brisa-50 px-4 py-3 text-xs text-brisa-700 dark:bg-brisa-900 dark:text-brisa-200">
            <span>{i18n.disclaimer}</span>
            <span>
              {i18n.fallbackCta} {i18n.connectorWord}{" "}
              <a
                className="underline decoration-dotted underline-offset-2"
                href={`mailto:${fallbackEmail}?subject=${i18n.mailtoSubject}`}
              >
                {i18n.emailCta}
              </a>{" "}
              {i18n.connectorWord}{" "}
              <a
                className="underline decoration-dotted underline-offset-2"
                href={i18n.whatsappHref}
                target="_blank"
                rel="noreferrer"
              >
                {i18n.whatsappCta}
              </a>
            </span>
          </div>

          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-[#0d2944] px-6 py-3 text-sm sm:text-base font-semibold text-white shadow-lg shadow-[#0d294433] transition hover:-translate-y-0.5 hover:bg-[#11466d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1ecad3]"
            disabled={isPending}
          >
            {isPending ? i18n.submittingLabel : i18n.submitLabel}
          </button>

          <div id={`${formId}-status`} aria-live="polite" className="text-sm">
            {status === "success" ? (
              <p className="text-green-600 dark:text-green-400">
                {i18n.successMessage}
              </p>
            ) : null}
            {status === "error" && errorMessage ? (
              <p className="text-red-600 dark:text-red-400">{errorMessage}</p>
            ) : null}
          </div>
        </form>
      </div>
    </section>
  );
}
