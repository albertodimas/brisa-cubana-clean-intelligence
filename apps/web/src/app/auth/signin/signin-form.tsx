"use client";

import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

export function SignInForm({ callbackUrl }: { callbackUrl: string }) {
  const [email, setEmail] = useState("demo@brisacubanaclean.com");
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    if (result?.error) {
      setError("Credenciales inválidas.");
      return;
    }

    window.location.href = result?.url ?? callbackUrl;
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-8 px-6 py-16 text-neutral-100">
      <div>
        <Link
          href="/"
          className="text-xs uppercase tracking-[0.3em] text-teal-300"
        >
          Brisa Cubana
        </Link>
        <h1 className="mt-4 text-3xl font-semibold text-white">
          Inicia sesión
        </h1>
        <p className="text-sm text-neutral-400">
          Usa las credenciales demo configuradas en {".env"}{" "}
          (`AUTH_DEMO_USERS`).
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-teal-400 focus:outline-none"
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span>Contraseña</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-teal-400 focus:outline-none"
            required
          />
        </label>

        {error ? (
          <p className="text-sm text-rose-400" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          className="rounded-full bg-gradient-to-r from-teal-400 via-emerald-400 to-emerald-300 py-2 text-sm font-semibold text-black transition hover:from-teal-300 hover:to-emerald-200"
        >
          Entrar
        </button>

        <Link
          href="/"
          className="text-center text-xs uppercase tracking-[0.3em] text-neutral-400 hover:text-teal-200"
        >
          Regresar a la landing
        </Link>
      </form>
    </div>
  );
}
