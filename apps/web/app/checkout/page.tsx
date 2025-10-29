import Link from "next/link";
import type { Metadata } from "next";
import { fetchServicesPage } from "@/lib/api";
import { CheckoutClient } from "./checkout-client";
import { ScrollProgress, ScrollReveal } from "@/components/ui";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Checkout de servicios · Brisa Cubana",
  description:
    "Reserva servicios premium y confirma pagos seguros con Stripe. Compatible con modo prueba y live, registrando metadatos operativos.",
  alternates: {
    canonical: "/checkout",
  },
};

export default async function CheckoutPage() {
  const servicesPage = await fetchServicesPage({ limit: 50 });
  const services = servicesPage.items.filter((service) => service.active);
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
  const isTestMode = publishableKey.startsWith("pk_test_");
  const isCheckoutEnabled =
    (process.env.NEXT_PUBLIC_ENABLE_PUBLIC_CHECKOUT ?? "").toLowerCase() ===
    "true";

  if (!isCheckoutEnabled) {
    return (
      <main className="min-h-screen bg-white text-gray-900 dark:bg-brisa-950 dark:text-white">
        <ScrollProgress position="top" thickness={3} glow />
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 md:px-8">
          <ScrollReveal variant="fadeDown" delay={0.1}>
            <header className="space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#ecfcff] px-4 py-1 text-sm font-semibold text-[#0f8c94] dark:bg-[#0c6870]/40 dark:text-[#7adfe9]">
                Checkout en preparación
              </span>
              <h1 className="text-3xl font-semibold sm:text-4xl">
                El checkout público estará disponible en producción muy pronto.
              </h1>
              <p className="text-base text-gray-600 dark:text-brisa-300">
                Mientras finalizamos la integración comercial, agenda tu
                diagnóstico operativo desde el formulario principal o solicita
                una demo guiada con el equipo de operaciones.
              </p>
            </header>
          </ScrollReveal>
          <ScrollReveal variant="fadeUp" delay={0.2}>
            <div className="mt-8 space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-brisa-800 dark:bg-brisa-950">
              <p className="text-sm text-gray-600 dark:text-brisa-300">
                • <strong>Solicitar propuesta:</strong> Dirígete a{" "}
                <a
                  href="/#contacto"
                  className="underline underline-offset-4 text-[#0f8c94] dark:text-[#7adfe9]"
                >
                  nuestro formulario de contacto
                </a>{" "}
                y agenda el diagnóstico.
              </p>
              <p className="text-sm text-gray-600 dark:text-brisa-300">
                • <strong>Demo guiada:</strong> Escríbenos a{" "}
                <a
                  href="mailto:operaciones@brisacubanacleanintelligence.com"
                  className="underline underline-offset-4 text-[#0f8c94] dark:text-[#7adfe9]"
                >
                  operaciones@brisacubanacleanintelligence.com
                </a>{" "}
                para coordinar la sesión privada.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </main>
    );
  }

  const modeLabel = isTestMode
    ? "Checkout público (modo prueba)"
    : "Checkout público";

  return (
    <main className="min-h-screen bg-white text-gray-900 dark:bg-brisa-950 dark:text-white">
      {/* Scroll Progress Bar */}
      <ScrollProgress position="top" thickness={3} glow />

      <div className="mx-auto grid max-w-3xl gap-6 px-4 py-10 sm:px-6 md:px-8">
        <ScrollReveal variant="fadeDown" delay={0.1}>
          <header className="space-y-3">
            <span className="text-xs uppercase tracking-[0.25em] text-brisa-500 dark:text-brisa-300">
              {modeLabel}
            </span>
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-white sm:text-4xl">
              Reserva un servicio con pagos seguros usando Stripe
            </h1>
            <p className="max-w-[70ch] text-sm text-gray-600 dark:text-brisa-300 sm:text-base">
              Este flujo usa el Stripe Payment Element y registra metadatos para
              el equipo operativo.
              {isTestMode
                ? " Configura tus claves modo test y usa las tarjetas de prueba documentadas para validar el webhook y la experiencia end-to-end."
                : " Los cargos se procesarán en vivo y quedarán disponibles para agendar el servicio con el equipo de operaciones."}
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <Link
                href="https://github.com/albertodimas/brisa-cubana-clean-intelligence/blob/main/docs/operations/deployment.md"
                className="text-brisa-600 underline-offset-4 transition-colors hover:underline dark:text-brisa-300"
                prefetch={false}
              >
                Guía de despliegue
              </Link>
              <Link
                href="https://github.com/albertodimas/brisa-cubana-clean-intelligence/blob/main/docs/product/rfc-public-components.md"
                className="text-brisa-600 underline-offset-4 transition-colors hover:underline dark:text-brisa-300"
                prefetch={false}
              >
                RFC de componentes públicos
              </Link>
            </div>
          </header>
        </ScrollReveal>

        {/* CheckoutClient - NO TOCAR LA LÓGICA, solo wrapper visual */}
        <ScrollReveal variant="fadeUp" delay={0.2}>
          <CheckoutClient
            services={services}
            publishableKey={publishableKey}
            isTestMode={isTestMode}
          />
        </ScrollReveal>
      </div>
    </main>
  );
}
