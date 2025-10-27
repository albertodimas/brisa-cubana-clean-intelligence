import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata, Route } from "next";
import { loginAction } from "@/app/actions";
import { LoginForm } from "@/components/login-form";
import { auth } from "@/auth";
import { GradientMesh, ScrollReveal } from "@/components/ui";

export const metadata: Metadata = {
  title: "Iniciar sesión · Brisa Cubana Clean Intelligence",
  description:
    "Accede al panel operativo para gestionar servicios, reservas y notificaciones en Brisa Cubana Clean Intelligence.",
};

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/panel" as Route);
  }

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
              Usa tus credenciales internas para administrar servicios y
              reservas. Si no tienes acceso, contacta a Plataforma &
              Engineering.
            </p>
          </header>
        </ScrollReveal>

        <ScrollReveal variant="fadeUp" delay={0.2}>
          <LoginForm action={loginAction} />
        </ScrollReveal>

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
