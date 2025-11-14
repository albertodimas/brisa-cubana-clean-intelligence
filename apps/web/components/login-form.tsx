"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import type { loginAction } from "@/app/actions";
import { Input, Button } from "@/components/ui";

type LoginAction = typeof loginAction;

type Props = {
  action: LoginAction;
  defaultTenantSlug?: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="primary"
      size="lg"
      isLoading={pending}
      className="w-full bg-brisa-500 hover:bg-brisa-600 text-white font-semibold shadow-lg"
    >
      {pending ? "Ingresando..." : "Ingresar"}
    </Button>
  );
}

export function LoginForm({ action, defaultTenantSlug }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    const result = await action(formData);
    if (result?.success) {
      router.replace("/panel" as Route);
      router.refresh();
      return;
    }
    setMessage(result?.error ?? "Error desconocido");
  }

  return (
    <div className="w-full rounded-3xl glass-strong p-6 sm:p-8 shadow-xl">
      <form action={handleSubmit} className="space-y-5">
        <Input
          id="email"
          name="email"
          type="email"
          label="Correo"
          placeholder="admin@brisacubanacleanintelligence.com"
          required
          autoComplete="email"
        />

        <Input
          id="password"
          name="password"
          type="password"
          label="Contraseña"
          placeholder="Brisa123!"
          required
          autoComplete="current-password"
        />

        <Input
          id="tenantSlug"
          name="tenantSlug"
          label="Código de tenant"
          placeholder="brisa-cubana"
          defaultValue={defaultTenantSlug}
          autoComplete="organization"
        />

        {message && (
          <div className="rounded-lg bg-red-950/40 border border-red-800/50 p-3 text-sm text-red-300">
            {message}
          </div>
        )}

        <SubmitButton />
      </form>
    </div>
  );
}
