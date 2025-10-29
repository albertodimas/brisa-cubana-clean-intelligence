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

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center gap-8 bg-gradient-to-br from-brisa-950 via-brisa-900 to-brisa-950 text-brisa-50 px-6 py-8">
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

      <div className="relative z-10 w-full max-w-md space-y-8">
        <ScrollReveal variant="fadeDown" delay={0.1}>
          <header className="text-center space-y-3">
            <h1 className="text-3xl sm:text-4xl font-semibold text-brisa-50">
              Bienvenido
            </h1>
            <p className="text-sm sm:text-base text-brisa-200 max-w-sm mx-auto">
              {portalLoginEnabled
                ? "Usa tus credenciales internas para administrar servicios y reservas. Si no tienes acceso, contacta a Plataforma & Engineering."
                : "El portal está en beta privada. Solicita acceso anticipado o coordina con operaciones para activar tu cuenta durante el piloto."}
            </p>
          </header>
        </ScrollReveal>

        {portalLoginEnabled ? (
          <ScrollReveal variant="fadeUp" delay={0.2}>
            <LoginForm action={loginAction} />
          </ScrollReveal>
        ) : (
          <ScrollReveal variant="fadeUp" delay={0.2}>
            <div className="w-full rounded-3xl border border-brisa-600/30 bg-brisa-950/40 p-6 sm:p-8 text-sm text-brisa-200 shadow-xl">
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

        <ScrollReveal variant="fadeIn" delay={0.3}>
          <div className="text-center">
            <Link
              href="/"
              className="text-sm text-brisa-300 hover:text-brisa-200 transition-colors underline-offset-4 hover:underline"
            >
              ← Volver al inicio
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </main>
  );
}
