# Slack Webhook · Leads con UTM

**Última actualización:** 23 de octubre de 2025

Este flujo envía cada solicitud del formulario de diagnóstico a un canal Slack (`#leads-operaciones`) junto con los parámetros UTM y datos básicos del cliente.

## 1. Supuestos

- Formulario web envía `POST /api/leads` con los campos:
  - `fullName`, `email`, `phone`, `serviceInterest`
  - `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`
- Slack Incoming Webhook ya creado (URL en `SLACK_WEBHOOK_URL`).

## 2. Serverless Handler (Node/TypeScript)

```ts
import type { NextRequest } from "next/server";

const webhookUrl = process.env.SLACK_WEBHOOK_URL ?? "";

export async function POST(request: NextRequest) {
  const payload = await request.json();

  if (!webhookUrl) {
    return new Response("Missing SLACK_WEBHOOK_URL", { status: 500 });
  }

  const {
    fullName,
    email,
    phone,
    serviceInterest,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
  } = payload;

  const text = [
    `📥 *Nuevo lead recibido*`,
    `*Nombre*: ${fullName ?? "N/D"}`,
    `*Email*: ${email ?? "N/D"}`,
    phone ? `*Teléfono*: ${phone}` : null,
    serviceInterest ? `*Servicio*: ${serviceInterest}` : null,
    `*UTM Source*: ${utm_source ?? "N/D"}`,
    `*UTM Medium*: ${utm_medium ?? "N/D"}`,
    utm_campaign ? `*Campaña*: ${utm_campaign}` : null,
    utm_content ? `*Contenido*: ${utm_content}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const slackPayload = {
    text,
    blocks: [
      {
        type: "section",
        text: { type: "mrkdwn", text },
      },
      {
        type: "context",
        elements: [
          { type: "mrkdwn", text: `📅 ${new Date().toLocaleString()}` },
        ],
      },
    ],
  };

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(slackPayload),
  });

  return new Response(null, { status: 204 });
}
```

> Si usas otra plataforma (Zapier, Make), replica el mismo payload y añade un paso que escriba en Google Sheets/Airtable antes de notificar a Slack.

## 3. Google Sheets / Airtable

- Añade columnas `follow_up_owner`, `status`, `response_time`.
- Guarda la fila cada vez que llegue un lead para facilitar reporting.

## 4. Variables de entorno

```
SLACK_WEBHOOK_URL=<tu_url>
```

## 5. Validaciones recomendadas

- Rate limiting por IP para evitar spam.
- Verificar formato de email/teléfono antes de enviar a Slack.
- Registrar errores (Sentry/PostHog) cuando Slack responda con código ≠ 2xx.

## 6. Próximos pasos

- Conectar este endpoint al formulario (`fetch('/api/leads', { method: 'POST', body: JSON.stringify(data) })`).
- Añadir botones en Slack (Block Kit) si quieres permitir asignar el lead con un clic.
