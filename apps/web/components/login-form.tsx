"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import type { loginAction } from "@/app/actions";

type LoginAction = typeof loginAction;

type Props = {
  action: LoginAction;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      style={{
        width: "100%",
        padding: "0.8rem",
        borderRadius: "0.75rem",
        background: pending ? "rgba(126,231,196,0.3)" : "#14b8a6",
        color: "#041318",
        fontWeight: 600,
        cursor: pending ? "wait" : "pointer",
      }}
      disabled={pending}
    >
      {pending ? "Ingresando..." : "Ingresar"}
    </button>
  );
}

export function LoginForm({ action }: Props) {
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
    <form
      action={handleSubmit}
      style={{ display: "grid", gap: "1rem", width: "100%", maxWidth: "360px" }}
    >
      <div>
        <label style={labelStyle} htmlFor="email">
          Correo
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="admin@brisacubanaclean.com"
          style={inputStyle}
        />
      </div>
      <div>
        <label style={labelStyle} htmlFor="password">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          placeholder="Brisa123!"
          style={inputStyle}
        />
      </div>
      {message ? (
        <p style={{ color: "#fda4af", margin: 0 }}>{message}</p>
      ) : null}
      <SubmitButton />
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.75rem",
  borderRadius: "0.75rem",
  border: "1px solid rgba(126,231,196,0.3)",
  background: "rgba(5,12,16,0.9)",
  color: "#d5f6eb",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "0.35rem",
  color: "#a7dcd0",
  fontSize: "0.9rem",
};
