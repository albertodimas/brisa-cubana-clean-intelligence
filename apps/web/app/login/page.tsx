import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { loginAction } from "@/app/actions";
import { LoginForm } from "@/components/login-form";

export const metadata = {
  title: "Iniciar sesión · Brisa Cubana",
};

export default async function LoginPage() {
  const store = await cookies();
  const token = store.get("auth_token");
  if (token) {
    redirect("/");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "2rem",
        background: "linear-gradient(135deg, #021218, #041f2a)",
        color: "#d5f6eb",
        padding: "2rem 1.5rem",
      }}
    >
      <header style={{ textAlign: "center", maxWidth: "420px" }}>
        <h1 style={{ marginBottom: "0.75rem", fontSize: "2.2rem" }}>Bienvenido</h1>
        <p style={{ margin: 0, color: "#a7dcd0" }}>
          Usa tus credenciales internas para administrar servicios y reservas. Si no tienes acceso,
          contacta a Plataforma & Engineering.
        </p>
      </header>
      <LoginForm action={loginAction} />
      <Link href="/" style={{ color: "#7ee7c4" }}>
        Volver al inicio
      </Link>
    </main>
  );
}
