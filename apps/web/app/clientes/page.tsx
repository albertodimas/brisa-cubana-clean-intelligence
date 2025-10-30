import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ScrollReveal,
  StaggerContainer,
  StaggerItem,
  TiltCard,
  GradientMesh,
} from "@/components/ui";

export const metadata: Metadata = {
  title: "Portal Cliente · Brisa Cubana Clean Intelligence",
  description:
    "Explora la experiencia del portal cliente: reservas, notificaciones y soporte en tiempo real con Brisa Cubana Clean Intelligence.",
  alternates: {
    canonical: "/clientes",
  },
};

const highlights = [
  {
    title: "Dashboard personal",
    body: "Estado de cada servicio, formularios rápidos para reagendar y acceso a facturas digitales.",
  },
  {
    title: "Notificaciones en tiempo real",
    body: "Recibe confirmaciones instantáneas cuando nuestro equipo complete, reagende o actualice tu reserva.",
  },
  {
    title: "Soporte dedicado",
    body: "Canal directo con operaciones para resolver dudas en menos de 15 minutos en horario laboral.",
  },
];

const betaAccessFormUrl = "https://forms.gle/BrisaPortalBetaAccess2025";

const roadmapTimeline = [
  {
    title: "Beta privada",
    period: "Diciembre 2025",
    description:
      "Onboarding de los 5 clientes piloto actuales con seguimiento semanal y dashboards compartidos.",
  },
  {
    title: "Piloto ampliado",
    period: "Enero 2026",
    description:
      "Invitaremos hasta 15 cuentas de alto volumen para validar integraciones PMS y automatizaciones de QA.",
  },
  {
    title: "General Availability",
    period: "Q1 2026",
    description:
      "Portal abierto mediante magic links, soporte 24/7 y facturación automática para reservas confirmadas.",
  },
];

const accessModes = [
  {
    label: "Demo guiada",
    description:
      "Sesión en vivo con nuestro equipo. Mostramos flujos principales y resolvemos dudas en 30 minutos.",
  },
  {
    label: "Piloto controlado",
    description:
      "Activamos el portal para tu operación real durante 4 semanas con soporte dedicado y reportes semanales.",
  },
  {
    label: "Beta privada",
    description:
      "Acceso continuo con roadmap compartido, canal de feedback y priorización de features críticos.",
  },
];

export default function PortalClientePage() {
  const checkoutPublishableKey =
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
  const isCheckoutReady = checkoutPublishableKey.length > 0;

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-brisa-50 via-white to-brisa-100 px-4 py-16 text-gray-900 dark:from-brisa-950 dark:via-brisa-900 dark:to-brisa-950 dark:text-white sm:px-6 md:px-10">
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

      <div className="relative mx-auto grid max-w-4xl gap-12">
        <ScrollReveal variant="fadeDown" delay={0.1}>
          <header className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-xl backdrop-blur-md dark:border-brisa-700/40 dark:bg-brisa-900/70">
            <div className="pointer-events-none absolute -top-8 -right-4 hidden w-32 sm:block md:-top-10 md:-right-6 md:w-40">
              <Image
                src="/branding/brand-ai-concept.webp"
                alt="Logotipo Brisa Cubana Clean Intelligence"
                width={160}
                height={160}
                className="h-auto w-full rounded-full drop-shadow-lg"
              />
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-brisa-300/60 bg-brisa-50/80 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-brisa-600 dark:border-brisa-500/40 dark:bg-brisa-800/60 dark:text-brisa-200">
              Portal cliente · fase 2
            </span>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl dark:text-white">
              La experiencia Brisa Cubana, ahora también para tus clientes
            </h1>
            <p className="mt-4 max-w-2xl text-base text-gray-600 dark:text-brisa-200 sm:text-lg">
              Estamos construyendo un espacio donde tus inquilinos y
              propietarios puedan revisar reservaciones, descargar comprobantes
              y solicitar ajustes sin fricción. Mientras tanto, nuestro equipo
              de operaciones sigue disponible para ayudarte en tiempo real.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Link
                href="/checkout"
                prefetch={false}
                className="inline-flex items-center justify-center rounded-full bg-brisa-600 px-5 py-2.5 text-sm font-semibold tracking-wide text-white shadow-lg shadow-brisa-300/40 transition-transform hover:-translate-y-0.5 hover:bg-brisa-700 dark:bg-brisa-400 dark:text-brisa-900 dark:shadow-brisa-900/30 dark:hover:bg-brisa-300"
              >
                Solicitar un servicio demo
              </Link>
              <Link
                href="mailto:operaciones@brisacubanacleanintelligence.com"
                prefetch={false}
                className="inline-flex items-center justify-center rounded-full border border-brisa-500/50 px-5 py-2.5 text-sm font-semibold tracking-wide text-brisa-600 transition-colors hover:bg-brisa-100 dark:border-brisa-400/50 dark:text-brisa-200 dark:hover:bg-brisa-800/60"
              >
                Coordinar piloto con operaciones →
              </Link>
            </div>
            {!isCheckoutReady ? (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900 dark:border-amber-600/40 dark:bg-amber-900/40 dark:text-amber-100">
                <p className="font-semibold">Checkout en modo demo</p>
                <p className="mt-1 text-xs text-amber-800/80 dark:text-amber-100/80">
                  Mientras integramos Stripe en producción confirmaremos los
                  pagos a través del equipo de operaciones. Agenda tu demo y
                  procesaremos el cobro manualmente.
                </p>
              </div>
            ) : null}
          </header>
        </ScrollReveal>

        <StaggerContainer
          className="grid gap-6 sm:grid-cols-2"
          staggerDelay={0.15}
        >
          {highlights.map((item) => (
            <StaggerItem key={item.title}>
              <TiltCard
                maxTilt={6}
                glowEffect
                glowColor="rgba(20, 184, 166, 0.15)"
              >
                <article className="group rounded-2xl border border-white/70 bg-white/80 p-6 shadow-lg shadow-brisa-200/40 h-full dark:border-brisa-700/40 dark:bg-brisa-900/70 dark:shadow-brisa-950/50">
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-brisa-100/80 text-brisa-600 group-hover:bg-brisa-200 dark:bg-brisa-800/60 dark:text-brisa-200">
                    <span className="text-lg">•</span>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {item.title}
                  </h2>
                  <p className="mt-2 text-sm text-gray-600 dark:text-brisa-200">
                    {item.body}
                  </p>
                </article>
              </TiltCard>
            </StaggerItem>
          ))}
          <StaggerItem>
            <article className="rounded-2xl border border-white/70 bg-gradient-to-br from-brisa-200/80 via-brisa-100/80 to-white/90 p-6 shadow-lg shadow-brisa-200/40 h-full dark:border-brisa-600/40 dark:from-brisa-800/70 dark:via-brisa-900/60 dark:to-brisa-950/60 dark:shadow-brisa-950/40">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Roadmap público
              </h2>
              <p className="mt-2 text-sm text-gray-700 dark:text-brisa-200">
                Sigue el progreso desde la definición hasta el lanzamiento en
                producción. Documentamos cada fase, decisiones de diseño y
                mecanismos de soporte.
              </p>
              <Link
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brisa-700 transition-colors hover:text-brisa-900 dark:text-brisa-200 dark:hover:text-brisa-100"
                href="https://github.com/albertodimas/brisa-cubana-clean-intelligence/blob/main/docs/product/rfc-public-components.md#81-portal-cliente"
                prefetch={false}
              >
                Ver RFC actualizado →
              </Link>
            </article>
          </StaggerItem>
        </StaggerContainer>

        <ScrollReveal variant="fadeUp" delay={0.15}>
          <section className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-xl backdrop-blur-md dark:border-brisa-700/40 dark:bg-brisa-900/70">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Hitos del lanzamiento
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-brisa-200">
              Compartimos el roadmap público para que planifiques tus
              integraciones y definas cuándo migrar flujos críticos al portal.
            </p>
            <ol className="mt-6 space-y-4">
              {roadmapTimeline.map((item) => (
                <li
                  key={item.title}
                  className="relative rounded-2xl border border-brisa-100/80 bg-white/90 p-4 shadow-sm dark:border-brisa-700/40 dark:bg-brisa-900/70"
                >
                  <span className="text-xs uppercase tracking-[0.3em] text-brisa-500 dark:text-brisa-300">
                    {item.period}
                  </span>
                  <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-brisa-200">
                    {item.description}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        </ScrollReveal>

        <ScrollReveal variant="fadeUp" delay={0.2}>
          <section className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-xl backdrop-blur-md dark:border-brisa-700/40 dark:bg-brisa-900/70">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Cómo funciona cada acceso
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {accessModes.map((mode) => (
                <div
                  key={mode.label}
                  className="rounded-2xl border border-brisa-100/80 bg-white/90 p-4 text-sm text-gray-700 shadow-sm dark:border-brisa-700/50 dark:bg-brisa-900/70 dark:text-brisa-200"
                >
                  <h3 className="text-base font-semibold text-brisa-600 dark:text-brisa-200">
                    {mode.label}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed">
                    {mode.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </ScrollReveal>

        <ScrollReveal variant="fadeUp" delay={0.2}>
          <section className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-xl backdrop-blur-md dark:border-brisa-700/40 dark:bg-brisa-900/70">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              ¿Quieres participar en la beta?
            </h2>
            <p className="mt-3 text-sm text-gray-600 dark:text-brisa-200">
              Estamos priorizando a clientes con flujo recurrente de reservas.
              Completa el siguiente formulario para recibir acceso anticipado y
              formar parte del programa de feedback.
            </p>
            <a
              className="mt-5 inline-flex items-center justify-center rounded-full border border-brisa-500/50 px-5 py-2.5 text-sm font-semibold tracking-wide text-brisa-600 transition-colors hover:bg-brisa-100 dark:border-brisa-400/50 dark:text-brisa-200 dark:hover:bg-brisa-800/60"
              href={betaAccessFormUrl}
              target="_blank"
              rel="noreferrer"
            >
              Solicitar acceso anticipado →
            </a>
          </section>
        </ScrollReveal>
      </div>
    </main>
  );
}
