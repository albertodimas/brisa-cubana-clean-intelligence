import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata, Route } from "next";
import { loginAction } from "@/app/actions";
import { LoginForm } from "@/components/login-form";
import { auth } from "@/auth";
import { GradientMesh, ScrollReveal } from "@/components/ui";

const betaAccessFormUrl = "https://forms.gle/BrisaPortalBetaAccess2025";

export const metadata: Metadata = {
  title: "Iniciar sesión · Brisa Cubana Clean Intelligence",
  description:
    "Accede al panel operativo para gestionar servicios, reservas y notificaciones en Brisa Cubana Clean Intelligence.",
  alternates: {
    canonical: "/login",
  },
};

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/panel" as Route);
  }

  const portalLoginEnabled =
    process.env.NEXT_PUBLIC_PORTAL_LOGIN_ENABLED === "true";
  const defaultTenantSlug =
    process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG ?? "brisa-cubana";

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-8 bg-gradient-to-br from-brisa-950 via-brisa-900 to-brisa-950 px-6 py-8 text-brisa-50">
      {/* Gradient Mesh Background - Premium Effect */}
      <GradientMesh
        colors={{
          primary: "rgba(20, 184, 166, 0.25)",
          secondary: "rgba(139, 92, 246, 0.2)",
          accent: "rgba(6, 182, 212, 0.25)",
        }}
        opacity={0.3}
        shimmer
      />

      <div className="pointer-events-none absolute top-6 left-6 hidden items-center gap-3 rounded-full bg-white/90 px-4 py-2 shadow-lg shadow-brisa-900/10 backdrop-blur-sm dark:bg-brisa-900/80 md:flex">
        <Image
          src="/branding/brand-ai-concept.webp"
          alt="Logotipo Brisa Cubana Clean Intelligence"
          width={42}
          height={42}
          className="h-10 w-10 rounded-full"
        />
        <span className="text-xs font-semibold uppercase tracking-[0.32em] text-brisa-600 dark:text-brisa-200">
          Brisa Cubana
        </span>
      </div>

      <div className="relative z-10 w-full max-w-md space-y-8 rounded-[2.5rem] border border-white/10 bg-brisa-950/70 p-6 shadow-2xl shadow-[#00000040] backdrop-blur-md dark:border-brisa-700/50 dark:bg-brisa-950/70 md:p-10">
        <ScrollReveal variant="fadeDown" delay={0.1}>
          <header className="space-y-3 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/10 border border-white/20">
              <Image
                src="/branding/brand-ai-concept.webp"
                alt="Brisa Cubana icono"
                width={60}
                height={60}
                className="h-14 w-14 rounded-full"
              />
            </div>
            <h1 className="text-3xl font-semibold sm:text-4xl">
              Panel operativo Brisa Cubana
            </h1>
            <p className="mx-auto max-w-sm text-sm text-brisa-200 sm:text-base">
              {portalLoginEnabled
                ? "Usa tus credenciales internas para administrar servicios y reservas. Si no tienes acceso, contacta a Plataforma & Engineering."
                : "El portal está en beta privada. Solicita acceso anticipado o coordina con operaciones para activar tu cuenta durante el piloto."}
            </p>
          </header>
        </ScrollReveal>

        {portalLoginEnabled ? (
          <ScrollReveal variant="fadeUp" delay={0.2}>
            <LoginForm
              action={loginAction}
              defaultTenantSlug={defaultTenantSlug}
            />
          </ScrollReveal>
        ) : (
          <ScrollReveal variant="fadeUp" delay={0.2}>
            <div className="w-full rounded-3xl border border-white/10 bg-brisa-950/50 p-6 text-sm text-brisa-200 shadow-xl backdrop-blur-lg sm:p-8">
              <p>
                Accederemos tu cuenta cuando formes parte del programa piloto.
                Mientras tanto puedes:
              </p>
              <ul className="mt-4 space-y-3 text-left">
                <li>
                  • Completar el formulario de beta privada para priorizar tu
                  onboarding.
                </li>
                <li>
                  • Coordinar un piloto con operaciones y recibir reportes por
                  email.
                </li>
              </ul>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <a
                  href={betaAccessFormUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex flex-1 items-center justify-center rounded-full bg-brisa-500 px-4 py-2 text-sm font-semibold text-brisa-950 transition-colors hover:bg-brisa-400"
                >
                  Solicitar acceso anticipado
                </a>
                <a
                  href="mailto:operaciones@brisacubanacleanintelligence.com"
                  className="inline-flex flex-1 items-center justify-center rounded-full border border-brisa-400 px-4 py-2 text-sm font-semibold text-brisa-200 transition-colors hover:bg-brisa-900"
                >
                  Escribir a operaciones
                </a>
              </div>
            </div>
          </ScrollReveal>
        )}

        <ScrollReveal variant="fadeIn" delay={0.35}>
          <div className="pt-2 text-center text-xs text-brisa-300 sm:text-sm">
            Operación 24/7 con checklists hoteleros, portal cliente y reportes
            QA <span aria-hidden>·</span> Miami, Florida
          </div>
        </ScrollReveal>

        <ScrollReveal variant="fadeIn" delay={0.45}>
          <div className="text-center text-sm">
            <Link
              href="/"
              className="text-brisa-300 transition-colors hover:text-brisa-200 underline-offset-4 hover:underline"
            >
              ← Volver al inicio
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </main>
  );
}
