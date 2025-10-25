"use client";

import {
  Component,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import type { Service } from "@/lib/api";
import { recordCheckoutEvent } from "@/lib/marketing-telemetry";

type CheckoutClientProps = {
  services: Array<
    Pick<Service, "id" | "name" | "basePrice" | "durationMin" | "description">
  >;
  publishableKey: string;
  isTestMode?: boolean;
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

class PaymentElementErrorBoundary extends Component<
  {
    onError: (error: Error) => void;
    children: ReactNode;
  },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    this.props.onError(error);
  }

  componentDidUpdate(prevProps: Readonly<{ children: ReactNode }>) {
    if (this.state.hasError && prevProps.children !== this.props.children) {
      // Reset boundary cuando el intent cambia
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

function getDefaultScheduledISO(offsetMinutes = 1440) {
  const now = new Date();
  now.setMinutes(now.getMinutes() + offsetMinutes);
  now.setSeconds(0, 0);
  now.setMilliseconds(0);

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const date = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${date}T${hours}:${minutes}`;
}

function CheckoutPaymentStep({
  intent,
  onSuccess,
  onFailure,
  isTestMode,
}: {
  intent: CheckoutIntent;
  onSuccess: (paymentIntentId: string) => void;
  onFailure: (errorMessage: string) => void;
  isTestMode: boolean;
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
          {isTestMode
            ? "El monto se autorizará en modo prueba con tu tarjeta demo de Stripe. Se almacenarán los metadatos necesarios para registrar la reserva."
            : "El monto se cargará de forma segura usando Stripe. Se almacenarán los metadatos necesarios para registrar y calendarizar la reserva."}
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
  isTestMode,
}: CheckoutClientProps) {
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    services.at(0)?.id ?? "",
  );
  const [details, setDetails] = useState<ContactDetails>(() => ({
    fullName: "",
    email: "",
    scheduledFor: getDefaultScheduledISO(),
    notes: "",
  }));
  const [phase, setPhase] = useState<CheckoutPhase>("details");
  const [intent, setIntent] = useState<CheckoutIntent | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [isCreatingIntent, setIsCreatingIntent] = useState(false);
  const [fatalError, setFatalError] = useState<Error | null>(null);
  const [stripePromise, setStripePromise] =
    useState<Promise<Stripe | null> | null>(null);
  const sentryModuleRef = useRef<typeof import("@sentry/nextjs") | null>(null);
  const resolvedTestMode =
    typeof isTestMode === "boolean"
      ? isTestMode
      : publishableKey.startsWith("pk_test_");
  const [minScheduledFor, setMinScheduledFor] = useState(() =>
    getDefaultScheduledISO(1440),
  );

  useEffect(() => {
    setMinScheduledFor(getDefaultScheduledISO(1440));
    const interval = setInterval(
      () => setMinScheduledFor(getDefaultScheduledISO(1440)),
      60 * 1000,
    );
    return () => clearInterval(interval);
  }, []);

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

  useEffect(() => {
    if (!publishableKey) {
      setStripePromise(null);
      return;
    }

    let cancelled = false;
    const promise = loadStripe(publishableKey);
    if (!promise) {
      setFatalError(
        new Error(
          "No se pudo inicializar Stripe. Verifica la clave pública y la conexión.",
        ),
      );
      return;
    }

    setStripePromise(promise);

    promise
      .then((instance) => {
        if (cancelled) return;
        if (!instance) {
          setFatalError(
            new Error(
              "No se pudo inicializar Stripe. Verifica la clave pública y la conexión.",
            ),
          );
        }
      })
      .catch((error) => {
        if (cancelled) return;
        setFatalError(
          error instanceof Error
            ? error
            : new Error("Falló la carga de Stripe. Intenta nuevamente."),
        );
      });

    return () => {
      cancelled = true;
    };
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
    if (!details.scheduledFor) {
      setErrorMessage(
        "Define una fecha y hora tentativas para coordinar al equipo.",
      );
      return;
    }
    const scheduledDate = new Date(details.scheduledFor);
    const earliestAllowed = new Date(minScheduledFor);
    if (
      Number.isNaN(scheduledDate.getTime()) ||
      scheduledDate < earliestAllowed
    ) {
      setErrorMessage(
        "Selecciona una fecha futura para planificar la cuadrilla (mínimo 24 horas de anticipación).",
      );
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
      const response = await fetch("/api/payments/stripe/intent", {
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
      recordCheckoutEvent("checkout_started", {
        serviceId: selectedService.id,
        paymentIntentId: payload.data.paymentIntentId,
        amount: payload.data.amount,
        currency: payload.data.currency,
      });
    } catch (error) {
      recordCheckoutEvent("checkout_failed", {
        stage: "intent",
        serviceId: selectedService?.id,
        error: error instanceof Error ? error.message : "unknown_intent_error",
      });
      sentryModuleRef.current?.captureException(error, {
        contexts: {
          checkout: {
            stage: "intent:create",
            serviceId: selectedService.id,
            email: details.email,
          },
        },
      });
      setFatalError(
        error instanceof Error
          ? error
          : new Error("No pudimos crear la intención de pago."),
      );
    } finally {
      setIsCreatingIntent(false);
    }
  };

  const resetFlow = () => {
    setIntent(null);
    setPhase("details");
    setSuccessId(null);
    setErrorMessage(null);
    setFatalError(null);
    setDetails({
      fullName: "",
      email: "",
      scheduledFor: getDefaultScheduledISO(),
      notes: "",
    });
  };

  if (fatalError) {
    throw fatalError;
  }

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
              Usa tu correo real para recibir la confirmación.
              {resolvedTestMode
                ? " Este flujo opera en modo prueba y no genera cargos reales."
                : " El cargo se realizará una vez confirmemos la disponibilidad del equipo."}
            </p>
          </div>

          <label className="grid gap-2 text-sm">
            <span className="font-medium text-gray-900 dark:text-white">
              Servicio
            </span>
            <select
              value={selectedServiceId}
              onChange={(event) => setSelectedServiceId(event.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brisa-500 focus:outline-none focus:ring-2 focus:ring-brisa-400 dark:border-brisa-600 dark:bg-brisa-900 dark:text-white invalid:border-red-400 invalid:ring-1 invalid:ring-red-200 invalid:focus:ring-red-400"
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
              autoComplete="name"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brisa-500 focus:outline-none focus:ring-2 focus:ring-brisa-400 dark:border-brisa-600 dark:bg-brisa-900 dark:text-white invalid:border-red-400 invalid:ring-1 invalid:ring-red-200 invalid:focus:ring-red-400"
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
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brisa-500 focus:outline-none focus:ring-2 focus:ring-brisa-400 dark:border-brisa-600 dark:bg-brisa-900 dark:text-white invalid:border-red-400 invalid:ring-1 invalid:ring-red-200 invalid:focus:ring-red-400"
              required
            />
          </label>

          <label className="grid gap-2 text-sm">
            <span className="font-medium text-gray-900 dark:text-white">
              Fecha y hora deseada
            </span>
            <span className="text-xs text-gray-500 dark:text-brisa-400">
              Horario local Miami (UTC-05:00) con mínimo 24 horas de
              anticipación.
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
              min={minScheduledFor}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brisa-500 focus:outline-none focus:ring-2 focus:ring-brisa-400 dark:border-brisa-600 dark:bg-brisa-900 dark:text-white invalid:border-red-400 invalid:ring-1 invalid:ring-red-200 invalid:focus:ring-red-400"
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
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brisa-500 focus:outline-none focus:ring-2 focus:ring-brisa-400 dark:border-brisa-600 dark:bg-brisa-900 dark:text-white invalid:border-red-400 invalid:ring-1 invalid:ring-red-200 invalid:focus:ring-red-400"
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
            <PaymentElementErrorBoundary
              key={intent.clientSecret}
              onError={(boundaryError) => {
                captureMessage("checkout.payment.element.crashed", "error", {
                  serviceId: selectedService?.id,
                  message: boundaryError.message,
                });
                sentryModuleRef.current?.captureException(boundaryError, {
                  contexts: {
                    checkout: {
                      stage: "payment",
                      serviceId: selectedService?.id,
                    },
                  },
                });
                recordCheckoutEvent("checkout_failed", {
                  stage: "payment_element",
                  serviceId: selectedService?.id,
                  error: boundaryError.message,
                });
                setFatalError(boundaryError);
              }}
            >
              <CheckoutPaymentStep
                intent={intent}
                isTestMode={resolvedTestMode}
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
                  recordCheckoutEvent("checkout_completed", {
                    paymentIntentId,
                    serviceId: selectedService?.id,
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
                  recordCheckoutEvent("checkout_failed", {
                    stage: "payment",
                    serviceId: selectedService?.id,
                    error: message,
                  });
                }}
              />
            </PaymentElementErrorBoundary>
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
