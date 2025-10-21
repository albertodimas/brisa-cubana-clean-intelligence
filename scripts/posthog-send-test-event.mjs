#!/usr/bin/env node

/**
 * Envía un evento de prueba a PostHog para verificar dashboards y alertas.
 *
 * Uso:
 *   POSTHOG_API_KEY=phc_live_xxx pnpm posthog:test-event checkout_payment_failed
 *
 * Argumentos:
 *   1) Nombre del evento (default: checkout_payment_failed)
 *   2) distinct_id opcional (default: brisa-cli-<uuid>)
 */

import { randomUUID } from "node:crypto";

const apiKey =
  process.env.POSTHOG_API_KEY ?? process.env.NEXT_PUBLIC_POSTHOG_KEY;
const host = (process.env.POSTHOG_HOST ?? "https://us.i.posthog.com").replace(
  /\/$/,
  "",
);
const eventName = process.argv[2] ?? "checkout_payment_failed";
const distinctId = process.argv[3] ?? `brisa-cli-${randomUUID()}`;

if (!apiKey) {
  console.error(
    "❌ Debes definir POSTHOG_API_KEY (o NEXT_PUBLIC_POSTHOG_KEY) antes de ejecutar este script.",
  );
  process.exit(1);
}

const payload = {
  api_key: apiKey,
  event: eventName,
  distinct_id: distinctId,
  properties: {
    source: "cli-test",
    environment: process.env.POSTHOG_ENV ?? "verification",
    sent_at: new Date().toISOString(),
  },
};

try {
  const response = await fetch(`${host}/capture/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Solicitud falló con status ${response.status}: ${response.statusText}\n${text}`,
    );
  }

  console.log(
    `✅ Evento "${eventName}" enviado a PostHog (${host}) con distinct_id "${distinctId}".`,
  );
} catch (error) {
  console.error("❌ No se pudo enviar el evento de prueba:", error);
  process.exit(1);
}
