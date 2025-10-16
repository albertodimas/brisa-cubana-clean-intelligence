"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import type { Service } from "@/lib/api";

type CheckoutClientProps = {
  services: Array<
    Pick<Service, "id" | "name" | "basePrice" | "durationMin" | "description">
  >;
  publishableKey: string;
};

type CheckoutIntent = {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
};

type ContactDetails = {
  fullName: string;
  email: string;
  scheduledFor: string;
  notes: string;
};

type CheckoutPhase = "details" | "payment" | "completed";

const currencyFormatter = new Intl.NumberFormat("es-US", {
  style: "currency",
  currency: "USD",
});

function CheckoutPaymentStep({
  intent,
  onSuccess,
  onFailure,
}: {
  intent: CheckoutIntent;
  onSuccess: (paymentIntentId: string) => void;
  onFailure: (errorMessage: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!stripe || !elements) {
        onFailure("Stripe no está listo todavía. Intenta de nuevo.");
        return;
      }

      setIsSubmitting(true);
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (error) {
        setIsSubmitting(false);
        onFailure(error.message ?? "No pudimos confirmar el pago.");
        return;
      }

      if (paymentIntent?.status === "succeeded") {
        onSuccess(paymentIntent.id);
        return;
      }

      if (paymentIntent?.status === "processing") {
        onSuccess(paymentIntent.id);
        return;
      }

      setIsSubmitting(false);
      onFailure(
        `El intento de pago está en estado ${paymentIntent?.status ?? "desconocido"}.`,
      );
    },
    [elements, onFailure, onSuccess, stripe],
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-xl border border-gray-200 p-5 dark:border-brisa-300/20"
    >
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">
          Confirmar pago seguro con Stripe
        </h2>
        <p className="text-sm text-gray-600 dark:text-brisa-300">
          El monto se autorizará en modo prueba con tu tarjeta demo de Stripe.
          Se almacenarán los metadatos necesarios para registrar la reserva.
        </p>
      </div>

      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-full items-center justify-center rounded-lg bg-brisa-600 px-4 py-3 text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Confirmando pago…" : "Confirmar y finalizar"}
      </button>

      <dl className="grid grid-cols-1 gap-2 text-sm text-gray-700 dark:text-brisa-200">
        <div className="flex justify-between">
          <dt>Monto</dt>
          <dd>{currencyFormatter.format(intent.amount / 100)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Moneda</dt>
          <dd>{intent.currency.toUpperCase()}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Intent ID</dt>
          <dd className="font-mono text-xs">{intent.paymentIntentId}</dd>
        </div>
      </dl>
    </form>
  );
}

export function CheckoutClient({
  services,
  publishableKey,
}: CheckoutClientProps) {
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    services.at(0)?.id ?? "",
  );
  const [details, setDetails] = useState<ContactDetails>({
    fullName: "",
    email: "",
    scheduledFor: "",
    notes: "",
  });
  const [phase, setPhase] = useState<CheckoutPhase>("details");
  const [intent, setIntent] = useState<CheckoutIntent | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [isCreatingIntent, setIsCreatingIntent] = useState(false);
  const sentryModuleRef = useRef<typeof import("@sentry/nextjs") | null>(null);

  useEffect(() => {
    let cancelled = false;
    import("@sentry/nextjs")
      .then((mod) => {
        if (!cancelled) {
          sentryModuleRef.current = mod;
        }
      })
      .catch(() => {
        // Sentry opcional: ignorar en entornos donde no esté configurado
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const captureMessage = useCallback(
    (
      message: string,
      level: "info" | "warning" | "error",
      context?: Record<string, unknown>,
    ) => {
      const sentry = sentryModuleRef.current;
      if (!sentry) return;
      sentry.withScope((scope) => {
        if (context) {
          scope.setContext("checkout", context);
        }
        scope.setLevel(level);
        sentry.captureMessage(message, level);
      });
    },
    [],
  );

  useEffect(() => {
    if (!publishableKey) {
      captureMessage("checkout.publishable_key.missing", "warning");
    }
  }, [captureMessage, publishableKey]);

  const stripePromise = useMemo(() => {
    if (!publishableKey) {
      return null;
    }
    return loadStripe(publishableKey);
  }, [publishableKey]);

  const selectedService = services.find(
    (service) => service.id === selectedServiceId,
  );

  const handleDetailsSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    if (!selectedService) {
      setErrorMessage("Selecciona un servicio para continuar.");
      return;
    }
    if (!details.email) {
      setErrorMessage("Necesitamos un correo para enviar la confirmación.");
      return;
    }
    setIsCreatingIntent(true);
    try {
      sentryModuleRef.current?.addBreadcrumb({
        category: "checkout",
        message: "intent:create:start",
        data: {
          serviceId: selectedService.id,
          email: details.email,
          hasSchedule: Boolean(details.scheduledFor),
        },
      });
      const response = await fetch("/api/checkout/intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serviceId: selectedService.id,
          scheduledFor: details.scheduledFor || null,
          customerEmail: details.email,
          customerFullName: details.fullName || null,
          notes: details.notes || null,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const message =
          (payload as { error?: string })?.error ??
          "No pudimos crear la intención de pago.";
        throw new Error(message);
      }

      const payload = (await response.json()) as { data: CheckoutIntent };
      setIntent(payload.data);
      setPhase("payment");
      captureMessage("checkout.intent.created", "info", {
        serviceId: selectedService.id,
        paymentIntentId: payload.data.paymentIntentId,
        amount: payload.data.amount,
        currency: payload.data.currency,
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No pudimos crear la intención de pago.",
      );
      sentryModuleRef.current?.captureException(error, {
        contexts: {
          checkout: {
            stage: "intent:create",
            serviceId: selectedService.id,
            email: details.email,
          },
        },
      });
    } finally {
      setIsCreatingIntent(false);
    }
  };

  const resetFlow = () => {
    setIntent(null);
    setPhase("details");
    setSuccessId(null);
    setErrorMessage(null);
  };

  if (!publishableKey) {
    return (
      <section className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-700 dark:border-brisa-400/30 dark:bg-brisa-900/20 dark:text-brisa-200">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Configura Stripe para habilitar el checkout público
        </h2>
        <p className="mt-2">
          Define la variable{" "}
          <code className="font-mono">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code>{" "}
          en Vercel (Development/Preview/Production) y sincroniza las claves
          modo test documentadas en <code>docs/operations/deployment.md</code>.
        </p>
        <p className="mt-2">
          Una vez disponible, este formulario permitirá procesar pagos seguro
          usando Stripe Payment Element y registrar metadatos para la reserva.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      {phase === "details" && (
        <form
          noValidate
          onSubmit={handleDetailsSubmit}
          className="space-y-6 rounded-xl border border-gray-200 p-5 dark:border-brisa-300/20"
        >
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">
              Selecciona servicio y comparte tus datos
            </h2>
            <p className="text-sm text-gray-600 dark:text-brisa-300">
              Usa tu correo real para recibir la confirmación. Este flujo opera
              en modo prueba y no genera cargos reales.
            </p>
          </div>

          <label className="grid gap-2 text-sm">
            <span className="font-medium text-gray-900 dark:text-white">
              Servicio
            </span>
            <select
              value={selectedServiceId}
              onChange={(event) => setSelectedServiceId(event.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brisa-500 focus:outline-none focus:ring-2 focus:ring-brisa-400 dark:border-brisa-600 dark:bg-brisa-900 dark:text-white"
              required
            >
              <option value="">Selecciona un servicio</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} ·{" "}
                  {currencyFormatter.format(service.basePrice ?? 0)}
                </option>
              ))}
            </select>
            {selectedService?.description ? (
              <span className="text-xs text-gray-500 dark:text-brisa-400">
                {selectedService.description}
              </span>
            ) : null}
          </label>

          <label className="grid gap-2 text-sm">
            <span className="font-medium text-gray-900 dark:text-white">
              Nombre completo
            </span>
            <input
              type="text"
              value={details.fullName}
              onChange={(event) =>
                setDetails((prev) => ({
                  ...prev,
                  fullName: event.target.value,
                }))
              }
              placeholder="Ej. Laura Pérez"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brisa-500 focus:outline-none focus:ring-2 focus:ring-brisa-400 dark:border-brisa-600 dark:bg-brisa-900 dark:text-white"
              required
              minLength={2}
            />
          </label>

          <label className="grid gap-2 text-sm">
            <span className="font-medium text-gray-900 dark:text-white">
              Correo de contacto
            </span>
            <input
              type="email"
              value={details.email}
              onChange={(event) =>
                setDetails((prev) => ({
                  ...prev,
                  email: event.target.value,
                }))
              }
              inputMode="email"
              autoComplete="email"
              placeholder="tu-correo@ejemplo.com"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brisa-500 focus:outline-none focus:ring-2 focus:ring-brisa-400 dark:border-brisa-600 dark:bg-brisa-900 dark:text-white"
              required
            />
          </label>

          <label className="grid gap-2 text-sm">
            <span className="font-medium text-gray-900 dark:text-white">
              Fecha y hora deseada
            </span>
            <input
              type="datetime-local"
              value={details.scheduledFor}
              onChange={(event) =>
                setDetails((prev) => ({
                  ...prev,
                  scheduledFor: event.target.value,
                }))
              }
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brisa-500 focus:outline-none focus:ring-2 focus:ring-brisa-400 dark:border-brisa-600 dark:bg-brisa-900 dark:text-white"
              required
            />
          </label>

          <label className="grid gap-2 text-sm">
            <span className="font-medium text-gray-900 dark:text-white">
              Notas adicionales (opcional)
            </span>
            <textarea
              value={details.notes}
              onChange={(event) =>
                setDetails((prev) => ({
                  ...prev,
                  notes: event.target.value,
                }))
              }
              maxLength={500}
              rows={3}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brisa-500 focus:outline-none focus:ring-2 focus:ring-brisa-400 dark:border-brisa-600 dark:bg-brisa-900 dark:text-white"
              placeholder="Comparte instrucciones especiales para el equipo."
            />
          </label>

          {selectedService ? (
            <aside className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700 dark:bg-brisa-900/40 dark:text-brisa-200">
              <p className="m-0 font-medium">
                Resumen del servicio seleccionado
              </p>
              <ul className="mt-2 grid gap-1 text-xs">
                <li>
                  Precio estimado:{" "}
                  <strong>
                    {currencyFormatter.format(selectedService.basePrice ?? 0)}
                  </strong>
                </li>
                <li>
                  Duración: {selectedService.durationMin} minutos (puede variar
                  según la propiedad).
                </li>
              </ul>
            </aside>
          ) : null}

          {errorMessage ? (
            <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
              {errorMessage}
            </p>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="submit"
              disabled={isCreatingIntent}
              className="inline-flex flex-1 items-center justify-center rounded-lg bg-brisa-600 px-4 py-3 text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCreatingIntent ? "Preparando pago…" : "Continuar con pago"}
            </button>
            <span className="text-xs text-gray-500 dark:text-brisa-400">
              Validaremos tus datos y crearemos una intención de pago segura en
              Stripe.
            </span>
          </div>
        </form>
      )}

      {phase === "payment" && intent && stripePromise ? (
        <div className="space-y-3">
          <button
            type="button"
            onClick={resetFlow}
            className="text-sm text-brisa-600 underline-offset-4 transition-colors hover:underline dark:text-brisa-300"
          >
            ← Editar datos del servicio
          </button>
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret: intent.clientSecret,
              appearance: {
                theme: "stripe",
              },
            }}
          >
            <CheckoutPaymentStep
              intent={intent}
              onSuccess={(paymentIntentId) => {
                setSuccessId(paymentIntentId);
                setPhase("completed");
                captureMessage("checkout.payment.confirmed", "info", {
                  paymentIntentId,
                  serviceId: selectedService?.id,
                });
                sentryModuleRef.current?.addBreadcrumb({
                  category: "checkout",
                  message: "payment_confirmed",
                  data: {
                    paymentIntentId,
                    serviceId: selectedService?.id,
                  },
                  level: "info",
                });
              }}
              onFailure={(message) => {
                setErrorMessage(message);
                captureMessage("checkout.payment.failed", "warning", {
                  serviceId: selectedService?.id,
                  error: message,
                });
                sentryModuleRef.current?.addBreadcrumb({
                  category: "checkout",
                  message: "payment_failed",
                  data: {
                    serviceId: selectedService?.id,
                    error: message,
                  },
                  level: "warning",
                });
              }}
            />
          </Elements>
          {errorMessage ? (
            <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
              {errorMessage}
            </p>
          ) : null}
        </div>
      ) : null}

      {phase === "completed" && successId ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-900 dark:border-emerald-700/40 dark:bg-emerald-900/40 dark:text-emerald-100">
          <h2 className="text-lg font-semibold text-emerald-800 dark:text-emerald-100">
            ¡Pago de prueba confirmado!
          </h2>
          <p className="mt-2">
            Registramos tu intención de pago con Stripe y enviaremos la
            confirmación definitiva al equipo de operaciones para agendar la
            reserva.
          </p>
          <dl className="mt-4 space-y-1 font-mono text-xs">
            <div className="flex gap-2">
              <dt className="w-28 uppercase text-emerald-700 dark:text-emerald-200">
                PaymentIntent
              </dt>
              <dd className="text-emerald-900 dark:text-emerald-100">
                {successId}
              </dd>
            </div>
            {selectedService ? (
              <div className="flex gap-2">
                <dt className="w-28 uppercase text-emerald-700 dark:text-emerald-200">
                  Servicio
                </dt>
                <dd className="text-emerald-900 dark:text-emerald-100">
                  {selectedService.name}
                </dd>
              </div>
            ) : null}
            <div className="flex gap-2">
              <dt className="w-28 uppercase text-emerald-700 dark:text-emerald-200">
                Correo
              </dt>
              <dd className="text-emerald-900 dark:text-emerald-100">
                {details.email}
              </dd>
            </div>
          </dl>
          <button
            type="button"
            onClick={resetFlow}
            className="mt-4 inline-flex items-center rounded-lg border border-emerald-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-700 transition-colors hover:bg-emerald-600 hover:text-white dark:border-emerald-400 dark:text-emerald-200 dark:hover:bg-emerald-400 dark:hover:text-emerald-950"
          >
            Iniciar un nuevo pago de prueba
          </button>
        </div>
      ) : null}
    </section>
  );
}
